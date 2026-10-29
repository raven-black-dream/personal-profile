# Snapshot Agentic-Adoption Question

**Date:** 2026-10-29
**Branch:** claude/feature/snapshot-agentic-adoption-question
**Status:** approved (autonomous run; Evan, 2026-10-29: "build it through spec-to-pr, but do it automatically, without my input")
**Intent:** Consultancy `forward-bets.md` § Bet 6 (Capability arrives before adoption), added 2026-10-29

## Assumptions (autonomous mode)

Each open question from the blind-spot pass is resolved here rather than asked.

1. **Dimension:** ag1 declares `tooling-infra`. The field is required (`snapshot-content.ts:69`) and has no effect on an unscored item. Agentic tooling in place is the closest existing dimension if the item is ever scored.
2. **Position:** directly after `tc1` ("In the last week, how many people on your team used an AI tool for real work?"). Both are adoption questions, so the respondent answers them together.
3. **Mandatory:** yes, like every other question (`scoring.ts:605-607`). A skippable item would be a new wizard behaviour, which is out of scope.
4. **In-flight v0.4 clients:** accepted loss. A tab opened before the deploy and submitted after it sends answers without ag1, which the server rejects as incomplete (`snapshot-log.ts:121-123`). Logging is anonymous, fire-and-forget and low volume, so the window is minutes and the cost is a handful of rows. No version negotiation is added.
5. **Wording:** Evan's wording as given, which asks about the business in general, not "the task you have in mind". It is a business-wide fact, and it reads correctly on all three branches.
6. **Options and indexes:** No (0), Not sure (1), Yes (2). Categorical, not ordinal; analysis must treat them that way.
7. **No insight, cap, gate or weightMod** on any option. The task says the item must not change any score, band or observation, so no observation either.
8. **Version bump:** v0.4 → v0.5 even though no result changes. The `RUBRIC_VERSION` comment says to bump when results change; the answer set changing is the stronger reason here, because analysis segments `answers_json` by rubric version. The comment is widened to say so.
9. **Changelog source:** the v0.5 header block cites `Consultancy/forward-bets.md` Bet 6. There is no lucid ticket or R-number decision for this change.
10. **Paid Audit scorecard:** not changed. The "free and paid stay parallel" convention is about scored dimensions; ag1 is a measurement item, not a dimension.
11. **Copy:** the consulting page's "Three minutes" promise is left alone; one three-option question does not break it.

**Approach (chosen, one-line rationale):** add ag1 as a plain data entry in `QUESTIONS`, the same shape as rag1 minus the router. The scoring engine already ignores options without a score, so no engine change is needed; a new scoring regression test proves it.

## Summary

Adds one unscored question to the free AI Readiness Snapshot on the consulting page: "Does any AI tool act on your behalf today: sending, booking or updating something without someone doing each step?" Its answers are logged with every anonymous Snapshot response, so Evan can count how many prospects already use AI agents that act on their behalf. That count is the measurement for Bet 6 in his forward-bets file, reviewed 2027-08-01. The question changes nothing the respondent sees in their result.

## Functional Requirements

- FR1. A new question with id `ag1`, prompt exactly: "Does any AI tool act on your behalf today: sending, booking or updating something without someone doing each step?"
- FR2. Three options in this order, labels exactly: "No", "Not sure", "Yes". No option carries `score`, `gate`, `weightMod`, `cap` or `insight`.
- FR3. ag1 is shown on all three branches (`llm`, `ml`, `both`): its `branches` field is left out.
- FR4. ag1 sits in `QUESTIONS` immediately after `tc1`.
- FR5. ag1 declares `dimension: 'tooling-infra'` with an inline comment saying it is an unscored measurement item for forward-bets Bet 6 and has no effect on any dimension.
- FR6. `RUBRIC_VERSION` becomes `'v0.5'`; its doc comment also covers changes to the answer set.
- FR7. The file header gains a "What changed in v0.5" block (ag1, why it is unscored, the Bet 6 source, the accepted in-flight loss) and the PLACEHOLDER line reads v0.5 with today's date.
- FR8. The `Option.score` doc comment names the third legitimate no-score case: an unscored measurement item.
- FR9. Logged responses include ag1's answer index in `answers_json` (no schema change; this already follows from the server's allowlist being derived from `questionsForBranch`).

## Out of Scope

- Any change to scoring, bands, caps, observations, weights or the result screen.
- A database migration, new column, or analysis query/view for ag1.
- Handling of pre-deploy (v0.4) clients beyond accepting the loss.
- Making any question optional.
- The paid Audit scorecard, the consulting page copy, and the stale comments noted in passing (`+server.ts` "12-question", the component test header's step count) except where this change must touch them.
- Deploying. The PR is the deliverable.

## Edge Cases

- E1. ag1 answered with any of its three options must give the same `scoreSnapshot` output as the same answers with ag1 absent, on every branch: same overall, band, caps, dimension scores, `items` counts and observations.
- E2. A v0.4 answer set (no ag1) is rejected by the server as incomplete. Accepted (Assumption 4); a test pins this, so the behaviour is deliberate rather than accidental.
- E3. An out-of-range ag1 index (3, or -1) is rejected by the existing validation.
- E4. The gate bands (`llm-deterministic`, `ml-no-data`) still end the wizard and score `not-a-fit` regardless of ag1.
- E5. The progress bar denominator grows by one on every branch; no layout change needed.

## Acceptance Criteria

- AC1. On each branch, `questionsForBranch(branch)` contains `ag1` exactly once, immediately after `tc1`.
- AC2. For each branch and each ag1 option, `scoreSnapshot` returns a result deep-equal to the one for the same answers without ag1 (overall, band, caps, per-dimension scores and `items`, observations).
- AC3. After the wizard is completed in the component with ag1 answered, the result screen renders, and the logged POST body contains `ag1` with the chosen index.
- AC4. The server accepts a complete v0.5 answer set including ag1 (index 0, 1 or 2) and stores it with `rubric_version` `v0.5`; it rejects an answer set missing ag1, and one with ag1 = 3.
- AC5. `RUBRIC_VERSION === 'v0.5'`.
- AC6. `npm run check` and `npm test` pass; `npm run build` succeeds.

## Security Considerations

- No new endpoint, input path or stored field. ag1's answer travels inside the existing anonymous `answers` object, validated against the allowlist derived from `QUESTIONS` (`snapshot-log.ts:110-123`), so only indexes 0–2 are accepted.
- No personal data: the question asks about the business's tooling, not about a person, and responses stay unidentified (no names, no emails), keeping the on-page privacy claim true.
- Body size stays well under the 4 KB cap.
- No BOLA/IDOR surface: there is no per-user data and no read path.

## Testing Guidelines

- New scoring regression test (there is no scoring test file today): for each branch, build a complete answer set, score it with ag1 at each of its three options and with ag1 removed from the input, and assert deep equality of the results.
- Content test: version is v0.5; ag1 is present once per branch, directly after tc1, with three options that carry no score/gate/weightMod/cap/insight.
- Component test: update the wizard walk so it answers ag1, and assert the logged POST includes ag1.
- Server/log tests: add explicit cases for a v0.5 set with ag1 at each index (accepted, stamped v0.5), a set missing ag1 (rejected), and ag1 = 3 (rejected).
- Run the full suite, type check and build; no manual browser check is required beyond the Phase 6.7 dogfood pass.
