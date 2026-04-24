# AxonOS Cure Deployment Checklist — 28 April 2026

**Deadline:** 28 April 2026, end-of-day Singapore time (SGT, UTC+8)
**License termination cliff:** 21 May 2026 (30 days from discovery per CC-BY-4.0 §6(a))
**Current date:** 24 April 2026 (T−4 days)

This is your operational runbook. Work through it top to bottom. Don't improvise order.

---

## Pre-flight (do today, 24 April)

### ☐ 1. Extract all cure tarballs to local working copies

```sh
cd ~
mkdir -p axonos-deploy-work
cd axonos-deploy-work

# Site v5
mkdir -p axonos-site
tar xzf /path/to/axonos-site-v5-expanded-cure.tar.gz -C axonos-site/
ls axonos-site/   # should see 8 HTML files + assets

# Consent crate
mkdir -p axonos-consent
tar xzf /path/to/axonos-consent-v0.2.2-plaintext-cure.tar.gz -C axonos-consent/
ls axonos-consent/   # should see Cargo.toml, src/, README.md, etc.
```

### ☐ 2. Visual local preview of site

```sh
cd ~/axonos-deploy-work/axonos-site
python3 -m http.server 8000
# Open http://localhost:8000 in a browser
```

**Check on desktop (≥821 px wide):**
- Top nav shows 7 links inline, no hamburger button visible
- Click every nav item: About, Technology, Developers, Roadmap, Writing, Enterprise, Contact
- Each page loads and is styled
- Scroll down — header should become subtly bordered at top edge

**Check on mobile (resize browser window to <820 px or use DevTools mobile emulation):**
- Top nav collapses, hamburger button appears on right
- **Click hamburger** — menu slides in, opacity animates
- **Click an item** — menu closes, navigates
- **Click hamburger again on new page** — reopens
- **Press Escape** — menu closes
- **Body scroll locked** while menu open (no background scroll)

If any of the above fails — STOP. Do not deploy. Report the specific failure.

### ☐ 3. Visual local preview of consent README

```sh
cd ~/axonos-deploy-work/axonos-consent
# If you have a markdown viewer:
grip README.md        # renders at localhost:6419
# Or use VS Code preview, or just `less README.md`
```

**Check:**
- Top tagline reads "The Rust reference implementation of the MMP Consent Extension v0.1.0"
- MMP version badge shows v0.2.3, NOT v0.2.2
- No broken `sym.bot/spec/mmp-consent` links (should be plain text "sym.bot/spec/mmp" with no hyperlink styling)
- No co-authored / joint paper / jointly-authored language anywhere except inside "did not co-author" assertions

### ☐ 4. Compile check on consent crate (sanity — does it still build?)

```sh
cd ~/axonos-deploy-work/axonos-consent
cargo build --all-features 2>&1 | tail -30
cargo test 2>&1 | tail -20
cargo clippy --all-features -- -D warnings 2>&1 | tail -30
```

If any errors — STOP. Report them. The cure was markdown-only but sanity-check that nothing broke.

---

## Deploy (do 25–26 April — give yourself buffer)

### ☐ 5. Deploy axonos.org

**If using Cloudflare Pages:**
```sh
cd ~/axonos-deploy-work/axonos-site
npx wrangler pages deploy . --project-name=axonos
# Wait for deploy URL, verify it works, then promote to production
```

**If using Netlify:**
```sh
cd ~/axonos-deploy-work/axonos-site
netlify deploy --prod --dir=.
```

**If using GitHub Pages / custom server:** push to your existing deploy mechanism.

**After deploy, verify live site:**
```sh
curl -s https://axonos.org/ | grep -c "sym.bot/spec/mmp-consent"   # must be 0
curl -s https://axonos.org/ | grep -c "MMP v0.2.2"                  # must be 0
curl -s https://axonos.org/ | grep -c "joint paper"                 # must be 0
curl -s https://axonos.org/ | grep -c "co-authored"                 # must be 0
```

All four commands must output `0`. If any outputs `1` or more — STOP. Fix and redeploy.

### ☐ 6. Update GitHub org README

The AxonOS-org GitHub profile README lives in a special repository named `.github`.

**If `AxonOS-org/.github` repo does NOT exist yet:**

1. Go to https://github.com/organizations/AxonOS-org/repositories/new
2. Create new repo named exactly `.github` (with leading dot)
3. Initialize with README.md empty
4. Create directory `profile/` inside the repo
5. Create `profile/README.md`
6. Paste the contents of `axonos-org-profile-README.md` from outputs

**If `AxonOS-org/.github` already exists:**

```sh
cd ~
git clone https://github.com/AxonOS-org/.github.git AxonOS-org-dotgithub
cd AxonOS-org-dotgithub
mkdir -p profile
cp /path/to/axonos-org-profile-README.md profile/README.md
git add profile/README.md
git commit -m "Attribution corrections per CC-BY-4.0 §3(a) — cure for items A1/A2/A3"
git push
```

**Verify:** navigate to https://github.com/AxonOS-org — the org profile should now show the new README with the cured A1/A2/A3 text.

### ☐ 7. Push axonos-consent cure

```sh
cd ~/axonos-deploy-work/axonos-consent
git init 2>/dev/null || true   # if working copy was tarball-fresh
git remote -v                  # verify origin is github.com/AxonOS-org/axonos-consent

# Copy cured files over existing git working copy
# (or if using tarball, rsync onto existing git clone)

git diff --stat                # review what changed
git add -A
git commit -m "Attribution corrections per CC-BY-4.0 §3(a) — remove co-design framing, update MMP version to v0.2.3, remove dead URLs"
git push origin main
```

**Tag a release:**
```sh
git tag -a v0.2.2-cure -m "Attribution cure per CC-BY-4.0 §3(a) — 24 April 2026"
git push origin v0.2.2-cure
```

---

## Evidence capture (do 27 April)

You need a dated evidence package in case Hongwei escalates despite the cure.

### ☐ 8. Screenshot each cured surface

Save to a folder `~/axonos-cure-evidence-2026-04-27/`:

- **Screenshot 1** — https://axonos.org/ home page, full page with date/time visible in browser chrome
- **Screenshot 2** — https://axonos.org/about.html (Specification attribution section)
- **Screenshot 3** — https://axonos.org/technology.html (attribution block visible)
- **Screenshot 4** — https://axonos.org/writing.html (external specifications section)
- **Screenshot 5** — https://github.com/AxonOS-org (org profile README visible)
- **Screenshot 6** — https://github.com/AxonOS-org/axonos-consent (README with attribution section visible)
- **Screenshot 7** — https://github.com/AxonOS-org/axonos-consent/commits/main (showing the cure commit with date)

### ☐ 9. Text-mode evidence

In the same evidence folder, save:

```sh
cd ~/axonos-cure-evidence-2026-04-27
curl -s https://axonos.org/ > home-source-2026-04-27.html
curl -s https://axonos.org/about.html > about-source-2026-04-27.html
# ... etc for all 8 pages

# Compliance grep — save output
for url in https://axonos.org/ https://axonos.org/about.html https://axonos.org/technology.html https://axonos.org/developers.html https://axonos.org/roadmap.html https://axonos.org/writing.html https://axonos.org/enterprise.html https://axonos.org/contact.html; do
  echo "=== $url ===" >> compliance-verification.txt
  curl -s "$url" | grep -c "sym.bot/spec/mmp-consent" | xargs -I{} echo "dead-URL count: {}" >> compliance-verification.txt
  curl -s "$url" | grep -c "MMP v0.2.2" | xargs -I{} echo "stale-version count: {}" >> compliance-verification.txt
  curl -s "$url" | grep -c "joint paper" | xargs -I{} echo "joint-paper count: {}" >> compliance-verification.txt
done
```

Expected: every count must be `0`.

### ☐ 10. Archive the evidence

```sh
cd ~
tar czf axonos-cure-evidence-2026-04-27.tar.gz axonos-cure-evidence-2026-04-27/
sha256sum axonos-cure-evidence-2026-04-27.tar.gz > axonos-cure-evidence-2026-04-27.sha256
```

Upload the tarball + SHA-256 to a durable location:
- Your personal Google Drive
- Your Singapore legal counsel's case file
- Optionally: Git repo `axonos-cure-evidence` (private) with timestamp commits

---

## Legal (do 25–28 April — in parallel with deploy)

### ☐ 11. Engage Singapore IP counsel

**Priority: this week.** Not next week.

Search for Singapore law firms with open-source licensing and CC-BY-4.0 enforcement experience. Keywords: "Singapore technology lawyer open source" / "Singapore CC-BY-4.0 attribution compliance."

Reasonable candidates (verify current practice before contacting):
- Drew & Napier — technology practice
- Rajah & Tann — IP practice
- Bird & Bird (Singapore office) — tech/IP specialist
- Dentons Rodyk — IP and technology

**What to send them:**
1. Hongwei's 21 April email (the 6 items)
2. Hongwei's 22/23 April follow-up (the escalation ladder)
3. `CURE-VERIFICATION.md` from outputs
4. Screenshots from step 8 above
5. Links to the deployed surfaces (axonos.org, github.com/AxonOS-org)

**What to ask them:**
1. "Does this cure satisfy CC-BY-4.0 §3(a) as commonly enforced under Singapore law?"
2. "If Hongwei proceeds with formal §6 notice on 28 April despite our cure, what is our response?"
3. "Should we send Hongwei a letter confirming cure is deployed, or continue no-response per his instruction?"
4. "What is our posture if Hongwei files GitHub content-removal report on 5 May?"

**Budget expectation:** SGD 800–2,000 for initial consultation + written opinion. This is worth it.

### ☐ 12. Do NOT do any of the following

- **DO NOT email Hongwei** under any circumstances. He explicitly requested no response except the 6 corrections.
- **DO NOT post on Medium** about this situation — not in any tone, positive or reflective.
- **DO NOT mention this on LinkedIn, Twitter, Reddit, HackerNews, or any public channel.**
- **DO NOT respond to DMs** asking about the collaboration status. If someone DMs you, reply "AxonOS continues as an independent implementer of open specifications; I'm focused on the engineering path."
- **DO NOT** add new content claiming co-authorship of any specification.
- **DO NOT** try to restore cross-references on sym.bot. Hongwei explicitly said they will not be restored and are not conditional on anything.

---

## Monitor (do 29 April – 21 May)

### ☐ 13. Watch these three surfaces daily

- **Your email (axonosorg@gmail.com)** — for any further message from Hongwei or SYM.BOT.
- **github.com/AxonOS-org issues** — for any GitHub content-removal report referencing the 5 May date.
- **arxiv.org** — for any metadata change on arXiv:2604.03955.

If any of the above triggers: do NOT respond directly. Forward to your Singapore counsel and ask for guidance before acting.

### ☐ 14. Track the cure window

- **T+0 (28 April):** Hongwei checks surfaces. If cure is deployed, §6 notice is not issued.
- **T+7 (5 May):** GitHub content-removal report threshold. Cure deployed = no report.
- **T+28 (21 May):** Cure window closes per §6(a). License automatically reinstated by virtue of the cure applied before this date.

**After 21 May, if no further action from Hongwei — the matter is legally closed.** You can resume forward publication on Medium, continue development, pursue the pre-seed round. All with proper specification attribution going forward (always cite MMP v0.2.x as SYM.BOT-authored, CC-BY-4.0; never co-design; never joint).

---

## What this does NOT do

- This cure does **not** restore the collaboration. It is closed.
- This cure does **not** restore Hongwei's availability to review AxonOS content. He is unavailable.
- This cure does **not** restore SYM.BOT cross-references to AxonOS. They are permanently removed.
- This cure does **not** reopen the joint paper. It is paused.

What this cure **does:** restore CC-BY-4.0 §3(a) compliance, remove all pretext for §6 enforcement, preserve your right to continue implementing MMP under the same terms as any other party, preserve your Apache-2.0/MIT licensed source code entirely.

---

## If something goes sideways

### If Hongwei emails before 28 April with new demands

- Do not reply directly.
- Forward to Singapore counsel immediately.
- Continue deploying the planned cure — his new demands do not retroactively invalidate cure of the 6 items.

### If cure deploy fails on 27 April

- Deploy partial cure of whatever is ready — even partial compliance improves posture.
- Document the failure reason in writing.
- Email counsel: "Partial cure deployed, here's what's outstanding, here's my ETA to complete."

### If Hongwei files §6 notice on 28 April despite cure

- This means his view of what cure entails differs from yours.
- Counsel response: request his **specific** enumeration of remaining deficiencies.
- Apply those specific corrections within the 30-day cure window if they are reasonable.

### If 21 May passes without further contact

- Matter is closed. License is reinstated per §6(a).
- Archive evidence package. Keep for 6 years (Singapore limitation period).
- Resume normal publication cadence with proper attribution discipline going forward.

---

## Summary — three numbers to remember

**28 April** = last chance to deploy cure before formal §6 notice.
**5 May** = GitHub content-removal report threshold.
**21 May** = automatic license reinstatement if cure applied before this date.

Deploy by 26 April. Evidence captured by 27 April. Counsel engaged by 25 April. Done.

---

*This runbook is operational guidance, not legal advice. Consult Singapore counsel for anything ambiguous.*
