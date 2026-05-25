// Editor-route coverage for the #80 overwrite guard. The full HorizonEditorPage
// owns useParams (needs the router), so we test the exported EditorBody directly
// and inject row state via the store singleton — the same pattern HorizonRow
// tests use. This pins the most consequential site: the standalone editor must
// NOT mount when the row failed to load, or the user could overwrite unreadable
// content.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { EditorBody } from "./horizon.$id";
import { useStrategyStore, type RowState } from "../store/strategy";

function setRow(patch: Partial<RowState>) {
  useStrategyStore.setState((s) => ({
    rows: { ...s.rows, "life-values": { ...s.rows["life-values"], ...patch } },
  }));
}

afterEach(() => {
  setRow({ expanded: false, content: "", carryOver: null, loaded: false, loadError: false });
  vi.restoreAllMocks();
});

describe("EditorBody — loadError guard", () => {
  it("renders the load-error notice and does NOT mount the editor", () => {
    // Silence the auto-retry's console.error: with loaded=false the mount
    // effect re-runs expandRow against the FSA singleton, which throws in jsdom.
    vi.spyOn(console, "error").mockImplementation(() => {});
    setRow({ loadError: true, loaded: false, content: "" });

    render(<EditorBody horizon="life-values" />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t be opened/i);
    // No editable surface — the overwrite hazard is gone.
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
