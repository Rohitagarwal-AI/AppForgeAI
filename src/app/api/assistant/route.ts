import { NextResponse } from 'next/server';

type Body = {
  message: string;
  context?: unknown;
};

async function openaiReply(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('No OpenAI key');

  const start = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 }),
  });
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? '';
  return { answer: String(text), provider: 'openai', latencyMs: Date.now() - start };
}

async function anthropicReply(prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('No Anthropic key');
  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: 'claude-2', prompt }),
  });
  const json = await res.json();
  const text = json?.completion ?? '';
  return { answer: String(text), provider: 'anthropic', latencyMs: Date.now() - start };
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const prompt = `You are Assistant for AppForgeAI. Explain the pipeline and answer user queries concisely. User: ${body.message}`;

  try {
    if (process.env.OPENAI_API_KEY) {
      const out = await openaiReply(prompt);
      return NextResponse.json(out);
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const out = await anthropicReply(prompt);
      return NextResponse.json(out);
    }

    // No provider — friendly fallback
    const fallback = {
      answer:
        'No AI provider configured. Install OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to enable the assistant. Meanwhile: ' +
        'The assistant explains AppIntent, DataSchema, AppSpec, validationErrors and repairLogs provided in context in concise, practical language.',
      provider: 'none',
      latencyMs: 0,
    };

    return NextResponse.json(fallback);
  } catch {
    return NextResponse.json({ answer: 'Provider error', provider: 'error', latencyMs: 0 }, { status: 500 });
  }
}
