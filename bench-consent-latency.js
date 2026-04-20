#!/usr/bin/env node
'use strict';

/**
 * MMP Consent Extension — Node.js latency benchmark
 *
 * Measures p50 (median) and p99 latency for:
 *   1. processFrame  — invariants → state transition (pre-parsed frame)
 *   2. processRaw    — parseFrame + processFrame (JSON string → state transition)
 *   3. withdrawAll   — emergency global kill-switch across all peers
 *
 * Methodology:
 *   - 10,000 iterations per operation
 *   - process.hrtime.bigint() for nanosecond-precision timing
 *   - Warm-up pass (1,000 iterations) discarded before measurement
 *   - GC forced between operation groups (if --expose-gc)
 *   - Results reported as p50/p99 in microseconds
 *
 * This is soft-real-time latency characterisation, NOT WCET.
 * Node.js provides no formal worst-case guarantee due to V8 GC pauses.
 *
 * For the joint paper §4.4: label Node.js column as "p50 / p99 (soft real-time)"
 * versus AxonOS Rust column as "WCET (instruction-count derived)".
 *
 * Usage:
 *   node bench-consent-latency.js
 *   node --expose-gc bench-consent-latency.js   (recommended: forces GC between groups)
 *
 * Copyright (c) 2026 SYM.BOT Ltd.
 */

const SYM_PATH = process.env.SYM_PATH || require('path').join(
  process.env.APPDATA || '', 'npm', 'node_modules', '@sym-bot', 'sym'
);
const { ConsentEngine } = require(SYM_PATH + '/lib/consent/engine');
const { parseFrame } = require(SYM_PATH + '/lib/consent/frames');
const { ConsentState, FrameType } = require(SYM_PATH + '/lib/consent/state');

// ── Test fixtures ─────────────────────────────────────────────

// Canonical consent-withdraw frame (TV-001 shape)
const WITHDRAW_JSON = JSON.stringify({
  type: 'consent-withdraw',
  scope: 'peer',
  reasonCode: 1,
  reason: 'User initiated disconnect',
  timestamp: 1712345678000,
  timestamp_us: 1712345678000000,
});

// Canonical consent-suspend frame (TV-004 shape)
const SUSPEND_JSON = JSON.stringify({
  type: 'consent-suspend',
  reasonCode: 1,
  timestamp: 1712345678000,
});

// Canonical consent-resume frame (TV-006 shape)
const RESUME_JSON = JSON.stringify({
  type: 'consent-resume',
  timestamp: 1712345678000,
});

// Pre-parsed frames for processFrame benchmarks
const WITHDRAW_FRAME = parseFrame(JSON.parse(WITHDRAW_JSON)).frame;
const SUSPEND_FRAME = parseFrame(JSON.parse(SUSPEND_JSON)).frame;
const RESUME_FRAME = parseFrame(JSON.parse(RESUME_JSON)).frame;

// ── Helpers ───────────────────────────────────────────────────

const ITERATIONS = 10_000;
const WARMUP = 1_000;

function percentile(sorted, p) {
  const idx = Math.ceil(sorted.length * p / 100) - 1;
  return sorted[Math.max(0, idx)];
}

function forceGC() {
  if (typeof global.gc === 'function') {
    global.gc();
  }
}

function nsToUs(ns) {
  return Number(ns) / 1000;
}

function runBench(name, setupFn, benchFn) {
  // Warm-up
  for (let i = 0; i < WARMUP; i++) {
    const ctx = setupFn();
    benchFn(ctx);
  }

  forceGC();

  // Measurement
  const timings = new Array(ITERATIONS);
  for (let i = 0; i < ITERATIONS; i++) {
    const ctx = setupFn();
    const start = process.hrtime.bigint();
    benchFn(ctx);
    const end = process.hrtime.bigint();
    timings[i] = end - start;
  }

  // Sort for percentile calculation
  timings.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const p50 = nsToUs(percentile(timings, 50));
  const p99 = nsToUs(percentile(timings, 99));
  const min = nsToUs(timings[0]);
  const max = nsToUs(timings[timings.length - 1]);
  const mean = nsToUs(timings.reduce((a, b) => a + b, 0n) / BigInt(ITERATIONS));

  return { name, p50, p99, min, max, mean, iterations: ITERATIONS };
}

// ── Benchmark: processFrame (pre-parsed) ─────────────────────

function benchProcessFrame_withdraw() {
  return runBench(
    'processFrame (withdraw: granted → withdrawn)',
    () => {
      const engine = new ConsentEngine();
      engine.registerPeer('peer-001', 1000);
      return engine;
    },
    (engine) => {
      engine.processFrame('peer-001', WITHDRAW_FRAME, 2000);
    }
  );
}

function benchProcessFrame_suspend() {
  return runBench(
    'processFrame (suspend: granted → suspended)',
    () => {
      const engine = new ConsentEngine();
      engine.registerPeer('peer-001', 1000);
      return engine;
    },
    (engine) => {
      engine.processFrame('peer-001', SUSPEND_FRAME, 2000);
    }
  );
}

function benchProcessFrame_resume() {
  return runBench(
    'processFrame (resume: suspended → granted)',
    () => {
      const engine = new ConsentEngine();
      engine.registerPeer('peer-001', 1000);
      engine.processFrame('peer-001', SUSPEND_FRAME, 1500);
      return engine;
    },
    (engine) => {
      engine.processFrame('peer-001', RESUME_FRAME, 2000);
    }
  );
}

// ── Benchmark: processRaw (JSON string → state transition) ───

function benchProcessRaw_withdraw() {
  return runBench(
    'processRaw (withdraw: JSON parse + invariants + transition)',
    () => {
      const engine = new ConsentEngine();
      engine.registerPeer('peer-001', 1000);
      return engine;
    },
    (engine) => {
      const parsed = parseFrame(JSON.parse(WITHDRAW_JSON));
      engine.processFrame('peer-001', parsed.frame, 2000);
    }
  );
}

function benchProcessRaw_suspend() {
  return runBench(
    'processRaw (suspend: JSON parse + invariants + transition)',
    () => {
      const engine = new ConsentEngine();
      engine.registerPeer('peer-001', 1000);
      return engine;
    },
    (engine) => {
      const parsed = parseFrame(JSON.parse(SUSPEND_JSON));
      engine.processFrame('peer-001', parsed.frame, 2000);
    }
  );
}

// ── Benchmark: withdrawAll ───────────────────────────────────

function benchWithdrawAll() {
  return runBench(
    'withdrawAll (8 peers, emergency kill-switch)',
    () => {
      const engine = new ConsentEngine();
      for (let i = 0; i < 8; i++) {
        engine.registerPeer(`peer-${String(i).padStart(3, '0')}`, 1000 + i);
      }
      // Suspend 4, leave 4 granted — mixed state table
      engine.processFrame('peer-001', SUSPEND_FRAME, 1500);
      engine.processFrame('peer-003', SUSPEND_FRAME, 1500);
      engine.processFrame('peer-005', SUSPEND_FRAME, 1500);
      engine.processFrame('peer-007', SUSPEND_FRAME, 1500);
      return engine;
    },
    (engine) => {
      engine.withdrawAll(0x01, 2000);
    }
  );
}

// ── Run all benchmarks ───────────────────────────────────────

console.log('MMP Consent Extension — Node.js Latency Benchmark');
console.log('='.repeat(60));
console.log(`Platform:   ${process.platform} ${process.arch}`);
console.log(`Node.js:    ${process.version}`);
console.log(`V8:         ${process.versions.v8}`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()} (+ ${WARMUP.toLocaleString()} warm-up)`);
console.log(`GC control: ${typeof global.gc === 'function' ? 'yes (--expose-gc)' : 'no'}`);
console.log(`Date:       ${new Date().toISOString()}`);
console.log('='.repeat(60));
console.log();

const results = [];

console.log('── processFrame (pre-parsed frame) ──────────────────');
results.push(benchProcessFrame_withdraw());
forceGC();
results.push(benchProcessFrame_suspend());
forceGC();
results.push(benchProcessFrame_resume());
forceGC();

console.log();
console.log('── processRaw (JSON string → full pipeline) ────────');
results.push(benchProcessRaw_withdraw());
forceGC();
results.push(benchProcessRaw_suspend());
forceGC();

console.log();
console.log('── withdrawAll (emergency) ──────────────────────────');
results.push(benchWithdrawAll());

console.log();
console.log('── Results ──────────────────────────────────────────');
console.log();

// Table header
console.log('| Operation | p50 (μs) | p99 (μs) | min (μs) | max (μs) |');
console.log('|:---|:---:|:---:|:---:|:---:|');

for (const r of results) {
  console.log(
    `| ${r.name} | ${r.p50.toFixed(2)} | ${r.p99.toFixed(2)} | ${r.min.toFixed(2)} | ${r.max.toFixed(2)} |`
  );
}

console.log();
console.log('── Paper-ready summary (§4.4) ──────────────────────');
console.log();

// Aggregate processFrame and processRaw
const pfResults = results.filter(r => r.name.startsWith('processFrame'));
const prResults = results.filter(r => r.name.startsWith('processRaw'));
const waResult = results.find(r => r.name.startsWith('withdrawAll'));

const pfP50 = Math.max(...pfResults.map(r => r.p50));
const pfP99 = Math.max(...pfResults.map(r => r.p99));
const prP50 = Math.max(...prResults.map(r => r.p50));
const prP99 = Math.max(...prResults.map(r => r.p99));

console.log('| Operation | p50 (μs) | p99 (μs) | Notes |');
console.log('|:---|:---:|:---:|:---|');
console.log(`| processFrame | ${pfP50.toFixed(2)} | ${pfP99.toFixed(2)} | Pre-parsed frame, invariants + transition |`);
console.log(`| processRaw | ${prP50.toFixed(2)} | ${prP99.toFixed(2)} | JSON.parse + parseFrame + processFrame |`);
console.log(`| withdrawAll | ${waResult.p50.toFixed(2)} | ${waResult.p99.toFixed(2)} | 8 peers, mixed granted/suspended |`);
console.log();
console.log('Soft real-time characterisation. V8 GC pauses are the only upper bound.');
console.log('Node.js provides no formal WCET guarantee.');
