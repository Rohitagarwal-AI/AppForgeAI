# Anthropic (Claude) Integration Notes

This file documents how the project can use Anthropic (Claude) as an AI
provider for the AI Assistant and for pipeline stages.

Environment
-----------

Set your Anthropic API key in the environment:

```
ANTHROPIC_API_KEY=sk-...your-anthropic-key...
```

Recommended model names may vary — the project will use `ANTHROPIC_API_KEY`
when present as a secondary provider for assistant/repair stages. The assistant
API endpoint in this repository (`/api/assistant`) will prefer providers in
this order: OpenAI → Anthropic → Gemini.

Quick curl example (completion):

```bash
curl https://api.anthropic.com/v1/complete \
	-H "x-api-key: $ANTHROPIC_API_KEY" \
	-H "Content-Type: application/json" \
	-d '{"model":"claude-2","prompt":"Explain the AppSpec: ...","max_tokens":400}'
```

Notes
-----

- The repository includes a lightweight assistant router that will call the
	Anthropic API when `ANTHROPIC_API_KEY` is available.
- For production usage, prefer the official Anthropic SDK (`@anthropic-ai/sdk`) and
	server-side secrets (do not expose service role keys to the browser).
- If no provider key is present, the assistant returns a friendly fallback
	response explaining how to enable providers.

