# Featured Projects — Draft Content (PAR model)

> Drafted 2026-06-08. Two settled projects below. Third slot held pending DS-vs-AI-forward direction decision (see /grill-me brainstorm). Candidates for slot 3: Lucia (agentic, AI-forward) OR Royal BC Museum handwriting-recognition CV pipeline (traditional DS).
>
> ⚠️ HONESTY FLAGS are marked `[CONFIRM]` — Evan must supply/verify real numbers before publishing. Do not invent metrics.

---

## Project 1 — Nyström-OCRKM: Scalable Anomaly Detection on Ride-Hail Trip Data

**Format:** Case study (no code link yet — public NYC-TLC rerun tracked as lucid T-0040, will add live repo when done).

**Tech tags:** Python · scikit-learn · One-Class Restricted Kernel Machine · Nyström approximation · Gaussian kernels · Isolation Forest · SGD-OCSVM · anomaly detection · kernel methods

### Problem

Regulatory bodies validating millions of taxi and ride-hail trip records rely on rule-based checks (fare, distance, and duration within fixed ranges). Those rules verify each field in isolation — they are structurally blind to anomalies that arise from the _relationships between_ fields: a plausible fare on impossible geometry, coordinates that pass range checks but sit in the wrong hemisphere. Catching those needs a model of the joint distribution, and the kernel method best suited to it (One-Class Restricted Kernel Machine) is O(N²) in memory — infeasible at this data scale.

### Action

Implemented the One-Class Restricted Kernel Machine (Quadir et al., 2025) and made it tractable at scale by applying **Nyström approximation** — reducing kernel computation from O(N²) to O(Nm) using 9,994 k-means-selected landmark points over a 2M-row dataset. Engineered relational features (Haversine distance, circuity ratio, cyclical sin/cos datetime encodings), tuned hyperparameters (η, λ, σ) via stratified K-fold cross-validation, and benchmarked rigorously against two established baselines — SGD-OCSVM and Isolation Forest.

### Result

On complete-feature trips the model reached **96.7% G-Mean / 98.3% sensitivity**, and — the real contribution — it surfaced **four distinct classes of data-quality defect that pass all eight regulatory business rules**: coordinate inversion, GPS zero-fill, anomalous fare-geometry combinations, and impossible-duration trips. Every flagged record was independently corroborated by Isolation Forest; the linear-boundary baseline (SGD-OCSVM) caught none, demonstrating that kernel and tree methods cover distributional anomalies that boundary methods cannot.
The study also reported, transparently, where the method _lost_: on the full evaluation set it was outperformed by simpler baselines and ran ~23× slower than Isolation Forest, which was named the stronger practical choice. _(The rigor and the honest negative result are part of the story — keep them.)_

---

## Project 2 — Base45: A Self-Built Training-Intelligence Lakehouse & MLOps Platform

**Format:** Live product + research write-up. **Link:** https://base45.ca

**Tech tags:** SvelteKit · TypeScript · MotherDuck / DuckDB · medallion lakehouse · Kestra · MLflow · Python · MCP · nonparametric estimation · anomaly detection · time-series CV

> ⚠️ Numbers below are pulled from the project's own research docs (research-directions.md, model-leverage.md) and graphify knowledge graph — all real, no `[CONFIRM]` placeholders. Verify the 5,660-set figure is current before publishing.

### Problem

Progressive overload — methodically increasing training stimulus across a mesocycle — is the central driver of muscle hypertrophy. Applying it well isn't hard to _understand_; it's tedious to _execute_. It means logging every set and then, each session, working out the next prescription per exercise from the last session's performance, the target proximity-to-failure (RIR), and where you are in the block. Serious self-coached lifters do this by hand in spreadsheets; less-experienced lifters mostly don't do it at all. **Base45 removes the labour**: it makes logging fast and turns last session's results — load, reps, target RIR, mesocycle position, and subjective feedback — into the next session's prescribed **sets, load, and reps**. The product is the primary deliverable, serving self-coached hypertrophy trainees (and, increasingly, newer lifters who get expert-style programming without needing the expertise), with a small and growing user base. The structured data it generates then opened a second question: how much further could applied ML push those recommendations — and what else can the data teach?

### Action

Built **base45.ca** end to end: a SvelteKit/TypeScript multi-user app whose core engine **automates progressive-overload programming** for hypertrophy, backed by a **MotherDuck medallion lakehouse** (bronze → silver → gold, 12 governed views, a data-quality assertion suite, webhook-driven idempotent ETL orchestrated in **Kestra**), with an **MCP server** exposing the governed data to AI agents. The progression logic itself has been iterated several times and is refined by observing the recommendation logs. On top of the data the product generates, I built an **MLflow** track → register → serve → consume research loop with a dual aim: **improve the progression recommendations**, and learn what else the data reveals. The first instinct — supervised prediction of training outcomes (plateaus, set performance) — collapsed: five candidate targets died the same way (plateau ≈ 0 positives, `set_performance` 97% single-class, rep-vs-target ≈ 0). I diagnosed the cause instead of forcing a metric: **the progression engine I had built, plus a disciplined user, form a tight control loop — and a good controller erases the very variance you'd try to predict** ("controller-censoring"). I reformulated around what the controller _can't_ reach — latent states, uncontrolled recovery channels, and anomalies — and shipped a **nonparametric proximity-to-failure (relative-effort) estimator**, leave-one-out validated (≈ 0 error) with an out-of-support guard that refuses physically-impossible extrapolation, validated against the **published RIR-accuracy literature** in lieu of ground-truth labels. Three models run in `@production`; a nightly job has accumulated **5,660 scored sets (2024-06 → 2026-06)** for later mining. Every candidate signal had to pass a persistence test, confound checks, and beat the strongest honest baseline on a time-ordered holdout.

### Result

A working multi-user product that does its core job — automated progressive overload for hypertrophy — well, with a self-built MLOps research layer on top. And, more tellingly for a data-science portfolio, a genuine research finding: _a well-controlled training system suppresses the very signals naive modelling chases, so the honest deliverables are diagnostic, not predictive._ The work reports its negatives plainly (HRV deviation is unforecastable from load or sleep — nothing beats a 7-day baseline; apparent soreness/load coupling turned out to be muscle-group composition, not a within-muscle effect) and surfaces what is real and actionable (calf training under-performs at **~6× the baseline failure rate**; top-set loads run hot). It demonstrates a full product → data-engineering → applied-ML → honest-science lifecycle in one owned system — and it is the clearest evidence of the **performance-ML** direction the portfolio is pointed at.

---

## Slot 3 — HELD (decide direction first)

**Candidate A — Lucia (if targeting AI-forward / applied-AI / agentic roles):** an always-on, self-improving multi-agent system; daemon/companion architecture, cron orchestration, MCP integrations, operational-learning capture/recall loop. Frame around _operation and systems integration_, credit upstream patterns (OpenClaw, Hermes, ClaudeClaw) honestly — NOT as a novel invention.

**Candidate B — Royal BC Museum Handwriting Recognition (if targeting traditional DS/ML):** computer-vision pipeline for historical handwritten text recognition on archival collections. On-brand for a modeling/research role, visually striking, public-good framing, no AI-orchestration baggage.
