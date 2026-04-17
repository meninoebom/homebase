// Parse orient/state.md into its two sections.
//
// Contract: state.md is hand-edited markdown with up to two `## ` headers.
// Missing sections render as empty, not as errors. A blank state.md is a
// valid state — the component shows an edit-me placeholder in that case.

export interface OrientState {
  focus: string;
  oneThing: string;
}

const KNOWN_HEADERS = {
  "This week's focus": "focus",
  "One thing today": "oneThing",
} as const;

export function parseOrientState(md: string): OrientState {
  const out: OrientState = { focus: "", oneThing: "" };
  for (const [header, body] of splitSections(md)) {
    const key = KNOWN_HEADERS[header as keyof typeof KNOWN_HEADERS];
    if (key) out[key] = body.trim();
  }
  return out;
}

function splitSections(md: string): Array<[string, string]> {
  const sections: Array<[string, string]> = [];
  let currentHeader: string | null = null;
  let currentBody: string[] = [];

  for (const line of md.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentHeader !== null) {
        sections.push([currentHeader, currentBody.join("\n")]);
      }
      currentHeader = line.slice(3).trim();
      currentBody = [];
    } else if (currentHeader !== null) {
      currentBody.push(line);
    }
  }
  if (currentHeader !== null) {
    sections.push([currentHeader, currentBody.join("\n")]);
  }
  return sections;
}
