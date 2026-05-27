# Evaluation Summary

Generated with `npm run evaluate` using deterministic local routing.

## Results

- Success rate: 5/5
- Integration detection: 5/5
- Total latency: 261ms
- Total estimated cost: $0.0000

| Case | Status | Failed Stage | Detected Integrations | Validation Items | Latency (ms) |
| --- | --- | --- | --- | ---: | ---: |
| real-estate-crm-whatsapp | pass | - | whatsapp | 0 | 129 |
| warehouse-inventory-sheets | pass | - | google_sheets | 0 | 22 |
| ecommerce-stripe-gmail | pass | - | gmail, stripe | 0 | 25 |
| project-management-slack-jira | pass | - | slack, jira | 0 | 76 |
| vague-custom-app | pass | - | - | 0 | 9 |

## Notes

The evaluation runner forces local deterministic routing so hiring reviewers can reproduce the suite without provider API keys. Provider-backed runs use the same orchestrator, validation, repair, and telemetry paths.
