// Generic prompt slot — title + optional hints + writing field.
//
// Replaces the bespoke Dreams, Inner Weather, Morning Practices,
// Creative Projects, and Orient slots. Driven entirely by config: a
// PromptSlotConfig with optional title, required prompt, optional
// hints array. Renders identically to the prior bespoke components
// when given the matching config.

import { RitualEditor } from "./RitualEditor";
import type { PromptSlotConfig } from "../lib/config";

interface PromptSlotProps {
  config: PromptSlotConfig;
  initialDraft: string;
  onDraft: (body: string) => void;
}

export function PromptSlot({ config, initialDraft, onDraft }: PromptSlotProps) {
  return (
    <div>
      {config.hints && config.hints.length > 0 && (
        <p
          className="mb-2"
          style={{
            fontFamily:
              "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "#9CA3AF",
            margin: "0 0 8px",
          }}
        >
          {config.hints.join(" · ")}
        </p>
      )}
      <RitualEditor
        initialContent={initialDraft}
        onChange={onDraft}
        placeholderText={config.prompt}
      />
    </div>
  );
}
