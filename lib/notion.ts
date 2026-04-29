import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export async function getArticles(category?: string) {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        {
          property: "Status",
          select: {
            equals: "Ready",
          },
        },
        ...(category
          ? [
              {
                property: "Category",
                select: {
                  equals: category,
                },
              },
            ]
          : []),
      ],
    },
    sorts: [
      {
        property: "Order",
        direction: "ascending",
      },
    ],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties.Title.title[0]?.plain_text || "",
    slug: page.properties.Slug.rich_text[0]?.plain_text || "",
    shortAnswer:
      page.properties["Short answer"].rich_text[0]?.plain_text || "",

    content: page.properties.Content.rich_text
      .map((t: any) => t.plain_text)
      .join("\n"),
  }));
}

export async function getArticleBySlug(slug: string) {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug);
}
