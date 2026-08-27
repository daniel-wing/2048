# Privacy and licensing

**Status:** stable
**Last updated:** 2026-08-26

## What this covers

The no-ads and no-tracking guarantee, how it is enforced and verified, and the
attribution to the original 2048.

## Decisions

### 2026-08-26 - No backend at all, by design

- **Decision:** The app makes zero network requests. No accounts, no cloud, no
  leaderboard, no analytics, no telemetry.
- **Why:** The user cut the originally planned optional Supabase leaderboard.
  Removing the backend entirely makes the privacy guarantee airtight rather than
  conditional, keeps the App Store and Play data labels at "Data Not Collected",
  and reduces running cost and maintenance to zero.
- **Alternatives considered:** An opt-in anonymous leaderboard, which was in an
  earlier draft of the plan and was explicitly removed. The reasoning was that
  "opt-in and privacy-clean" is still a claim a user has to trust, whereas "makes
  no network requests" is a claim that can be verified.
- **Trade-offs accepted:** No cross-device sync and no global leaderboard.

### 2026-08-26 - Variable board sizes and themes are mandatory, not optional

- **Decision:** Board sizes 3x3 to 8x8 and five themes ship at launch and are
  treated as required features.
- **Why:** Apple routinely rejects new 2048 clones under Guideline 4.3, spam and
  copycat. These two features are the concrete, demonstrable differentiators the
  App Store review notes will point at, alongside the zero-tracking stance.
- **Alternatives considered:** Treating them as nice-to-have polish, rejected
  because that leaves nothing substantive to cite at review time.
- **Trade-offs accepted:** More surface to build and test in Phase 1.

### 2026-08-26 - Attribution without implying endorsement

- **Decision:** Credit Gabriele Cirulli and the MIT-licensed original in the
  README, `THIRD_PARTY_NOTICES.md`, and the in-app About screen, and state
  plainly in each that this project is not affiliated with or endorsed by the
  original author.
- **Why:** The engine and UI here were written from scratch, so the MIT
  obligation is light, but the original is the reason this game exists and
  crediting it costs nothing. The non-endorsement line protects both parties.
- **Alternatives considered:** No attribution, rejected as the wrong thing to do.
  Copying the original source, never considered.
- **Trade-offs accepted:** None.

## How it works

The guarantee is enforced by simply having no networking code and no SDK that
does networking. It is verified rather than asserted:

- A dependency scan for ad, analytics and tracking package names returns nothing.
- In the running production build, `fetch`, `XMLHttpRequest.open`, `WebSocket`
  and `navigator.sendBeacon` were all wrapped and 30 moves were played. No calls
  were intercepted and a PerformanceObserver recorded no resource loads during
  play.
- Every resource loaded across the whole session came from the page's own
  origin. No third-party origin was ever contacted.
- The app was loaded with the server stopped and played normally, confirming
  offline operation.

## Gotchas and things to remember

- Re-run the network verification before any store submission, and any time a
  dependency is added. It is the evidence behind the store privacy declarations.
- The About screen text is a public promise. If a future feature ever needs the
  network, that text and the store data labels must change first.
- The LICENSE copyright is "Daniel Wing", confirmed before publishing.
- The store display name is not settled. Plain "2048" is crowded and offers no
  4.3 defense. A distinguishing name such as "2048 Ad-Free" is likely safer.
  App config currently uses the name "2048 - Ad-Free" and bundle id
  `cx.wing.adfree2048`. The bundle id was changed from one built on the macOS
  account name, which would have published it in the store listing.

## Open questions

- Final store display name.
