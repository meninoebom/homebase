import { describe, expect, it } from "vite-plus/test";
import { extractItems, extractLead } from "./markdown-preview";

describe("extractLead", () => {
  it("returns null for empty content", () => {
    expect(extractLead("")).toBeNull();
    expect(extractLead("   \n\n   ")).toBeNull();
  });

  it("returns the first paragraph", () => {
    expect(extractLead("This is the lead.")).toBe("This is the lead.");
    expect(extractLead("First line.\nSecond line.\n\nThird paragraph.")).toBe(
      "First line. Second line.",
    );
  });

  it("skips a leading heading and pulls the next paragraph", () => {
    expect(extractLead("# Title\n\nThe lead paragraph.")).toBe("The lead paragraph.");
    expect(extractLead("## Subhead\n\nLead text.\nMore lead.")).toBe("Lead text. More lead.");
  });

  it("returns null when the content is only headings", () => {
    expect(extractLead("# Title\n## Subhead\n### Smaller")).toBeNull();
  });

  it("returns null when the content starts with a bullet list", () => {
    expect(extractLead("- First item\n- Second item")).toBeNull();
    expect(extractLead("* First item\n* Second item")).toBeNull();
    expect(extractLead("1. Numbered\n2. Items")).toBeNull();
  });

  it("returns the paragraph that comes before a bullet list", () => {
    const md = "Lead sentence.\n\n- bullet one\n- bullet two";
    expect(extractLead(md)).toBe("Lead sentence.");
  });
});

describe("extractItems", () => {
  it("returns empty array for content without bullets", () => {
    expect(extractItems("")).toEqual([]);
    expect(extractItems("Just a paragraph.")).toEqual([]);
    expect(extractItems("# Title\n\nA paragraph.")).toEqual([]);
  });

  it("extracts top-level dash bullets", () => {
    const md = "- First item\n- Second item\n- Third item";
    expect(extractItems(md)).toEqual(["First item", "Second item", "Third item"]);
  });

  it("extracts top-level asterisk bullets", () => {
    expect(extractItems("* one\n* two")).toEqual(["one", "two"]);
  });

  it("extracts top-level numbered bullets", () => {
    expect(extractItems("1. one\n2. two\n3. three")).toEqual(["one", "two", "three"]);
  });

  it("strips GFM checkbox prefixes", () => {
    const md = "- [ ] Pending item\n- [x] Done item\n- [X] Capital X done";
    expect(extractItems(md)).toEqual(["Pending item", "Done item", "Capital X done"]);
  });

  it("skips nested bullets", () => {
    const md = "- Top one\n  - Nested\n  - Also nested\n- Top two";
    expect(extractItems(md)).toEqual(["Top one", "Top two"]);
  });

  it("skips empty bullets", () => {
    expect(extractItems("- \n- real one\n- ")).toEqual(["real one"]);
  });

  it("respects the max cap", () => {
    const md = Array.from({ length: 20 }, (_, i) => `- item ${i}`).join("\n");
    expect(extractItems(md, 5)).toHaveLength(5);
    expect(extractItems(md, 5)).toEqual(["item 0", "item 1", "item 2", "item 3", "item 4"]);
  });

  it("interleaves with paragraphs and only picks the bullets", () => {
    const md = "An intro paragraph.\n\n- bullet one\n\nMore prose.\n\n- bullet two";
    expect(extractItems(md)).toEqual(["bullet one", "bullet two"]);
  });
});
