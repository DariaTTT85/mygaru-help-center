import type { ReactNode } from "react";

type Article = {
  id: string;
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
  order: number;
  parentIds: string[];
};

type NotionBlock = any;

const LOGO_SRC = "/myGaru_logo_black.png";

function getPlainText(richText: any[] = []) {
  return richText.map((text) => text.plain_text).join("");
}

async function notionRequest(url: string, options: RequestInit = {}) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("Missing NOTION_TOKEN");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  return response.json();
}

async function getArticle(slug: string): Promise<Article | null> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  const decodedSlug = decodeURIComponent(slug || "").trim();

  if (!databaseId || !decodedSlug) return null;

  const data = await notionRequest(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Status", select: { equals: "Ready" } },
            { property: "Slug", rich_text: { equals: decodedSlug } },
          ],
        },
        page_size: 1,
      }),
    }
  );

  if (!data?.results?.length) return null;

  const page = data.results[0];

  return {
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: page.properties?.Category?.select?.name || "",
    shortAnswer:
      page.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: page.properties?.Order?.number || 999,
    parentIds:
      page.properties?.["Parent article"]?.relation?.map((r: any) => r.id) ||
      [],
  };
}

async function getArticlesForNavigation(article: Article): Promise<Article[]> {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId || !article.category) return [];

  const data = await notionRequest(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Status", select: { equals: "Ready" } },
            { property: "Category", select: { equals: article.category } },
          ],
        },
        sorts: [{ property: "Order", direction: "ascending" }],
        page_size: 100,
      }),
    }
  );

  if (!data?.results?.length) return [];

  const allArticles: Article[] = data.results.map((page: any) => ({
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: page.properties?.Category?.select?.name || "",
    shortAnswer:
      page.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: page.properties?.Order?.number || 999,
    parentIds:
      page.properties?.["Parent article"]?.relation?.map((r: any) => r.id) ||
      [],
  }));

  if (article.category === "Market Analysis" && article.parentIds.length === 1) {
    const parentId = article.parentIds[0];

    return allArticles
      .filter((item) => item.parentIds.includes(parentId))
      .filter((item) => Boolean(item.slug))
      .sort((a, b) => a.order - b.order);
  }

  return allArticles
    .filter((item) => Boolean(item.slug))
    .filter((item) => item.parentIds.length === article.parentIds.length)
    .sort((a, b) => a.order - b.order);
}

async function getChildBlocks(blockId: string): Promise<NotionBlock[]> {
  let blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100&start_cursor=${cursor}`
      : `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`;

    const data = await notionRequest(url);

    if (!data) return blocks;

    blocks = [...blocks, ...(data.results || [])];
    hasMore = data.has_more || false;
    cursor = data.next_cursor || undefined;
  }

  return blocks;
}

async function getBlocksWithChildren(pageId: string): Promise<NotionBlock[]> {
  const rootBlocks = await getChildBlocks(pageId);

  async function attachChildren(blocks: NotionBlock[]): Promise<NotionBlock[]> {
    return Promise.all(
      blocks.map(async (block) => {
        if (block.has_children) {
          const children = await getChildBlocks(block.id);
          block.children = await attachChildren(children);
        }

        return block;
      })
    );
  }

  return attachChildren(rootBlocks);
}

function renderInlineText(richText: any[] = []) {
  return richText.map((text, index) => {
    const annotations = text.annotations || {};
    let element: ReactNode = text.plain_text;

    if (annotations.bold) element = <strong>{element}</strong>;
    if (annotations.italic) element = <em>{element}</em>;
    if (annotations.strikethrough) element = <s>{element}</s>;
    if (annotations.underline) element = <u>{element}</u>;

    if (annotations.code) {
      element = (
        <code
          style={{
            background: "#f1f0ec",
            borderRadius: 6,
            padding: "2px 6px",
            fontSize: "0.92em",
          }}
        >
          {element}
        </code>
      );
    }

    if (text.href) {
      element = (
        <a
          href={text.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#168f82",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {element}
        </a>
      );
    }

    return <span key={index}>{element}</span>;
  });
}

function renderTable(block: NotionBlock) {
  const rows = block.children || [];
  const hasColumnHeader = block.table?.has_column_header || false;

  if (!rows.length) return null;

  return (
    <div
      style={{
        overflowX: "auto",
        margin: "30px 0",
        border: "1px solid #e4e1d8",
        borderRadius: 16,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 15,
          lineHeight: 1.5,
          background: "white",
        }}
      >
        <tbody>
          {rows.map((row: NotionBlock, rowIndex: number) => {
            const cells = row.table_row?.cells || [];
            const isHeader = hasColumnHeader && rowIndex === 0;

            return (
              <tr
                key={row.id}
                style={{
                  background: isHeader ? "#f7f6f2" : "white",
                }}
              >
                {cells.map((cell: any[], cellIndex: number) => {
                  const CellTag = isHeader ? "th" : "td";

                  return (
                    <CellTag
                      key={`${row.id}-${cellIndex}`}
                      style={{
                        padding: "12px 14px",
                        borderBottom:
                          rowIndex === rows.length - 1
                            ? "none"
                            : "1px solid #eee",
                        borderRight:
                          cellIndex === cells.length - 1
                            ? "none"
                            : "1px solid #eee",
                        textAlign: "left",
                        verticalAlign: "top",
                        fontWeight: isHeader ? 700 : 400,
                        color: "#222",
                        minWidth: 160,
                      }}
                    >
                      {renderInlineText(cell)}
                    </CellTag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function renderNestedBlocks(blocks: NotionBlock[], level = 0) {
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item") {
      const items: ReactNode[] = [];

      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        const current = blocks[i];

        items.push(
          <li
            key={current.id}
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            {renderInlineText(current.bulleted_list_item.rich_text)}

            {current.children?.length ? (
              <div style={{ marginTop: 8 }}>
                {renderNestedBlocks(current.children, level + 1)}
              </div>
            ) : null}
          </li>
        );

        i++;
      }

      elements.push(
        <ul
          key={`ul-${block.id}`}
          style={{
            margin: level === 0 ? "0 0 22px 26px" : "8px 0 8px 22px",
            paddingLeft: 20,
            listStylePosition: "outside",
          }}
        >
          {items}
        </ul>
      );

      continue;
    }

    if (block.type === "numbered_list_item") {
      const items: ReactNode[] = [];

      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        const current = blocks[i];

        items.push(
          <li
            key={current.id}
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              marginBottom: 8,
              paddingLeft: 2,
            }}
          >
            {renderInlineText(current.numbered_list_item.rich_text)}

            {current.children?.length ? (
              <div style={{ marginTop: 8 }}>
                {renderNestedBlocks(current.children, level + 1)}
              </div>
            ) : null}
          </li>
        );

        i++;
      }

      elements.push(
        <ol
          key={`ol-${block.id}`}
          style={{
            margin: level === 0 ? "0 0 22px 26px" : "8px 0 8px 22px",
            paddingLeft: 20,
            listStylePosition: "outside",
          }}
        >
          {items}
        </ol>
      );

      continue;
    }

    elements.push(<div key={block.id}>{renderBlock(block, level)}</div>);
    i++;
  }

  return elements;
}

function renderBlock(block: NotionBlock, level = 0) {
  const type = block.type;
  const value = block[type];

  if (!value) return null;

  if (type === "heading_1") {
    return (
      <h1 style={{ fontSize: 34, margin: "42px 0 18px", lineHeight: 1.2 }}>
        {renderInlineText(value.rich_text)}
      </h1>
    );
  }

  if (type === "heading_2") {
    return (
      <h2 style={{ fontSize: 27, margin: "36px 0 16px", lineHeight: 1.25 }}>
        {renderInlineText(value.rich_text)}
      </h2>
    );
  }

  if (type === "heading_3") {
    return (
      <h3 style={{ fontSize: 22, margin: "30px 0 14px", lineHeight: 1.3 }}>
        {renderInlineText(value.rich_text)}
      </h3>
    );
  }

  if (type === "paragraph") {
    const text = getPlainText(value.rich_text);

    if (!text && !block.children?.length) {
      return <div style={{ height: 14 }} />;
    }

    return (
      <div style={{ margin: "0 0 18px" }}>
        {text && (
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              margin: 0,
              color: "#222",
            }}
          >
            {renderInlineText(value.rich_text)}
          </p>
        )}

        {block.children?.length ? (
          <div style={{ marginTop: 8 }}>
            {renderNestedBlocks(block.children, level + 1)}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === "table") return renderTable(block);

  if (type === "table_row") return null;

  if (type === "image") {
    const src = value.type === "external" ? value.external.url : value.file.url;
    const caption = getPlainText(value.caption || []);

    return (
      <figure
        style={{
          margin: "32px auto",
          textAlign: "center",
          maxWidth: "100%",
        }}
      >
        <img
          src={src}
          alt={caption || ""}
          style={{
            maxWidth: "100%",
            maxHeight: 620,
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
            borderRadius: 16,
            border: "1px solid #eee",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        />

        {caption && (
          <figcaption
            style={{
              marginTop: 10,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#777",
            }}
          >
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (type === "quote") {
    return (
      <blockquote
        style={{
          margin: "28px 0",
          padding: "18px 22px",
          borderLeft: "4px solid #44cfbd",
          background: "#f7f6f2",
          borderRadius: 12,
          fontSize: 17,
          lineHeight: 1.7,
          color: "#333",
        }}
      >
        {renderInlineText(value.rich_text)}
      </blockquote>
    );
  }

  if (type === "callout") {
    const icon = value.icon?.emoji || "ℹ️";

    return (
      <div
        style={{
          margin: "28px 0",
          padding: "18px 22px",
          background: "#f7f6f2",
          border: "1px solid #e4e1d8",
          borderRadius: 16,
          fontSize: 17,
          lineHeight: 1.7,
          display: "flex",
          gap: 14,
        }}
      >
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <div>
          {renderInlineText(value.rich_text)}
          {block.children?.length ? (
            <div style={{ marginTop: 10 }}>
              {renderNestedBlocks(block.children, level + 1)}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (type === "divider") {
    return (
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #eee",
          margin: "34px 0",
        }}
      />
    );
  }

  if (type === "to_do") {
    return (
      <div
        style={{
          display: "flex",
          gap: 10,
          margin: "0 0 12px",
          fontSize: 17,
          lineHeight: 1.7,
        }}
      >
        <span>{value.checked ? "☑" : "☐"}</span>
        <span>{renderInlineText(value.rich_text)}</span>
      </div>
    );
  }

  if (type === "toggle") {
    return (
      <details
        style={{
          margin: "18px 0",
          padding: "16px 18px",
          background: "#f7f6f2",
          border: "1px solid #e4e1d8",
          borderRadius: 14,
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          {renderInlineText(value.rich_text)}
        </summary>

        {block.children?.length ? (
          <div style={{ marginTop: 14 }}>
            {renderNestedBlocks(block.children, level + 1)}
          </div>
        ) : null}
      </details>
    );
  }

  if (type === "column_list") {
    const columns = block.children || [];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            columns.length === 2
              ? "minmax(180px, 0.8fr) minmax(0, 2.2fr)"
              : `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))`,
          gap: 28,
          alignItems: "start",
          margin: "28px 0 34px",
        }}
      >
        {columns.map((column: NotionBlock) => (
          <div key={column.id}>
            {renderNestedBlocks(column.children || [], level + 1)}
          </div>
        ))}
      </div>
    );
  }

  if (type === "column") {
    return <div>{renderNestedBlocks(block.children || [], level + 1)}</div>;
  }

  if (type === "code") {
    return (
      <pre
        style={{
          background: "#111",
          color: "white",
          padding: 20,
          borderRadius: 16,
          overflowX: "auto",
          fontSize: 14,
          lineHeight: 1.6,
          margin: "28px 0",
        }}
      >
        <code>{getPlainText(value.rich_text)}</code>
      </pre>
    );
  }

  if (type === "bookmark" || type === "embed" || type === "link_preview") {
    const url = value.url;

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          margin: "22px 0",
          padding: "18px 20px",
          border: "1px solid #e4e1d8",
          borderRadius: 16,
          color: "#168f82",
          background: "#fff",
          textDecoration: "none",
          wordBreak: "break-word",
        }}
      >
        {url}
      </a>
    );
  }

  return null;
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <main
        style={{
          fontFamily: "Ubuntu, Arial, sans-serif",
          background: "#f4f3ef",
          minHeight: "100vh",
          padding: 40,
        }}
      >
        <h1>Article not found</h1>
        <p style={{ color: "#555", fontSize: 16 }}>
          Please check that the Notion Slug field exactly matches the URL.
        </p>
        <a href="/" style={{ color: "#168f82" }}>
          Back to Help Center
        </a>
      </main>
    );
  }

  const blocks = await getBlocksWithChildren(article.id);
  const navArticles = await getArticlesForNavigation(article);

  const currentIndex = navArticles.findIndex((item) => item.id === article.id);
  const nextArticle =
    currentIndex >= 0 && currentIndex < navArticles.length - 1
      ? navArticles[currentIndex + 1]
      : null;

  const backHref =
    article.category === "Market Analysis"
      ? "/market-analysis"
      : article.category === "Integrations Guide"
      ? "/integrations-guide"
      : article.category === "Legal Documents"
      ? "/legal-documents"
      : "/product-guide";

  return (
    <main
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: "#f4f3ef",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      <style>{`
        .floating-back {
          transition: transform 170ms ease, box-shadow 170ms ease, background 170ms ease;
        }

        .floating-back:hover {
          transform: translateY(-50%) translateX(-3px) scale(1.06);
          background: #44cfbd;
          box-shadow: 0 18px 38px rgba(0,0,0,0.18);
        }

        .floating-back:hover span {
          color: #111;
        }

        .bottom-nav-card {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }

        .bottom-nav-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0,0,0,0.10);
          border-color: rgba(68,207,189,0.55);
        }
      `}</style>

      <a
        href={backHref}
        className="floating-back"
        title={`Back to ${article.category}`}
        style={{
          position: "fixed",
          left: 26,
          top: "50%",
          transform: "translateY(-50%)",
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ffffff 0%, #f7f6f2 100%)",
          border: "1px solid #dedbd2",
          boxShadow: "0 14px 32px rgba(0,0,0,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#008f82",
          textDecoration: "none",
          zIndex: 50,
        }}
      >
        <span
          style={{
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1,
            color: "#008f82",
            transform: "translateY(-1px)",
          }}
        >
          ←
        </span>
      </a>

      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 54%, rgba(68,207,189,0.58) 72%, rgba(244,243,239,0.96) 91%, #f4f3ef 100%)",
          padding: "22px 60px 120px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 44,
          }}
        >
          <a href="/" style={{ textDecoration: "none" }}>
            <img
              src={LOGO_SRC}
              alt="myGaru"
              style={{
                height: 42,
                width: "auto",
                display: "block",
              }}
            />
          </a>

          <a
            href="https://mygaru.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "12px 22px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            myGaru website
          </a>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 14,
              opacity: 0.78,
            }}
          >
            {article.category}
          </div>

          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.08,
              margin: "0 0 18px",
              letterSpacing: "-1.4px",
              maxWidth: 900,
            }}
          >
            {article.title}
          </h1>

          {article.shortAnswer && (
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.5,
                maxWidth: 820,
                margin: 0,
                fontWeight: 500,
              }}
            >
              {article.shortAnswer}
            </p>
          )}
        </div>
      </div>

      <section
        style={{
          maxWidth: 980,
          margin: "-66px auto 0",
          padding: "0 24px 90px",
        }}
      >
        <div
          style={{
            fontSize: 15,
            color: "#555",
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          <a href="/" style={{ color: "#555", textDecoration: "none" }}>
            Home
          </a>{" "}
          ›{" "}
          <a href={backHref} style={{ color: "#555", textDecoration: "none" }}>
            {article.category}
          </a>{" "}
          › {article.title}
        </div>

        <article
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 30,
            padding: "48px 56px",
            boxShadow: "0 18px 46px rgba(0,0,0,0.11)",
          }}
        >
          <div>{renderNestedBlocks(blocks)}</div>

          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: nextArticle ? "1fr 1fr" : "1fr",
              gap: 18,
              borderTop: "1px solid #eee",
              paddingTop: 26,
            }}
          >
            <a
              href={backHref}
              className="bottom-nav-card"
              style={{
                display: "block",
                textDecoration: "none",
                color: "#111",
                background:
                  "linear-gradient(135deg, rgba(68,207,189,0.10), #ffffff 70%)",
                border: "1px solid #e4e1d8",
                borderRadius: 18,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#777",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                Back to
              </div>

              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#087f75",
                }}
              >
                ← {article.category}
              </div>
            </a>

            {nextArticle && (
              <a
                href={`/articles/${nextArticle.slug}`}
                className="bottom-nav-card"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "#111",
                  background:
                    "linear-gradient(135deg, rgba(68,207,189,0.14), #ffffff 68%)",
                  border: "1px solid #e4e1d8",
                  borderRadius: 18,
                  padding: "18px 20px",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#777",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Next
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#087f75",
                  }}
                >
                  {nextArticle.title} →
                </div>
              </a>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
