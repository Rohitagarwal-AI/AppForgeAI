export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#f7f8fb] font-sans text-[#101313]">
      <main className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-12 px-6 py-16 sm:px-10 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0f2f28] text-lg font-semibold text-white">
            AF
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4f5b56]">
            AppForge AI
          </span>
        </div>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-[#101313] sm:text-6xl">
              AppForge AI
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#46524d]">
              Turn a product idea into a structured app blueprint with intent,
              data schema, integrations, and implementation-ready specs.
            </p>
          </div>

          <div className="rounded-lg border border-[#dbe3df] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-[#e7ece9] pb-4">
              <span className="text-sm font-medium text-[#4f5b56]">Pipeline</span>
              <span className="rounded-full bg-[#dff3e6] px-3 py-1 text-xs font-medium text-[#1f6a3b]">
                Ready
              </span>
            </div>
            <div className="space-y-4">
              {["Intent", "Schema", "AppSpec"].map((stage) => (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-md border border-[#e7ece9] px-4 py-3"
                >
                  <span className="font-medium text-[#171d1a]">{stage}</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2f8f54]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
