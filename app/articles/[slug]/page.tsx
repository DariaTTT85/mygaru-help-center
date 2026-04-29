type Article = {
  id: string;
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
};

type NotionBlock = any;

/* =========================
   HELPERS
========================= */

function getPlainText(richText: any[] = []) {
  return richText.map((t) => t.plain_text).join("");
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

/* =========================
   🔴 FIXED: getArticle (без equals по slug)
========================= */

async function getArticle(slug: string): Promise<Article | null> {
  if (!slug) return null;

  const databaseId = process.env.NOTION_DATABASE_ID;

  const data = await notionRequest(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: "Status",
          select: { equals: "Ready" },
        },
        page_size: 100,
      }),
    }
  );

  if (!data.results?.length) return null;

  const page = data.results.find((item: any) => {
    const s = item.properties?.Slug?.rich_text?.[0]?.plain_text || "";
    return s === slug;
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

/* =========================
   BLOCKS
========================= */

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
  const root = await getChildBlocks(pageId);

  async function attach(blocks: NotionBlock[]): Promise<NotionBlock[]> {
    return Promise.all(
      blocks.map(async (b) => {
        if (b.has_children) {
          const children = await getChildBlocks(b.id);
          b.children = await attach(children);
        }
        return b;
      })
    );
  }

  return attach(root);
}

/* =========================
   RENDER
========================= */

function renderInlineText(richText: any[] = []) {
  return richText.map((text, i) => {
    let el: React.ReactNode = text.plain_text;
    const a = text.annotations || {};

    if (a.bold) el = <strong>{el}</strong>;
    if (a.italic) el = <em>{el}</em>;
    if (a.strikethrough) el = <s>{el}</s>;
    if (a.underline) el = <u>{el}</u>;

    if (a.code) {
      el = (
        <code style={{ background: "#f1f0ec", padding: "2px 6px", borderRadius: 6 }}>
          {el}
        </code>
      );
    }

    if (text.href) {
      el = (
        <a href={text.href} target="_blank" rel="noopener noreferrer">
          {el}
        </a>
      );
    }

    return <span key={i}>{el}</span>;
  });
}

function renderBlocks(blocks: NotionBlock[]) {
  return blocks.map((b) => {
    const v = b[b.type];
    if (!v) return null;

    if (b.type === "heading_1") return <h1 key={b.id}>{renderInlineText(v.rich_text)}</h1>;
    if (b.type === "heading_2") return <h2 key={b.id}>{renderInlineText(v.rich_text)}</h2>;
    if (b.type === "heading_3") return <h3 key={b.id}>{renderInlineText(v.rich_text)}</h3>;

    if (b.type === "paragraph")
      return <p key={b.id}>{renderInlineText(v.rich_text)}</p>;

    if (b.type === "image") {
      const src = v.type === "external" ? v.external.url : v.file.url;
      return <img key={b.id} src={src} style={{ maxWidth: "100%" }} />;
    }

    if (b.type === "bulleted_list_item")
      return <li key={b.id}>{renderInlineText(v.rich_text)}</li>;

    return null;
  });
}

/* =========================
   PAGE
========================= */

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // 🔴 защита от пустого slug
  if (!params.slug) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Invalid article</h1>
        <a href="/">Back to Help Center</a>
      </main>
    );
  }

  const article = await getArticle(params.slug);

  // 🔴 нормальный fallback (без редиректа)
  if (!article) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Article not found</h1>
        <a href="/">Back to Help Center</a>
      </main>
    );
  }

  const blocks = await getBlocksWithChildren(article.id);

  const backHref =
    article.category === "Market Analysis"
      ? "/market-analysis"
      : "/product-guide";

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <a href={backHref}>← Back to {article.category}</a>
      </div>

      <h1>{article.title}</h1>

      {article.shortAnswer && <p>{article.shortAnswer}</p>}

      <div>{renderBlocks(blocks)}</div>
    </main>
  );
}
