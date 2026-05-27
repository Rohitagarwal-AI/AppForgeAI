'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { JsonViewer } from '@/components/ui/JsonViewer';

type AssistantRequest = {
  message: string;
  context?: Record<string, unknown>;
};

export default function AssistantPage(): React.JSX.Element {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  async function send() {
    if (!message) return;
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message } as AssistantRequest),
      });
      const data = await res.json();
      setAnswer(data.answer ?? 'No answer');
    } catch {
      setAnswer('Failed to get answer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-4 text-2xl font-semibold text-text-primary">AI Assistant</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Assistant Chat">
            <p className="mb-3 text-sm text-text-muted">
              Ask the assistant to explain AppSpecs, validation errors, repair logs, or integrations.
            </p>
            <textarea
              className="w-full rounded border border-border bg-bg-primary p-3 text-text-primary"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Ask me to explain your generated AppSpec, validation errors, repair strategy, or integrations."
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2 text-sm text-text-muted">
                <button
                  onClick={() => setMessage('Explain this AppSpec in simple words')}
                  className="rounded border border-border px-3 py-1"
                >
                  Explain AppSpec
                </button>
                <button
                  onClick={() => setMessage('Why did validation fail?')}
                  className="rounded border border-border px-3 py-1"
                >
                  Why validation?
                </button>
              </div>
              <div>
                <button
                  onClick={() => void send()}
                  disabled={loading}
                  className="rounded bg-accent px-3 py-1 text-white disabled:opacity-60"
                >
                  {loading ? 'Thinking…' : 'Send'}
                </button>
              </div>
            </div>
          </Card>
          {answer && (
            <Card title="Answer" className="mt-4">
              <p className="text-sm text-text-primary whitespace-pre-wrap">{answer}</p>
            </Card>
          )}
        </div>

        <div>
          <Card title="Context (Example)">
            <JsonViewer data={{}} />
          </Card>
        </div>
      </div>
    </main>
  );
}
