type Article = {
  id: string;
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
};

type NotionBlock = any;

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
  const databaseId = process.env.NOTION_DATABASE_ID;

  const data = await notionRequest(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Status", select: { equals: "Ready" } },
            { property: "Slug", rich_text: { equals: slug } },
          ],
        },
        page_size: 1,
      }),
    }
  );

  if (!data.results?.length) return null;

  const page = data.results[0];

  return {
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: page.properties?.Category?.select?.name || "",
    shortAnswer:
      page.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
  };
}

async function getBlocks(pageId: string): Promise<NotionBlock[]> {
  let blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100&start_cursor=${cursor}`
      : `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`;

    const data = await notionRequest(url);

    blocks = [...blocks, ...(data.results || [])];
    hasMore = data.has_more || false;
    cursor = data.next_cursor || undefined;
  }

  return blocks;
}

function renderBlock(block: NotionBlock) {
  const type = block.type;
  const value = block[type];

  if (!value) return null;

  if (type === "heading_1") {
    return (
      <h1 style={{ fontSize: 34, margin: "40px 0 18px", lineHeight: 1.2 }}>
        {getPlainText(value.rich_text)}
      </h1>
    );
  }

  if (type === "heading_2") {
    return (
      <h2 style={{ fontSize: 27, margin: "36px 0 16px", lineHeight: 1.25 }}>
        {getPlainText(value.rich_text)}
      </h2>
    );
  }

  if (type === "heading_3") {
    return (
      <h3 style={{ fontSize: 22, margin: "30px 0 14px", lineHeight: 1.3 }}>
        {getPlainText(value.rich_text)}
      </h3>
    );
  }

  if (type === "paragraph") {
    const text = getPlainText(value.rich_text);

    if (!text) {
      return <div style={{ height: 14 }} />;
    }

    return (
      <p style={{ fontSize: 17, lineHeight: 1.75, margin: "0 0 18px", color: "#222" }}>
        {text}
      </p>
    );
  }

  if (type === "image") {
    const src = value.type === "external" ? value.external.url : value.file.url;
    const caption = getPlainText(value.caption || []);

    return (
      <figure style={{ margin: "34px 0", textAlign: "center" }}>
        <img
          src={src}
          alt={caption || ""}
          style={{
            maxWidth: "100%",
            maxHeight: 620,
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
            borderRadius: 18,
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
        {getPlainText(value.rich_text)}
      </blockquote>
    );
  }

  if (type === "divider") {
    return <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "34px 0" }} />;
  }

  return null;
}

function renderBlocks(blocks: NotionBlock[]) {
  const elements = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item") {
      const listItems = [];

      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        listItems.push(
          <li key={blocks[i].id} style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 8 }}>
            {getPlainText(blocks[i].bulleted_list_item.rich_text)}
          </li>
        );
        i++;
      }

      elements.push(
        <ul key={`ul-${block.id}`} style={{ margin: "0 0 22px 24px", paddingLeft: 18 }}>
          {listItems}
        </ul>
      );

      continue;
    }

    if (block.type === "numbered_list_item") {
      const listItems = [];

      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        listItems.push(
          <li key={blocks[i].id} style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 8 }}>
            {getPlainText(blocks[i].numbered_list_item.rich_text)}
          </li>
        );
        i++;
      }

      elements.push(
        <ol key={`ol-${block.id}`} style={{ margin: "0 0 22px 24px", paddingLeft: 18 }}>
          {listItems}
        </ol>
      );

      continue;
    }

    elements.push(<div key={block.id}>{renderBlock(block)}</div>);
    i++;
  }

  return elements;
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <main style={{ padding: 40, fontFamily: "Ubuntu, Arial, sans-serif" }}>
        <h1>Article not found</h1>
        <a href="/">Back to Help Center</a>
      </main>
    );
  }

  const blocks = await getBlocks(article.id);

  const backHref =
    article.category === "Market Analysis"
      ? "/market-analysis"
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
      <header style={{ padding: "18px 72px", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            background: "rgba(255,255,255,0.94)",
            borderRadius: 999,
            padding: "12px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 14px 38px rgba(0,0,0,0.10)",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#111",
              textDecoration: "none",
            }}
          >
            <img src="/mygaru-icon.png" alt="myGaru" style={{ width: 42, height: 42 }} />
            <strong style={{ fontSize: 28 }}>myGaru</strong>
          </a>

          <a
            href="/"
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "13px 24px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            Help Center Home
          </a>
        </div>
      </header>

      <section style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px 90px" }}>
        <div style={{ fontSize: 14, color: "#777", marginBottom: 24 }}>
          <a href="/" style={{ color: "#777", textDecoration: "none" }}>
            All collections
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
            padding: "46px 54px",
            boxShadow: "0 14px 42px rgba(0,0,0,0.07)",
          }}
        >
          <h1
            style={{
              fontSize: 42,
              lineHeight: 1.15,
              margin: "0 0 18px",
              letterSpacing: "-0.8px",
            }}
          >
            {article.title}
          </h1>

          {article.shortAnswer && (
            <p style={{ fontSize: 20, lineHeight: 1.6, color: "#555", margin: "0 0 32px" }}>
              {article.shortAnswer}
            </p>
          )}

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "28px 0" }} />

          <div>{renderBlocks(blocks)}</div>

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
