#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

GATES = {
    "01": "Repository surface",
    "02": "Archive notice",
    "03": "README presence",
    "04": "License surface",
    "05": "Cargo metadata advisory",
    "06": "Rust format advisory",
    "07": "Rust tests advisory",
    "08": "No obvious secrets",
    "09": "No generated artifacts",
    "10": "Markdown surface",
    "11": "Security surface",
    "12": "IP and ownership surface",
    "13": "Version/reference surface",
    "14": "File size sanity",
    "15": "Workflow syntax surface",
    "16": "Archive status document",
    "17": "Final archival readiness",
}

SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    re.compile(r"ghp_[A-Za-z0-9_]{30,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{30,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"(?i)\bseed phrase\b\s*[:=]"),
    re.compile(r"(?i)\bprivate key\b\s*[:=]\s*[A-Za-z0-9]{20,}"),
]

TEXT_SUFFIXES = {
    ".md", ".txt", ".toml", ".rs", ".py", ".yml", ".yaml", ".json",
    ".lock", ".gitignore", ".cfg", ".ini"
}

GENERATED_DIRS = (
    "target/",
    "dist/",
    "node_modules/",
    ".next/",
    "build/",
    "coverage/",
)

MAX_FILE_BYTES = 2_000_000


def run(cmd: list[str]) -> tuple[int, str]:
    res = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    return res.returncode, (res.stdout + res.stderr).strip()


def tracked() -> list[str]:
    code, out = run(["git", "ls-files"])
    if code != 0:
        print(out)
        return []
    return [x.strip() for x in out.splitlines() if x.strip()]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def exists_any(names: list[str]) -> bool:
    return any((ROOT / name).exists() for name in names)


def ok(msg: str) -> int:
    print("OK:", msg)
    return 0


def warn(msg: str) -> int:
    print("WARNING:", msg)
    return 0


def fail(msg: str) -> int:
    print("FAIL:", msg)
    return 1


def gate_01() -> int:
    files = tracked()
    if not files:
        return fail("repository has no tracked files")
    return ok(f"{len(files)} tracked files")


def gate_02() -> int:
    if not (ROOT / "README.md").exists():
        return fail("README.md missing")
    text = read("README.md").lower()
    if "archived" not in text and "archive" not in text:
        return fail("README.md does not clearly mark repository as archived")
    return ok("archive notice present in README")


def gate_03() -> int:
    if not (ROOT / "README.md").exists():
        return fail("README.md missing")
    text = read("README.md")
    if len(text.strip()) < 120:
        return fail("README.md too small for archival context")
    return ok("README present and non-trivial")


def gate_04() -> int:
    if exists_any(["LICENSE", "LICENSE.md", "COPYING"]):
        return ok("license file present")
    return warn("no root license file found; archival snapshot accepted")


def gate_05() -> int:
    if not (ROOT / "Cargo.toml").exists():
        return warn("Cargo.toml not present; Rust metadata skipped")
    code, out = run(["cargo", "metadata", "--format-version", "1", "--locked"])
    if code != 0:
        return warn("cargo metadata failed in archived snapshot; accepted as advisory")
    return ok("cargo metadata passed")


def gate_06() -> int:
    if not (ROOT / "Cargo.toml").exists():
        return warn("Cargo.toml not present; rustfmt skipped")
    code, out = run(["cargo", "fmt", "--all", "--check"])
    if code != 0:
        return warn("rustfmt advisory failed; archived snapshot accepted")
    return ok("rustfmt passed")


def gate_07() -> int:
    if not (ROOT / "Cargo.toml").exists():
        return warn("Cargo.toml not present; Rust tests skipped")
    code, out = run(["cargo", "test", "--workspace", "--all-targets"])
    if code != 0:
        return warn("Rust tests advisory failed; archived snapshot accepted")
    return ok("Rust tests passed")


def gate_08() -> int:
    bad: list[str] = []
    for name in tracked():
        path = ROOT / name
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {"README", "LICENSE", "COPYING"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                bad.append(name)
                break
    if bad:
        return fail("possible secrets found: " + ", ".join(sorted(set(bad))[:10]))
    return ok("no obvious secret patterns")


def gate_09() -> int:
    bad = [x for x in tracked() if x.startswith(GENERATED_DIRS) or "/node_modules/" in x]
    if bad:
        return fail("generated artifacts tracked: " + ", ".join(bad[:10]))
    return ok("no common generated artifact directories tracked")


def gate_10() -> int:
    md = [x for x in tracked() if x.endswith(".md")]
    if not md:
        return warn("no markdown docs found")
    empty = [x for x in md if (ROOT / x).stat().st_size == 0]
    if empty:
        return fail("empty markdown files: " + ", ".join(empty[:10]))
    return ok(f"{len(md)} markdown files present")


def gate_11() -> int:
    if exists_any(["SECURITY.md", "docs/SECURITY.md"]):
        return ok("security document present")
    return warn("SECURITY.md missing; archival snapshot accepted")


def gate_12() -> int:
    surfaces = ["IP_NOTICE.md", "TRADEMARKS.md", "NOTICE", "AUTHORS", "docs/ARCHIVE_STATUS.md"]
    if exists_any(surfaces):
        return ok("ownership/archive surface present")
    return warn("ownership surface not found; archival snapshot accepted")


def gate_13() -> int:
    refs = []
    for candidate in ["VERSION", "Cargo.toml", "README.md"]:
        p = ROOT / candidate
        if p.exists():
            refs.append(candidate)
    if refs:
        return ok("version/reference surface present: " + ", ".join(refs))
    return warn("no explicit version surface; archival snapshot accepted")


def gate_14() -> int:
    large = []
    for name in tracked():
        p = ROOT / name
        if p.is_file() and p.stat().st_size > MAX_FILE_BYTES:
            large.append(f"{name}={p.stat().st_size}")
    if large:
        return warn("large files present in archive: " + ", ".join(large[:8]))
    return ok("file sizes within archival sanity limit")


def gate_15() -> int:
    workflows = sorted((ROOT / ".github/workflows").glob("*.yml")) + sorted((ROOT / ".github/workflows").glob("*.yaml"))
    if not workflows:
        return fail("no GitHub workflow files found")
    for wf in workflows:
        text = wf.read_text(encoding="utf-8", errors="ignore")
        if "name:" not in text or "on:" not in text or "jobs:" not in text:
            return fail(f"workflow appears malformed: {wf}")
    return ok(f"{len(workflows)} workflow file(s) present")


def gate_16() -> int:
    p = ROOT / "docs/ARCHIVE_STATUS.md"
    if not p.exists():
        return fail("docs/ARCHIVE_STATUS.md missing")
    text = p.read_text(encoding="utf-8", errors="ignore").lower()
    if "archived historical snapshot" not in text:
        return fail("ARCHIVE_STATUS.md lacks archived snapshot statement")
    return ok("archive status document present")


def gate_17() -> int:
    required = [
        ".github/workflows/ci.yml",
        "tools/archive_ci_gate.py",
        "docs/ARCHIVE_STATUS.md",
        "README.md",
    ]
    missing = [x for x in required if not (ROOT / x).exists()]
    if missing:
        return fail("missing final archival files: " + ", ".join(missing))
    return ok("archival CI bundle ready")


def main() -> int:
    gate = sys.argv[1] if len(sys.argv) > 1 else ""
    if gate not in GATES:
        print(f"Unknown gate: {gate}")
        return 2

    print(f"Gate {gate}: {GATES[gate]}")
    return globals()[f"gate_{gate}"]()


if __name__ == "__main__":
    raise SystemExit(main())
