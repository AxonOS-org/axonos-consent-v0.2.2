// Copyright (c) 2026 Denis Yermakou / AxonOS
// SPDX-License-Identifier: Apache-2.0 OR MIT
//
// This file is part of the AxonOS Consent Engine.
// See LICENSE-APACHE or LICENSE-MIT for details.

//! CBOR codec — security-bounded, zero-alloc. MMP §7 wire format.

use crate::frames::*;
use crate::reason::ReasonCode;

// ... (SECURITY LIMITS и ERRORS остаются без изменений) ...

// ═══════════════════════════════════════════════════════════════════
//  ENCODER — zero-alloc, writes to caller buffer, returns Result
// ═══════════════════════════════════════════════════════════════════

pub const MAX_ENCODED_SIZE: usize = 256;

/// Encode a ConsentFrame. Returns bytes written or BufferTooSmall.
pub fn encode(frame: &ConsentFrame, out: &mut [u8]) -> Result<usize, EncodeError> {
    let mut w = Writer { buf: out, pos: 0 };

    match frame {
        ConsentFrame::Withdraw(f) => {
            let n = 2 + f.reason_code.is_some() as u64 + f.reason.is_some() as u64
                + f.epoch.is_some() as u64 + f.timestamp_ms.is_some() as u64
                + f.timestamp_us.is_some() as u64;
            w.map(n)?; w.text("type")?; w.text("consent-withdraw")?;
            w.text("scope")?; w.text(f.scope.as_str())?;
            
            if let Some(rc) = f.reason_code {
                w.text("reasonCode")?;
                w.uint(rc.to_u8() as u64)?;
            }
            if let Some(r) = &f.reason {
                w.text("reason")?;
                w.text(r.as_str())?;
            }
            if let Some(e) = f.epoch { w.text("epoch")?; w.uint(e)?; }
            if let Some(t) = f.timestamp_ms { w.text("timestamp")?; w.uint(t)?; }
            if let Some(t) = f.timestamp_us { w.text("timestamp_us")?; w.uint(t)?; }
        }
        ConsentFrame::Suspend(f) => {
            let n = 1 + f.reason_code.is_some() as u64 + f.reason.is_some() as u64
                + f.timestamp_ms.is_some() as u64 + f.timestamp_us.is_some() as u64;
            w.map(n)?; w.text("type")?; w.text("consent-suspend")?;
            if let Some(rc) = f.reason_code { w.text("reasonCode")?; w.uint(rc.to_u8() as u64)?; }
            if let Some(r) = &f.reason {
                w.text("reason")?;
                w.text(r.as_str())?;
            }
            if let Some(t) = f.timestamp_ms { w.text("timestamp")?; w.uint(t)?; }
            if let Some(t) = f.timestamp_us { w.text("timestamp_us")?; w.uint(t)?; }
        }
        ConsentFrame::Resume(f) => {
            let n = 1 + f.timestamp_ms.is_some() as u64 + f.timestamp_us.is_some() as u64;
            w.map(n)?; w.text("type")?; w.text("consent-resume")?;
            if let Some(t) = f.timestamp_ms { w.text("timestamp")?; w.uint(t)?; }
            if let Some(t) = f.timestamp_us { w.text("timestamp_us")?; w.uint(t)?; }
        }
    }
    Ok(w.pos)
}

// ═══════════════════════════════════════════════════════════════════
//  DECODER — bounded, duplicate-safe, explicit type rejection
// ═══════════════════════════════════════════════════════════════════

pub fn decode(data: &[u8]) -> Result<ConsentFrame, DecodeError> {
    let mut c = Cursor { data, pos: 0 };

    let map_len = c.read_map_len()?;
    if map_len > MAX_MAP_FIELDS { return Err(DecodeError::MapTooLarge); }

    let mut seen: u8 = 0;
    let mut frame_type: Option<FrameType> = None;
    let mut scope: Option<Scope> = None;
    let mut reason_code: Option<ReasonCode> = None;
    let mut reason: Option<ReasonBuf> = None;
    let mut epoch: Option<u64> = None;
    let mut timestamp_ms: Option<u64> = None;
    let mut timestamp_us: Option<u64> = None;

    for _ in 0..map_len {
        let key = c.read_text_bounded()?;

        match key {
            "type" => {
                if seen & 0x01 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x01;
                frame_type = Some(match c.read_text_bounded()? {
                    "consent-withdraw" => FrameType::Withdraw,
                    "consent-suspend" => FrameType::Suspend,
                    "consent-resume" => FrameType::Resume,
                    _ => return Err(DecodeError::UnknownFrameType),
                });
            }
            "scope" => {
                if seen & 0x02 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x02;
                let s = c.read_text_bounded()?;
                // ИСПОЛЬЗУЕМ НОВЫЙ МЕТОД: from_ident
                scope = Some(Scope::from_ident(s).ok_or(DecodeError::UnknownScope)?);
            }
            "reasonCode" => {
                if seen & 0x04 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x04;
                reason_code = Some(ReasonCode::from_u8(c.read_uint()? as u8));
            }
            "reason" => {
                if seen & 0x08 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x08;
                // ИСПОЛЬЗУЕМ НОВЫЙ МЕТОД: new_from_str
                reason = Some(ReasonBuf::new_from_str(c.read_text_bounded()?));
            }
            "epoch" => {
                if seen & 0x10 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x10;
                epoch = Some(c.read_uint()?);
            }
            "timestamp" => {
                if seen & 0x20 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x20;
                timestamp_ms = Some(c.read_uint()?);
            }
            "timestamp_us" => {
                if seen & 0x40 != 0 { return Err(DecodeError::DuplicateKey); } seen |= 0x40;
                timestamp_us = Some(c.read_uint()?);
            }
            _ => { c.skip_value(0)?; }
        }
    }

    let ft = frame_type.ok_or(DecodeError::MissingTypeField)?;
    match ft {
        FrameType::Withdraw => {
            let s = scope.ok_or(DecodeError::MissingScopeField)?;
            Ok(ConsentFrame::Withdraw(ConsentWithdraw {
                scope: s, reason_code, reason, epoch, timestamp_ms, timestamp_us,
            }))
        }
        FrameType::Suspend => Ok(ConsentFrame::Suspend(ConsentSuspend {
            reason_code, reason, timestamp_ms, timestamp_us,
        })),
        FrameType::Resume => Ok(ConsentFrame::Resume(ConsentResume {
            timestamp_ms, timestamp_us,
        })),
    }
}

// ... (остальной код PRITIMITIVES остается без изменений) ...
