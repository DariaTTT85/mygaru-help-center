export type Section = { id: string; title: string; blocks: any[] };

// Only top-level Heading 1 blocks divide the document. Nested headings stay inside.
export function splitSections(blocks: any[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { id: "introduction", title: "Introduction", blocks: [] };
  for (const block of blocks) {
    if (block.type === "heading_1") {
      if (current.blocks.length) sections.push(current);
      current = {
        id: block.id.replace(/-/g, ""),
        title: (block.heading_1.rich_text || []).map((t: any) => t.plain_text ?? t.text?.content ?? "").join("") || "Untitled section",
        blocks: [block],
      };
    } else current.blocks.push(block);
  }
  if (current.blocks.length) sections.push(current);
  return sections;
}

export function sectionHref(slug: string, id: string) {
  return `/articles/${encodeURIComponent(slug)}?section=${encodeURIComponent(id)}`;
}
