import { Suspense } from "react";
import type { Article } from "../lib/notion";
import DocumentSections from "./document-sections";
import styles from "./document-list.module.css";
export default function DocumentList({ articles, legacyGroups = false }: { articles: Article[]; legacyGroups?: boolean }) {
  const ids = new Set(articles.map(article => article.id));
  const documents = legacyGroups ? articles.filter(article => article.parentIds.length !== 1 || !ids.has(article.parentIds[0])) : articles;
  return <>{documents.length ? documents.map(article => {
    const children = legacyGroups && article.parentIds.length !== 1 ? articles.filter(child => child.parentIds.length === 1 && child.parentIds[0] === article.id) : [];
    return <details key={article.id} className={styles.card}>
      <summary className={styles.summary}><h2 className={styles.title}>{article.title}</h2><span className={styles.chevron} aria-hidden="true" /></summary>
      {article.shortAnswer && <p className={styles.note}>{article.shortAnswer}</p>}
      {children.length ? <div className={styles.rows}>{children.map(child => child.slug ? <a key={child.id} className={styles.row} href={`/articles/${encodeURIComponent(child.slug)}`}><span>{child.title}</span><span className={styles.arrow} aria-hidden="true">›</span></a> : <p key={child.id} className={styles.note}>{child.title}</p>)}</div>
        : article.slug ? <Suspense fallback={<p className={styles.note} role="status">Loading sections…</p>}><DocumentSections id={article.id} slug={article.slug} /></Suspense>
        : <p className={styles.note}>No sections available.</p>}
    </details>;
  }) : <p className={styles.note}>No documents yet.</p>}</>;
}
