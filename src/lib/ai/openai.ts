import OpenAI from 'openai';

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateOpenAIJson(system: string, prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }
  return JSON.parse(content);
}
