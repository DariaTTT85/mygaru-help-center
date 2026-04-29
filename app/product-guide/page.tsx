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
            { property: "Status", select: { equals: "Ready" } },
            { property: "Category", select: { equals: "Product Guide" } },
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
      <style>{`
        .doc-row {
          transition: transform 180ms ease, background 180ms ease;
        }

        .doc-row:hover {
          transform: translateX(4px);
          background: #f8f7f3;
        }

        .doc-row:hover .doc-arrow {
          transform: translateX(5px);
        }

        .doc-arrow {
          display: inline-block;
          transition: transform 180ms ease;
        }
      `}</style>

      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 56%, rgba(68,207,189,0.58) 72%, rgba(244,243,239,0.96) 91%, #f4f3ef 100%)",
          padding: "22px 60px 112px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 46,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              color: "#111",
            }}
          >
            <img src="/mygaru-icon.png" alt="myGaru" style={{ width: 40, height: 40 }} />
            <strong style={{ fontSize: 26 }}>myGaru</strong>
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
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.05,
              margin: "0 0 16px",
              letterSpacing: "-1.4px",
            }}
          >
            Product Guide
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.45,
              maxWidth: 760,
              margin: 0,
              color: "#111",
              fontWeight: 500,
            }}
          >
            Start here to understand the myGaru platform, its core components, and telecom-based identity logic.
          </p>
        </div>
      </div>

      <section
        style={{
          maxWidth: 980,
          margin: "-64px auto 0",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 30,
            padding: "10px 34px",
            boxShadow: "0 16px 42px rgba(0,0,0,0.10)",
          }}
        >
          {articles.map((article, index) => {
            const isValid = Boolean(article.slug);

            return (
              <a
                key={article.slug || index}
                href={isValid ? `/articles/${article.slug}` : "#"}
                className="doc-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 30,
                  padding: "26px 0",
                  borderTop: index === 0 ? "none" : "1px solid #eee",
                  textDecoration: "none",
                  color: "#111",
                  pointerEvents: isValid ? "auto" : "none",
                  opacity: isValid ? 1 : 0.5,
                  borderRadius: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 8 }}>
                    {article.title}
                  </div>

                  {article.shortAnswer && (
                    <div style={{ color: "#666", fontSize: 15, lineHeight: 1.5 }}>
                      {article.shortAnswer}
                    </div>
                  )}
                </div>

                <span
                  className="doc-arrow"
                  style={{ color: "#44cfbd", fontSize: 34, lineHeight: 1 }}
                >
                  ›
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
