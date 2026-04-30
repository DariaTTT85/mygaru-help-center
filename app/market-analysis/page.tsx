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

  const articleMap = new Map(articles.map((article) => [article.id, article]));

  const parents = articles
    .filter((article) => article.parentIds.length !== 1)
    .sort((a, b) => a.order - b.order);

  const children = articles
    .filter((article) => article.parentIds.length === 1)
    .sort((a, b) => a.order - b.order);

  const groups = parents.map((parent) => ({
    parent,
    articles: children.filter((child) => child.parentIds.includes(parent.id)),
  }));

  const orphanArticles = children.filter((child) => {
    const parentId = child.parentIds[0];
    return !articleMap.has(parentId);
  });

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
          transition: transform 160ms ease, background 160ms ease;
        }

        .article-row:hover {
          transform: translateX(3px);
          background: #f8f7f3;
        }

        .article-row:hover .article-arrow {
          transform: translateX(4px);
        }

        .article-arrow {
          display: inline-block;
          transition: transform 160ms ease;
        }
      `}</style>

      <div
        style={{
          background:
            "linear-gradient(180deg, #a7eadf 0%, #44cfbd 54%, rgba(68,207,189,0.58) 72%, rgba(244,243,239,0.96) 91%, #f4f3ef 100%)",
          padding: "22px 60px 104px",
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
          <a href="/" style={{ textDecoration: "none" }}>
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
            Market Analysis
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
            Market context, identity strategies, regulatory shifts, and myGaru
            positioning.
          </p>
        </div>
      </div>

      <section
        style={{
          maxWidth: 980,
          margin: "-58px auto 0",
          padding: "0 24px 90px",
        }}
      >
        {groups.length === 0 && orphanArticles.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid #e4e1d8",
              borderRadius: 26,
              padding: "28px 30px",
              boxShadow: "0 14px 34px rgba(0,0,0,0.09)",
              color: "#666",
              fontSize: 16,
            }}
          >
            No articles yet.
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <div
                key={group.parent.id}
                style={{
                  background: "white",
                  border: "1px solid #e4e1d8",
                  borderRadius: 26,
                  overflow: "hidden",
                  boxShadow: "0 14px 34px rgba(0,0,0,0.09)",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(68,207,189,0.20), rgba(255,255,255,0.96))",
                    borderBottom: "1px solid #e4e1d8",
                    padding: "18px 26px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 23,
                      lineHeight: 1.25,
                      margin: 0,
                      letterSpacing: "-0.35px",
                    }}
                  >
                    {group.parent.title}
                  </h2>
                </div>

                <div style={{ padding: "6px 26px" }}>
                  {group.articles.length === 0 ? (
                    <div
                      style={{
                        padding: "16px 0",
                        color: "#777",
                        fontSize: 15,
                      }}
                    >
                      Articles will be added later.
                    </div>
                  ) : (
                    group.articles.map((article, index) => {
                      const isValid = Boolean(article.slug);

                      return (
                        <a
                          key={article.id}
                          href={isValid ? `/articles/${article.slug}` : "#"}
                          className="article-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 24,
                            padding: "14px 0",
                            borderTop:
                              index === 0 ? "none" : "1px solid #eeeeee",
                            textDecoration: "none",
                            color: "#111",
                            pointerEvents: isValid ? "auto" : "none",
                            opacity: isValid ? 1 : 0.5,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 17,
                                fontWeight: 650,
                                lineHeight: 1.35,
                              }}
                            >
                              {article.title}
                            </div>

                            {article.shortAnswer && (
                              <div
                                style={{
                                  color: "#666",
                                  fontSize: 13.5,
                                  lineHeight: 1.45,
                                  marginTop: 4,
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
                              fontSize: 26,
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
            ))}

            {orphanArticles.length > 0 && (
              <div
                style={{
                  background: "white",
                  border: "1px solid #e4e1d8",
                  borderRadius: 26,
                  overflow: "hidden",
                  boxShadow: "0 14px 34px rgba(0,0,0,0.09)",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(68,207,189,0.20), rgba(255,255,255,0.96))",
                    borderBottom: "1px solid #e4e1d8",
                    padding: "18px 26px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 23,
                      lineHeight: 1.25,
                      margin: 0,
                      letterSpacing: "-0.35px",
                    }}
                  >
                    Other articles
                  </h2>
                </div>

                <div style={{ padding: "6px 26px" }}>
                  {orphanArticles.map((article, index) => {
                    const isValid = Boolean(article.slug);

                    return (
                      <a
                        key={article.id}
                        href={isValid ? `/articles/${article.slug}` : "#"}
                        className="article-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 24,
                          padding: "14px 0",
                          borderTop: index === 0 ? "none" : "1px solid #eee",
                          textDecoration: "none",
                          color: "#111",
                          pointerEvents: isValid ? "auto" : "none",
                          opacity: isValid ? 1 : 0.5,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 650,
                              lineHeight: 1.35,
                            }}
                          >
                            {article.title}
                          </div>

                          {article.shortAnswer && (
                            <div
                              style={{
                                color: "#666",
                                fontSize: 13.5,
                                lineHeight: 1.45,
                                marginTop: 4,
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
                            fontSize: 26,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          ›
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
