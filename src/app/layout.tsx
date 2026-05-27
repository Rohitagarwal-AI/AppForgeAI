import type { Metadata } from 'next';
import '@/app/globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'AppForgeAI | AI Application Generation Pipeline',
  description:
    'Generate full-stack application specifications from natural language prompts using a multi-stage AI pipeline with intent extraction, schema generation, and AppSpec synthesis.',
};

/**
 * Root layout — wraps the app with a persistent sidebar and applies the
 * dark theme background.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary">
        <div className="flex">
          <Navigation />
          <main className="flex-1 min-h-screen p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
