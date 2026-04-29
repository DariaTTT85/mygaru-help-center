import type { ReactNode } from "react";

type Article = {
  id: string;
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
};

type NotionBlock = any;

const LOGO_SRC = "/myGaru_logo_black.png";

function getPlainText(richText: any[] = []) {
  return richText.map((text) => text.plain_text).join("");
}

async function notionRequest(url: string, options: RequestInit = {}) {
  const token = process.env.NOTION_TOKEN;

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

  return response.json();
}

async function getArticle(slug: string): Promise<Article | null> {
  if (!slug) return null;

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return null;

  const data = await notionRequest(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: "Status",
          select: {
            equals: "Ready",
          },
        },
        page_size: 100,
      }),
    }
  );

  if (!data.results?.length) return null;

  const page = data.results.find((item: any) => {
    const itemSlug = item.properties?.Slug?.rich_text?.[0]?.plain_text || "";
    return itemSlug === slug;
  });

  if (!page) return null;

  return {
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: page.properties?.Category?.select?.name || "",
    shortAnswer:
      page.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
  };
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
  if (!params.slug) {
    return (
      <main
        style={{
          fontFamily: "Ubuntu, Arial, sans-serif",
          background: "#f4f3ef",
          minHeight: "100vh",
          padding: 40,
        }}
      >
        <h1>Invalid article</h1>
        <a href="/" style={{ color: "#168f82" }}>
          Back to Help Center
        </a>
      </main>
    );
  }

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
          This article could not be found. Please check that the Notion Slug
          field is filled in and matches the URL.
        </p>
        <a href="/" style={{ color: "#168f82" }}>
          Back to Help Center
        </a>
      </main>
    );
  }

  const blocks = await getBlocksWithChildren(article.id);

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
      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 54%, rgba(68,207,189,0.58) 72%, rgba(244,243,239,0.96) 91%, #f4f3ef 100%)",
          padding: "22px 60px 94px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
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
            href="/"
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "12px 22px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            Help Center Home
          </a>
        </header>

        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111",
              marginBottom: 14,
              opacity: 0.72,
            }}
          >
            {article.category}
          </div>

          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.08,
              margin: "0 0 16px",
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
                color: "#111",
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
          margin: "-54px auto 0",
          padding: "0 24px 90px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#777",
            marginBottom: 18,
          }}
        >
          <a href="/" style={{ color: "#777", textDecoration: "none" }}>
            Home
          </a>{" "}
          ›{" "}
          <a href={backHref} style={{ color: "#777", textDecoration: "none" }}>
            {article.category}
          </a>{" "}
          › {article.title}
        </div>

        <article
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 30,
            padding: "44px 52px",
            boxShadow: "0 16px 42px rgba(0,0,0,0.10)",
          }}
        >
          <div>{renderNestedBlocks(blocks)}</div>

          <div
            style={{
              marginTop: 38,
              padding: 22,
              background: "#f7f6f2",
              borderRadius: 18,
            }}
          >
            <strong>Back to: </strong>
            <a href={backHref} style={{ color: "#111" }}>
              {article.category}
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
