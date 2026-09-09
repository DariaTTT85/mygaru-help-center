import { getChildBlocks } from "../lib/notion";
import { splitSections, sectionHref } from "../lib/sections";
import styles from "./document-list.module.css";
export default async function DocumentSections({ id, slug }: { id: string; slug: string }) {
  try {
    const sections = splitSections(await getChildBlocks(id));
    return sections.length ? <div className={styles.rows}>
      {sections.map(section => <a className={styles.row} key={section.id} href={sectionHref(slug, section.id)}><span>{section.title}</span><span className={styles.arrow} aria-hidden="true">›</span></a>)}
    </div> : <p className={styles.note}>No sections yet.</p>;
  } catch {
    return <p className={styles.note}>Sections could not be loaded. <a href={`/articles/${encodeURIComponent(slug)}`}>Open document</a></p>;
  }
}
