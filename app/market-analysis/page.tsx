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
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, color: "#111", textDecoration: "none" }}>
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

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px 80px" }}>
        <div
          style={{
            borderRadius: 28,
            padding: "28px 34px",
            marginBottom: 28,
            background:
              "linear-gradient(135deg, rgba(68,207,189,0.14), rgba(255,255,255,0.96) 52%, rgba(92,70,180,0.10))",
            border: "1px solid #e4e1d8",
            boxShadow: "0 12px 34px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#44cfbd", fontSize: 28 }}>✦</span>
            </div>

            <div>
              <h1 style={{ fontSize: 38, margin: "0 0 8px", letterSpacing: "-0.7px" }}>
                Market Analysis
              </h1>

              <p style={{ color: "#555", fontSize: 17, lineHeight: 1.5, maxWidth: 720, margin: 0 }}>
                Market context, identity strategies, regulatory shifts, and myGaru positioning.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 28,
            padding: "10px 34px",
            boxShadow: "0 14px 42px rgba(0,0,0,0.07)",
          }}
        >
          {articles.map((article, index) => (
            <a
              key={article.slug}
              href={`/articles/${article.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 30,
                padding: "24px 0",
                borderTop: index === 0 ? "none" : "1px solid #eee",
                textDecoration: "none",
                color: "#111",
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  {article.title}
                </div>
                <div style={{ color: "#666", fontSize: 15, lineHeight: 1.5 }}>
                  {article.shortAnswer}
                </div>
              </div>

              <span style={{ color: "#44cfbd", fontSize: 34, lineHeight: 1 }}>›</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
