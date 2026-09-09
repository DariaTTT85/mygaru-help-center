import { getChildBlocks } from "../lib/notion";
import { splitSections, sectionHref } from "../lib/sections";
export default async function DocumentSections({ id, slug }: { id: string; slug: string }) {
  try {
    const sections = splitSections(await getChildBlocks(id));
    return <ul style={{ margin: "8px 0 20px", paddingLeft: 24, lineHeight: 1.8 }}>
      {sections.map(section => <li key={section.id}><a style={{ color: "#087f75" }} href={sectionHref(slug, section.id)}>{section.title}</a></li>)}
    </ul>;
  } catch {
    return <p>Sections could not be loaded. <a href={`/articles/${encodeURIComponent(slug)}`}>Open document</a></p>;
  }
}
