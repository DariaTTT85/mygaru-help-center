// lib/notion.ts
// Единый слой работы с Notion для всего сайта.
// Все страницы импортируют функции отсюда, а не пишут свои fetch.

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = "2022-06-28";

// Как часто перечитывать контент из Notion (в секундах).
// 300 = раз в 5 минут. Заменяет прежний cache: "no-store",
// который бил в Notion на каждый заход пользователя.
const REVALIDATE_SECONDS = 300;

// Один тип статьи на весь проект (раньше он дублировался в каждом файле).
export type Article = {
  id: string;
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
  order: number;
  parentIds: string[];
};

// Блоки Notion бывают очень разной формы, поэтому оставляем any.
export type NotionBlock = any;

// Отличаем "контента нет" от "запрос упал":
// null -> сбой Notion / нет токена (ошибка)
// []   -> запрос прошёл, но статей нет (реально пусто)
export type NotionResult<T> = T | null;

/** Низкоуровневый запрос к Notion с общими заголовками и кэшированием. */
async function notionFetch(
  path: string,
  options: RequestInit = {}
): Promise<any | null> {
  if (!NOTION_TOKEN) return null;

  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(options.headers || {}),
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) return null;
  return response.json();
}

// Accept the capitalization used in the user's Notion category names.
function canonicalCategory(name: string): string {
  const categories = ["Product Guide", "Market Analysis", "Integrations Guide", "Legal Documents"];
  return categories.find(category => category.toLowerCase() === name.trim().toLowerCase()) || name;
}

/** Превращает "сырую" страницу Notion в наш тип Article. */
function mapArticle(page: any): Article {
  return {
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: canonicalCategory(page.properties?.Category?.select?.name || ""),
    shortAnswer:
      page.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: page.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: page.properties?.Order?.number || 999,
    parentIds:
      page.properties?.["Parent article"]?.relation?.map((r: any) => r.id) ||
      [],
  };
}

/**
 * Список статей со статусом "Ready".
 * Можно ограничить категорией: getArticles({ category: "Product Guide" }).
 * null при сбое Notion, [] если статей действительно нет.
 */
export async function getArticles(
  opts: { category?: string } = {}
): Promise<NotionResult<Article[]>> {
  if (!DATABASE_ID) return null;

  // Every category and the home count share the same Notion request/cache entry.
  // Normalize names before filtering so casing and trailing spaces cannot hide records.
  const articles: Article[] = [];
  let cursor: string | undefined;
  do {
    const data = await notionFetch(`databases/${DATABASE_ID}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "Status", select: { equals: "Ready" } },
        sorts: [{ property: "Order", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });
    if (!data || !Array.isArray(data.results)) {
      throw new Error("Unable to load the document list from Notion");
    }
    articles.push(...data.results.map(mapArticle));
    cursor = data.has_more ? data.next_cursor : undefined;
    if (data.has_more && !cursor) throw new Error("Incomplete Notion document list");
  } while (cursor);
  return opts.category
    ? articles.filter(article => article.category === canonicalCategory(opts.category!))
    : articles;
}

/** Одна статья по slug. null -> не найдена или сбой. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!DATABASE_ID) return null;

  const decodedSlug = decodeURIComponent(slug || "").trim();
  if (!decodedSlug) return null;

  const data = await notionFetch(`databases/${DATABASE_ID}/query`, {
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
  });

  if (!data?.results?.length) return null;
  return mapArticle(data.results[0]);
}

/** Все дочерние блоки одного блока/страницы (с учётом пагинации Notion). */
export async function getChildBlocks(blockId: string): Promise<NotionBlock[]> {
  let blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const path = cursor
      ? `blocks/${blockId}/children?page_size=100&start_cursor=${cursor}`
      : `blocks/${blockId}/children?page_size=100`;

    const data = await notionFetch(path);
    if (!data) throw new Error("Unable to load document content from Notion");

    blocks = [...blocks, ...(data.results || [])];
    hasMore = data.has_more || false;
    cursor = data.next_cursor || undefined;
  }

  return blocks;
}

/** Все блоки страницы вместе с вложенными детьми (рекурсивно). */
export async function getBlocksWithChildren(
  pageId: string
): Promise<NotionBlock[]> {
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

/** Expand only the selected section; cap concurrent child requests. */
export async function expandBlocks(blocks: NotionBlock[]): Promise<NotionBlock[]> {
  const result: NotionBlock[] = [];
  for (const block of blocks) {
    result.push(block.has_children
      ? { ...block, children: await expandBlocks(await getChildBlocks(block.id)) }
      : block);
  }
  return result;
}
