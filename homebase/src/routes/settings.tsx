// /settings — manage the Homebase workspace folder.
//
// Reached from the "Folders" link in the accordion footer. Renders the
// FolderSettings panel (which shows the connected folder and lets the user
// change it) inside the same editorial chrome as the horizon editor: a back
// link to Homebase, the strategy-scope palette, the centered column.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderSettings } from "../components/FolderSettings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="strategy-scope min-h-screen">
      <div className="mx-auto max-w-[760px] px-8 pt-10 pb-24">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mb-14 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 py-1.5 font-sans text-[11px] font-medium uppercase transition-colors hover:text-[var(--ink-1)]"
          style={{ color: "var(--ink-3)", letterSpacing: "0.24em" }}
        >
          <span
            aria-hidden="true"
            className="italic"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "16px",
              transform: "translateY(-1px)",
            }}
          >
            ←
          </span>
          Homebase
        </button>
        <FolderSettings />
      </div>
    </div>
  );
}
