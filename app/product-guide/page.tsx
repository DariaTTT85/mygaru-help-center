type Article = {
  title: string;
  shortAnswer: string;
  slug: string;
  order: number;
};

async function getProductGuideArticles(): Promise<Article[]> {
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
                equals: "Product Guide",
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

export default async function ProductGuide() {
  const articles = await getProductGuideArticles();

  return (
    <main
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: "#f4f3ef",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      <header
        style={{
          padding: "18px 72px",
          display: "flex",
          justifyContent: "center",
        }}
      >
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
            All collections
          </a>
        </div>
      </header>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "44px 24px 80px" }}>
        <div
          style={{
            borderRadius: 34,
            padding: "38px 42px",
            marginBottom: 34,
            background:
              "linear-gradient(135deg, rgba(68,207,189,0.22), rgba(255,255,255,0.94) 48%, rgba(90,65,165,0.13))",
            boxShadow: "0 18px 52px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              background: "#44cfbd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 22,
            }}
          >
            <img src="/mygaru-icon.png" alt="" style={{ width: 46, height: 46 }} />
          </div>

          <p
            style={{
              color: "#168f82",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            Collection
          </p>

          <h1 style={{ fontSize: 48, margin: "0 0 14px", letterSpacing: "-1px" }}>
            Product Guide
          </h1>

          <p style={{ color: "#555", fontSize: 19, lineHeight: 1.6, maxWidth: 720 }}>
            Start here to understand the myGaru platform, its core components,
            and the logic behind telecom-powered identity.
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 30,
            padding: "12px 36px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.07)",
          }}
        >
          <h2 style={{ fontSize: 26, margin: "26px 0 10px" }}>
            Get started with myGaru
          </h2>

          {articles.map((article, index) => (
            <a
              key={article.slug}
              href={`/articles/${article.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 30,
                padding: "26px 0",
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
