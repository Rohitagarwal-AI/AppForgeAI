# Engineering Decisions

## 1. Validate After Every Stage

The pipeline validates `AppIntent`, `DataSchema`, and `AppSpec` independently. This makes failures local, repairable, and explainable.

## 2. Deterministic Repair Before AI Retry

Repair starts with deterministic strategies because many failures are mechanical: malformed JSON, missing tenant fields, bad references, invalid integration IDs, or missing endpoints. AI retry should be reserved for unresolved semantic failures.

## 3. Provider Gateway Instead of Direct Stage Calls

Stage modules do not import provider SDKs. They accept a `completeAI` callback. This keeps routing, fallback, retries, cost accounting, and provider availability in one place.

## 4. OpenRouter as Escalation Path

Every stage supports primary, fallback, and escalation routing. OpenRouter is configured as the default escalation path so a single key can recover provider outages.

## 5. Registry-Driven Integrations

Integration hooks are validated against a source-of-truth registry. This prevents generated AppSpecs from inventing integration actions that later code generation cannot implement.

## 6. Optional PostgreSQL Store

The app defaults to in-memory storage for easy setup, but `DATABASE_URL` activates PostgreSQL. This keeps the demo fast while leaving a production deployment path.

## 7. Local Deterministic Planner

The evaluation suite and local demos should work without paid API keys. The deterministic planner uses the same validation, repair, telemetry, and SSE paths, so it is a fallback mode rather than a separate demo.

## 8. UI Shows Structured Sections, Not Raw JSON

The AppSpec viewer prioritizes pages, APIs, schema, workflows, provider usage, errors, and repair logs as readable operational panels. Raw JSON is intentionally not the main experience.
