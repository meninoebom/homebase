/**
 * Pull the body of a single `## <slot>` section from a day-log markdown
 * file. Returns "" if the section is absent. The day header (`# ...`) and
 * other slots' sections are skipped. Used to show yesterday's piano entry
 * read-only above today's editor.
 */
export function extractSection(dayMd: string, slot: string): string {
  for (const [header, body] of splitSections(dayMd)) {
    if (header === slot) return body.trim();
  }
  return "";
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
