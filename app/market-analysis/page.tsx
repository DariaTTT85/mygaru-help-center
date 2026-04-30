type Article = {
  id: string;
  title: string;
  shortAnswer: string;
  slug: string;
  order: number;
  parentIds: string[];
};

const LOGO_SRC = "/myGaru_logo_black.png";

async function getMarketArticles(): Promise<Article[]> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) return [];

  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Status", select: { equals: "Ready" } },
            { property: "Category", select: { equals: "Market Analysis" } },
          ],
        },
        sorts: [{ property: "Order", direction: "ascending" }],
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();
  if (!response.ok) return [];

  return data.results.map((item: any) => ({
    id: item.id,
    title: item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    shortAnswer:
      item.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: item.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: item.properties?.Order?.number || 999,
    parentIds:
      item.properties?.["Parent article"]?.relation?.map((r: any) => r.id) || [],
  }));
}

export default async function MarketAnalysis() {
  const articles = await getMarketArticles();

  const parents = articles.filter((a) => a.parentIds.length !== 1);
  const children = articles.filter((a) => a.parentIds.length === 1);

  const groups = parents.map((parent) => ({
    parent,
    articles: children.filter((c) => c.parentIds.includes(parent.id)),
  }));

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
        .article-row {
          transition: all 140ms ease;
        }

        .article-row:hover {
          transform: translateX(3px);
          background: #f8f7f3;
        }

        .article-arrow {
          transition: transform 140ms ease;
        }

        .article-row:hover .article-arrow {
          transform: translateX(4px);
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 60%, rgba(244,243,239,1) 100%)",
          padding: "22px 60px 96px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 42,
          }}
        >
          <a href="/">
            <img src={LOGO_SRC} style={{ height: 42 }} />
          </a>

          <a
            href="/"
            style={{
              background: "#111",
              color: "white",
              padding: "12px 22px",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Help Center Home
          </a>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ fontSize: 54, marginBottom: 12 }}>
            Market Analysis
          </h1>

          <p style={{ fontSize: 18, maxWidth: 720 }}>
            Market context, identity strategies, and myGaru positioning.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <section
        style={{
          maxWidth: 980,
          margin: "-52px auto 0",
          padding: "0 24px 80px",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.parent.id}
            style={{
              background: "white",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              marginBottom: 14,
            }}
          >
            {/* 🔥 НОВАЯ ПЛАШКА */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #f5f5f2 0%, #ffffff 50%, #f0efea 100%)",
                padding: "14px 22px",
                borderBottom: "1px solid #e4e1d8",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1fbfa9", // фирменный
                }}
              >
                {group.parent.title}
              </h2>
            </div>

            {/* ARTICLES */}
            <div style={{ padding: "4px 20px" }}>
              {group.articles.map((article, index) => (
                <a
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="article-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderTop: index === 0 ? "none" : "1px solid #eee",
                    textDecoration: "none",
                    color: "#111",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                      }}
                    >
                      {article.title}
                    </div>

                    {article.shortAnswer && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#666",
                          marginTop: 3,
                        }}
                      >
                        {article.shortAnswer}
                      </div>
                    )}
                  </div>

                  <span
                    className="article-arrow"
                    style={{
                      color: "#168f82",
                      fontSize: 22,
                    }}
                  >
                    ›
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
