type Article = {
  title: string;
  shortAnswer: string;
  slug: string;
  order: number;
};

const LOGO_SRC = "/myGaru_logo_black.png";

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
        .article-row {
          transition: background 150ms ease, color 150ms ease, transform 150ms ease;
        }

        .article-row:hover {
          background: rgba(68, 207, 189, 0.10);
          transform: translateX(2px);
        }

        .article-row:hover .article-title {
          color: #008f82;
        }

        .article-row:hover .article-arrow {
          transform: translateX(4px);
        }

        .article-arrow {
          display: inline-block;
          transition: transform 150ms ease;
        }

        .top-link {
          transition: opacity 150ms ease, transform 150ms ease;
        }

        .top-link:hover {
          opacity: 0.75;
          transform: translateY(-1px);
        }
      `}</style>

      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 50%, rgba(68,207,189,0.54) 70%, rgba(244,243,239,0.96) 92%, #f4f3ef 100%)",
          padding: "22px 60px 96px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <a href="/" className="top-link" style={{ textDecoration: "none" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a
              href="/"
              style={{
                color: "#111",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Help Center Home
            </a>

            <a
              href="https://mygaru.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#111",
                color: "white",
                padding: "12px 22px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              myGaru website
            </a>
          </div>
        </header>

        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 18,
              opacity: 0.76,
            }}
          >
            <a href="/" style={{ color: "#111", textDecoration: "none" }}>
              Home
            </a>{" "}
            › Product Guide
          </div>

          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.05,
              margin: "0 0 14px",
              letterSpacing: "-1.4px",
            }}
          >
            Product Guide
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.45,
              maxWidth: 700,
              margin: 0,
              color: "#111",
              fontWeight: 500,
            }}
          >
            Start here to understand the myGaru platform, its core components,
            and telecom-based identity logic.
          </p>
        </div>
      </div>

      <section
        style={{
          maxWidth: 860,
          margin: "-48px auto 0",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #dedbd2",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, #eef7f4 0%, #f8f7f3 55%, #ecebe5 100%)",
              borderBottom: "1px solid #dedbd2",
              padding: "18px 24px",
            }}
          >
            <h2
              style={{
                fontSize: 23,
                lineHeight: 1.25,
                margin: 0,
                letterSpacing: "-0.3px",
                fontWeight: 600,
                color: "#087f75",
              }}
            >
              Product Guide documents
            </h2>
          </div>

          <div style={{ padding: "6px 18px 8px" }}>
            {articles.length === 0 ? (
              <div
                style={{
                  padding: "14px 8px",
                  color: "#777",
                  fontSize: 15,
                }}
              >
                No documents yet.
              </div>
            ) : (
              articles.map((article, index) => {
                const isValid = Boolean(article.slug);

                return (
                  <a
                    key={article.slug || index}
                    href={isValid ? `/articles/${article.slug}` : "#"}
                    className="article-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 20,
                      padding: "12px 14px",
                      borderTop: index === 0 ? "none" : "1px solid #eeeeee",
                      textDecoration: "none",
                      color: "#252525",
                      pointerEvents: isValid ? "auto" : "none",
                      opacity: isValid ? 1 : 0.5,
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div
                        className="article-title"
                        style={{
                          fontSize: 18,
                          fontWeight: 400,
                          lineHeight: 1.35,
                          letterSpacing: "-0.1px",
                        }}
                      >
                        {article.title}
                      </div>

                      {article.shortAnswer && (
                        <div
                          style={{
                            color: "#6a6a6a",
                            fontSize: 13.5,
                            lineHeight: 1.4,
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
                        color: "#008f82",
                        fontSize: 24,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ›
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
