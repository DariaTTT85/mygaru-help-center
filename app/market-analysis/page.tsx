type Article = {
  title: string;
  shortAnswer: string;
  slug: string;
  order: number;
};

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
            {
              property: "Status",
              select: {
                equals: "Ready",
              },
            },
            {
              property: "Category",
              select: {
                equals: "Market Analysis",
              },
            },
          ],
        },
        sorts: [
          {
            property: "Order",
            direction: "ascending",
          },
        ],
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) return [];

  return data.results.map((item: any) => ({
    title: item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    shortAnswer:
      item.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: item.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: item.properties?.Order?.number || 999,
  }));
}

export default async function MarketAnalysis() {
  const articles = await getMarketArticles();

  return (
    <main style={{ fontFamily: "Ubuntu, Arial", background: "#f4f3ef", minHeight: "100vh" }}>
      
      <header style={{ padding: "18px 72px", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: "100%",
          maxWidth: 1180,
          background: "rgba(255,255,255,0.94)",
          borderRadius: 999,
          padding: "12px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 14px 38px rgba(0,0,0,0.10)"
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#111" }}>
            <img src="/mygaru-icon.png" style={{ width: 42, height: 42 }} />
            <strong style={{ fontSize: 28 }}>myGaru</strong>
          </a>

          <a href="/" style={{
            background: "#111",
            color: "white",
            padding: "12px 22px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 700
          }}>
            All collections
          </a>
        </div>
      </header>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "44px 24px" }}>

        <div style={{
          borderRadius: 34,
          padding: "38px",
          marginBottom: 34,
          background: "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(255,255,255,0.9))",
          boxShadow: "0 18px 52px rgba(0,0,0,0.08)"
        }}>
          <h1 style={{ fontSize: 48 }}>Market Analysis</h1>
          <p style={{ fontSize: 18, color: "#555" }}>
            Identity solutions, AdTech market shifts, and myGaru positioning.
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: 24,
          padding: "24px",
          border: "1px solid #eee"
        }}>
          {articles.map((article, i) => (
            <a
              key={article.slug}
              href={`/articles/${article.slug}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "20px 0",
                borderTop: i === 0 ? "none" : "1px solid #eee",
                textDecoration: "none",
                color: "#111"
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {article.title}
                </div>
                <div style={{ color: "#666", fontSize: 14 }}>
                  {article.shortAnswer}
                </div>
              </div>

              <span style={{ color: "#44cfbd", fontSize: 28 }}>›</span>
            </a>
          ))}
        </div>

      </section>
    </main>
  );
}
