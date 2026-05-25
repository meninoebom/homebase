// DayLoadError — full-page recovery screen shown when today's day file failed
// to load with a real error (not a missing day, which reads as an empty day).
// Rendered by /day instead of the writing editors, mirroring how a config
// failure renders ConfigRecoveryScreen — so the user can't type into a
// blank-looking day and overwrite content that's merely unreadable (#83).

const DAY_SANS =
  "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif";

export function DayLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: DAY_SANS }}>
      <div className="mx-auto max-w-[640px] px-8 pt-12 pb-12">
        <h1
          className="mb-4"
          style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.02em", color: "#111" }}
        >
          Today’s writing couldn’t be opened
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.55, color: "#374151", margin: "0 0 16px" }}>
          Homebase couldn’t read today’s file. Its content may still be on disk — don’t write here
          until it loads, or you could overwrite it. Check that your folder is still connected
          (Customize → Your folder), then try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded bg-[#111] px-5 py-2.5 text-white hover:bg-[#374151]"
          style={{ fontFamily: DAY_SANS, fontSize: "15px", fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
