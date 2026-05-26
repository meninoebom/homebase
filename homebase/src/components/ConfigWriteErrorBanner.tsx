// Inline banner on the settings (Customize) page, shown when a config change
// failed to write to disk (ritual store `configWriteError`). The edit is kept
// in memory so the user doesn't lose their work, but it isn't persisted — this
// banner makes that explicit instead of letting the change look saved (#89).
// Clears on its own once the next edit writes successfully.

export function ConfigWriteErrorBanner() {
  return (
    <div role="alert" className="mb-6 rounded border border-[#FECACA] bg-[#FEF2F2] p-4">
      <p className="font-serif text-[14px] leading-relaxed text-[#991B1B]">
        Your last change couldn’t be saved to your folder — it’s shown here but not written to disk.
        Your folder may be disconnected. Reconnect it under <strong>Your folder</strong> below, then
        edit again to retry.
      </p>
    </div>
  );
}
