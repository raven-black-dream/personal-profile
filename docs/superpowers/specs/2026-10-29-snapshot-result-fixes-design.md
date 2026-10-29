# Snapshot Result Fixes (rubric v0.6)

**Date:** 2026-10-29
**Branch:** claude/feature/snapshot-result-fixes
**Status:** approved (autonomous run; Evan, 2026-10-29: "Fix them now", after a review that ran `scoreSnapshot` on main and found four defects). New user-facing copy below is listed in the PR for Evan's approval before merge.

## Assumptions (autonomous mode)

1. **Weakness messages are chosen per question, not per dimension.** For each weak dimension (normalised score below 75, weakest first, as today), the message comes from the answered, scored question in that dimension with the lowest score (ties: earlier in `QUESTIONS` order). Each question's message is written to be true for every non-top answer to that question. This is the smallest change that makes the text match the answers; templating the chosen label into the sentence reads badly.
2. **No double-telling.** A question whose chosen option already produced an observation (a cap reason or an option insight) is skipped when picking that dimension's weakness message; the next-lowest question in the dimension is used, or nothing if none is left. Only answers scoring below the question's top option are eligible (an answer at the top score never produces a weakness message). When the use-case floor applied (`cap:use-case`), the use-case-fit dimension adds no weakness message, because the floor's text already says it.
3. **Privacy cap behaves like the real-damage cap.** Choosing gr2 "Yes, and people are pasting it into public AI tools" caps Ready to build down to Ready to prioritise. It does not move lower bands. The existing privacy text (`flag:privacy`) remains the explanation and appears exactly once.
4. **Cap precedence:** use-case floor, then risk-blind, then real-damage, then privacy (first match wins, as today). `capReason` records the one that applied.
5. **Use-case floor becomes "at or below 25"** (was strictly below). This is the minimal fix for the reported profile. Whether "I just want to use AI more" should cap on its own is a v0.6 judgment item, out of scope.
6. **The `strong` observation is rewritten, not removed,** so a top result still carries one observation that adds something beyond the band text (the measurement point from Saraev's 2026-10-29 guide). The Ready to build band blurb is unchanged.
7. **The old dimension-level `low:<dimension>` snippets are removed** once nothing reads them.
8. **Version bump:** `RUBRIC_VERSION` v0.5 → v0.6, because bands and observations change for some answer sets. Header gains a "What changed in v0.6" block citing this review (2026-10-29) as the source.
9. **Apostrophes:** new strings use the curly ’ to match the existing snippets.
10. **Voice:** user-facing strings follow the em-dash sweep and Evan's plain voice. No em dashes, no superlatives.

## Summary

Fixes four defects in the free AI Readiness Snapshot's result, all confirmed by running main's `scoreSnapshot` on 2026-10-29:
1. Weakness messages described the worst case, so they could contradict the answers (a respondent with "a few different systems" and "mostly automatic" data movement was told their data is "spread across spreadsheets" and moving it is "still mostly manual"; a respondent who chose "minor annoyance" was told "a wrong answer here causes real damage").
2. Pasting sensitive data into public AI tools could still score Ready to build, with "a sensible read on the risks".
3. On a Ready to build result, the band text and the first observation said nearly the same thing.
4. A respondent with no specific use case, no written definition and no owner could land exactly on the use-case floor (25), escape it, and be pitched the Audit.

## Functional Requirements

- FR1. Add an optional per-question weakness snippet keyed `low:<questionId>` for every question that has at least one scored option below 4: uc1, uc2, uc3, uc4, tc1, tc2, tc3, pc1, pc2, df1, df2, ti1, gr1, gr2. Text exactly as in "Copy" below.
- FR2. In `scoreSnapshot` step 6, for each weak dimension (existing selection and order), push `SNIPPETS['low:<qid>']` for the qualifying question per Assumptions 1 and 2. The three-observation limit is unchanged.
- FR3. Remove the `low:<dimension>` snippets (`low:use-case-fit`, `low:team-capability`, `low:data-foundation`, `low:tooling-infra`, `low:process-clarity`, `low:governance-risk`).
- FR4. gr2's public-tools option gains a cap (`cap: 'privacy'`, extending the `Option.cap` union). In step 5, after the real-damage branch: if that cap is chosen and the band is Ready to build, set the band to Ready to prioritise and `capReason = 'cap:privacy'`. The observation list shows the privacy text once (Assumption 3); the option keeps its `insight: 'flag:privacy'` so the warning still shows on lower bands.
- FR5. The use-case floor triggers at `normalised <= 25` (constant `FLOOR_T` unchanged at 25; comparison changes).
- FR6. Replace the `strong` snippet text with the new copy below.
- FR7. `RUBRIC_VERSION = 'v0.6'`; header "What changed in v0.6" block; PLACEHOLDER line reads v0.6 with today's date.
- FR8. The `SNIPPETS` doc comment describes the new assembly order (cap reason → option insights → strong → per-question weakness messages).

## Copy (new user-facing strings, exact)

- `low:uc1`: "A person checking every answer is a sound setup, but the check is where the time goes. Before automating, time how long a review takes: if checking is nearly as slow as doing the work, the gain is small."
- `low:uc2`: "This isn’t yet one specific task that comes up often. The teams that get value name a single job that costs real hours every week and point AI at exactly that. Pick your most repetitive time-sink and start there."
- `low:uc3`: "There’s no written, agreed description yet of what a good result looks like. Without one, nobody can tell whether the AI got it right. Writing it down is usually an hour’s work, and it comes before building anything."
- `low:uc4`: "This task is missing a named owner, a business number it would move, or both. Without them a pilot drifts: nobody is accountable for it and nobody can show it paid off. Settle both before you start."
- `low:tc1`: "Most of your team isn’t using AI for real work yet. A short, practical session to get a few more people productive will move you further than any strategy document."
- `low:tc2`: "Your team doesn’t always catch it when AI gets something wrong. That’s the skill that makes everything else safe, and it can be taught: practice at checking AI output pays off before any automation does."
- `low:tc3`: "Leadership doesn’t yet have a clear line on what AI shouldn’t be trusted with. Drawing that line is quick, and it’s what lets people use AI with confidence everywhere else."
- `low:pc1`: "If the person doing your most repetitive job were away, the work would depend on asking around rather than on a written process. An AI can only follow what’s written down, so documenting that job comes first, and it’s worth doing whether or not you automate it."
- `low:pc2`: "The rules behind your recurring decisions aren’t fully written down and current. Those rules are what an AI needs to act on your behalf. Capturing them is cheap, and it protects the business whether or not you automate."
- `low:df1`: "Your records of this happening are patchy or short. A model learns from past examples, so a few months of clean, consistent records will do more for you right now than any model."
- `low:df2`: "Your data isn’t in one central place yet. Models need it accessible and consistent, so pulling the data this task depends on into one place is the step to take before building on top of it."
- `low:ti1`: "Moving data between your systems still involves some manual steps. That’s a solvable plumbing problem, and worth solving before you automate on top of it."
- `low:gr1`: "A wrong answer here costs you something, even if it’s only rework. Keep a person checking the output until you’ve seen how often the AI gets your own work wrong."
- `low:gr2`: "Sensitive or confidential data is involved, and keeping it inside controlled tools is the right setup. The next step is a written rule on what may go where, so that stays true as more people start using AI."
- `strong` (replaces the old text): "Before anything gets built, agree the one number this should move and record where it stands today. Then the result is visible when it lands, not a matter of opinion."

## Out of Scope

- The v0.6 rubric judgment items from the 2026-10-29 review: growth versus savings scoring (uc2), splitting uc4 into owner and tracked baseline, uc1's scoring of human review, a question on unused AI in existing software (Bet 3), whether "use AI more" should cap by itself.
- New questions, weights, band thresholds (75/50), band blurbs, CTAs, page copy, the paid Audit scorecard.
- Any change to logging, the API or the D1 schema.

## Edge Cases

- E1. A weak dimension whose every scored question already produced an observation (cap or insight) adds no weakness message.
- E2. A dimension with one item (data-foundation on llm, tooling-infra) selects that item.
- E3. Ties in score within a dimension resolve to the earlier question in `QUESTIONS`.
- E4. gr1 "Real damage" and gr2 public tools together: real-damage cap applies first (`capReason = 'cap:real-damage'`); the privacy text still shows via the insight.
- E5. Privacy cap on a result already at Ready to prioritise or Foundations first: no band change, `capReason` stays null (or the earlier cap), privacy text still shows.
- E6. Gated results are unchanged: gate text only.
- E7. ag1 stays unscored and never selected (no score).

## Acceptance Criteria

- AC1. Case A (llm; uc1 index 3, uc2 3, uc3 2, uc4 2, rag1 0, tc1 3, ag1 0, tc2 2, tc3 2, pc1 2, pc2 2, df2 2 "A few different systems", ti1 2 "Mostly automatic", gr1 2, gr2 2): the result's observations contain `low:df2` and `low:ti1` text and contain neither "spread across spreadsheets" nor "mostly manual".
- AC2. Case B (as A but df2 3, ti1 3, gr1 2 "Minor annoyance", gr2 0 public tools): band is Ready to prioritise with `capReason` `cap:privacy`; observations contain the privacy text exactly once and do not contain "real damage".
- AC3. On every Ready to build result, no observation equals or repeats the band blurb; the `strong` text is the new copy.
- AC4. Case C (llm; uc1 3, uc2 0, uc3 0, uc4 0, others as A with tc1 0, tc2 0, tc3 0): band is Foundations first with `capReason` `cap:use-case`.
- AC5. For every question and every non-top scored option, the weakness message that would be shown for that question exists in `SNIPPETS` (no question can select a missing key); the six `low:<dimension>` keys no longer exist.
- AC6. Results for answer sets that trigger none of the four defects are otherwise unchanged in band and overall (checked on llm/ml/both × first/mid/last sets against main).
- AC7. `RUBRIC_VERSION === 'v0.6'`; `npm test`, `npm run check` and `npm run build` pass.

## Security Considerations

- Scoring is pure and client-side; no new input path, endpoint or stored field. The server stores `band_id`, `cap_reason` and `dimensions_json` computed from the same function, so `cap_reason` may now hold `cap:privacy`; the column is free TEXT (no migration).
- No personal data added; copy is static.

## Testing Guidelines

- Regression tests reproducing cases A, B and C from the 2026-10-29 review, asserting band, capReason and observation contents (including the absence checks).
- Coverage test: every question with a non-top scored option has its `low:<qid>` key; the six dimension keys are gone.
- Selection tests: lowest-scoring question wins; tie goes to `QUESTIONS` order; a question that already produced a cap/insight is skipped (E1, gr2 public-tools case).
- Precedence test for E4 and no-op test for E5.
- Keep the existing ag1 equality tests green (ag1 still changes nothing).
- AC6 is checked in the proof run by comparing against main's v0.5 output.
