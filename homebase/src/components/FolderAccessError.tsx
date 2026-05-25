// FolderAccessError — full-page recovery screen shown when Homebase can't reach
// the workspace folder at all (a real fs error reading/writing the config:
// revoked permission, folder moved or deleted). Distinct from
// ConfigRecoveryScreen (the config file's contents are bad → Reset) because the
// recovery here is to RECONNECT the folder, not rewrite the config. Rendered by
// /day on accessError, so loadToday can't hang the page silently (#85).

const DAY_SANS =
  "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif";

export function FolderAccessError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: DAY_SANS }}>
      <div className="mx-auto max-w-[640px] px-8 pt-12 pb-12">
        <h1
          className="mb-4"
          style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.02em", color: "#111" }}
        >
          Homebase can’t reach your folder
        </h1>
        <p style={{ fontSize: "17px", lineHeight: 1.55, color: "#374151", margin: "0 0 16px" }}>
          Your homebase folder may have been moved, deleted, or had its permission revoked. Your
          writing is safe on disk — Homebase just can’t read or write it right now. Reconnect the
          folder from <strong>Customize → Your folder</strong>, then try again.
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
