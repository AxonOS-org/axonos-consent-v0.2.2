# Enterprise Outreach — First 5 Prospects

Five specific, non-generic outreach messages for warm contacts who already know AxonOS exists. Each assumes the recipient has seen at least one Medium article or LinkedIn comment from you. Adapt wording to the specific context at send time.

**Before sending:** check that ENTERPRISE.md is live on axonos.org/enterprise.html and the link in the signature actually resolves.

---

## 1. Reinhard Keil (Keil / Arm) — Alif E3 devkit context

**Channel:** LinkedIn DM
**Context:** Reinhard previously engaged on the Alif E3 devkit thread. He runs in the Cortex-M tooling world and knows the embedded-safety certification landscape cold. Low probability of direct purchase; high probability of a useful referral or public validation.
**Goal:** not a sale — a 20-minute call where he tells you what is wrong with your approach. That feedback is worth more than a support contract from a random company.

> Reinhard —
>
> Following up on our Alif E3 thread. Short update and a specific ask.
>
> We shipped `axonos-consent` v0.2.2 in April — `#![no_std]` Rust, 15-of-15 interop vectors passing against an independent Node.js implementation from SYM.BOT. The MMP Consent Extension is now the first BCI-native consent primitive with two-implementation conformance. Next milestone is GPIO-validated WCET measurement on STM32H573 with TrustZone-S, targeting end of May.
>
> We also opened a commercial support tier — not for general use, but for teams building regulated devices on top of AxonOS. Pricing tiers are on axonos.org/enterprise. The Clinical tier is built around SOUP qualification packages for IEC 62304 Class B/C.
>
> My ask: 20 minutes of your time to poke holes in the approach. Specifically — is the TrustZone-S secure-monitor story defensible for a 2027 Q-Sub, given what you know about certification-body expectations for mixed Rust/C secure worlds? I'd rather have the argument with you now than with an FDA reviewer later.
>
> Happy to come to your calendar. Or I'm in Singapore; if you're nearby in Q2/Q3 let me know.
>
> Denis
> axonos.org · medium.com/@AxonOS · axonosorg@gmail.com

---

## 2. Nicolas Fillon (STMicroelectronics) — CubeMX2 WCET feature request

**Channel:** LinkedIn DM
**Context:** Nicolas is at STM and engaged on your WCET annotation request for CubeMX2. He is exactly the right person to know who at STM cares about safety-critical Rust tooling for H5 family chips.
**Goal:** find the STM internal champion for AxonOS on H573. If they see external adoption of H573 for safety-critical work, that helps their story internally.

> Nicolas —
>
> Following up on the CubeMX2 WCET annotation thread. I have a specific update that may be interesting to whoever at STM is tracking safety-critical Rust adoption on the H5 family.
>
> We're bringing up AxonOS on STM32H573 as the target platform for a BCI medical-device kernel. TrustZone-S partition for stimulation safety interlock, NSC gateway, sub-10 µs consent-withdrawal path. H573 won out over LPC55S69 partly because of the ART accelerator behaviour and partly because your HAL story in Rust (embassy-stm32 on H573) is significantly ahead of NXP's.
>
> Two asks:
>
> 1. Is there an STM internal person tracking Rust + H5 adoption for safety-critical applications? I'd like to share what we're learning about WCET characterization on H573 — happy to make that useful to STM's roadmap, not just ours.
>
> 2. We opened a commercial support tier for companies integrating AxonOS (axonos.org/enterprise). If STM has OEM customers doing BCI or neuromodulation work who are evaluating Cortex-M class platforms, we'd be a useful reference.
>
> No rush on either. The project is entirely open source; commercial support is for downstream integrators.
>
> Denis
> axonos.org · medium.com/@AxonOS · axonosorg@gmail.com

---

## 3. Joseph Najbauer (potential Scientific Advisor)

**Channel:** LinkedIn DM, followed by email if he's positive
**Context:** Joseph has engaged substantively on neuroscience posts. He is the kind of clinician-scientist who can review the AxonOS safety argument from the biological side — the side you cannot reason about as a non-clinician.
**Goal:** not commercial — advisor relationship. Clinical tier only comes up if he is comfortable introducing you to his institution.

> Joseph —
>
> Thanks again for the conversation on the Riemannian classifier post. I want to ask you something more specific.
>
> I am building AxonOS as a safety-critical operating system for BCI applications — currently solo, Singapore-domiciled, pre-seed. The software stack is public (axonos.org, medium.com/@AxonOS). The consent primitive is live in two interoperating implementations. The next 6 months go into TrustZone-S hardware bring-up and the first clinical conversations.
>
> What I do not have is a scientific advisor who can review the neurobiological assumptions embedded in the safety argument — stimulation charge-density limits, electrode contact assumptions, what the classifier is actually claiming about the neural signal. The 39-article architecture series needs a critical reader from the clinical side before I take any of it to a regulator.
>
> Would you consider an informal advisor role? No equity discussion yet — I'd like to start with one or two 30-minute calls where you tear apart the weakest claims in the public record, and we see if there's enough shared interest to formalize. If you'd rather not, a pointer to someone you respect who might is equally welcome.
>
> Completely understand if the answer is no or not right now.
>
> Denis
> axonos.org · medium.com/@AxonOS · axonosorg@gmail.com

---

## 4. Francisco Apa (embedded engineer — replied positively to earlier post)

**Channel:** LinkedIn DM
**Context:** Francisco replied positively to an earlier AxonOS post on embedded real-time patterns. He is an engineer, not a buyer, but he is the kind of person who either adopts AxonOS in his own stack or introduces you to people who would.
**Goal:** convert a positive comment into either (a) a GitHub user who files issues, or (b) a named champion at his company.

> Francisco —
>
> Thanks again for the comment on the WCET post — those are the responses that keep the project going.
>
> Quick update and a specific ask.
>
> `axonos-sdk` v0.1.0 shipped this week — application-facing crate, `no_std` supported, dual-licensed. If you're doing anything embedded where bounded intent events would be useful (not just BCI — the capability/manifest/attestation pattern generalizes), I'd love for you to try it and tell me what's wrong with the API. crates.io/crates/axonos-sdk. Open issues, be brutal.
>
> If this is adjacent to anything your team at work is doing, we opened a commercial support tier at axonos.org/enterprise — starts at $5k/year for priority issue response and written spec clarifications. Not trying to sell you anything; if you're the right person to file an issue, the open repo is the better starting point.
>
> Denis
> axonos.org · medium.com/@AxonOS · axonosorg@gmail.com

---

## 5. Hongwei Xu (SYM.BOT) — continuation email

**Channel:** Email (not LinkedIn — you already have his direct email)
**Context:** Hongwei is already a collaborator on the consent extension. He is the single most credible reference you have. This message is not outreach; it is a courtesy note telling him enterprise support exists, so he can refer if the question ever comes up on his side.
**Goal:** nothing transactional — just make sure if someone asks Hongwei "how do I hire someone to help us integrate axonos-consent into our product," he has the link to send.

> Hongwei —
>
> Two items, both brief.
>
> 1. We shipped `axonos-sdk` v0.1.0 yesterday. Application-facing SDK that wraps axonos-consent and the kernel mesh surface. Dual-licensed Apache-2.0 / MIT, same as the consent crate. The SDK re-exports your MMP Consent Extension frame types where they're public-surface, with attribution.
>
> 2. I opened a commercial support tier for AxonOS at axonos.org/enterprise — three tiers, Foundation / Integration / Clinical. This is not for general users; the open source is and will remain Apache-2.0 / MIT. It's for companies integrating AxonOS into commercial BCI products who need first-response SLA and written spec interpretation, plus eventually SOUP qualification packages for regulated devices.
>
> Mentioning it only because if someone asks you "who can we pay to help us integrate axonos-consent into our product," it's now a link rather than an awkward answer. If SYM.BOT ever decides to do something analogous for MMP integrations, happy to compare notes.
>
> Paper pause stands. GPIO measurement is still the gate.
>
> Denis
> axonos.org · medium.com/@AxonOS · axonosorg@gmail.com

---

## Send order (suggested)

1. **Hongwei first** — courtesy note to an existing collaborator. Low effort, high value if he ever gets asked.
2. **Francisco and Nicolas next** — warm engineers who engaged positively. Convert to GitHub users or internal champions.
3. **Joseph** — advisor conversation. Takes longest to unfold but has the highest strategic value if he's in.
4. **Reinhard last** — he's the most senior and his time is the most expensive. Only send when you have a real question he can answer in 20 minutes. The current question (TrustZone-S secure-monitor defensibility) is real and specific.

Do not send all five in one day. Stagger across a week so the responses come back at a digestible pace.

## Tracking

Simple spreadsheet, 4 columns:

| Date sent | Recipient | Channel | Response (date + 1-sentence summary) |

If no response in 10 business days, one polite follow-up. If no response after that, archive and revisit in 90 days with a different angle.

## What not to do

- Do not include the LTC donation address in any of these. This is a commercial support outreach; crypto donations are not compatible with that positioning.
- Do not attach a pitch deck. If they want it, they will ask. If you attach it unrequested, the message reads as a fundraising email rather than a product conversation.
- Do not promise a price below the published tier. Foundation is $5k; if a prospect wants a lower price point, point them at GitHub Sponsors or an issue-bounty model, not a discounted support contract.
- Do not send on Friday afternoons or weekends. Tuesday–Thursday morning, recipient's timezone, lands best.

---

`axonos.org · medium.com/@AxonOS · axonosorg@gmail.com`
