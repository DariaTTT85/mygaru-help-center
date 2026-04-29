type Article = {
  title: string;
  category: string;
};

const categoryMeta: Record<
  string,
  {
    label: string;
    href: string;
    description: string;
    iconType: "logo" | "star" | "gear" | "document";
    accent: string;
    background: string;
  }
> = {
  "Product Guide": {
    label: "Product Guide",
    href: "/product-guide",
    description:
      "Platform functionality, UX/UI logic, identity, billing, DSP, and product cases.",
    iconType: "logo",
    accent: "#44cfbd",
    background:
      "linear-gradient(135deg, rgba(68,207,189,0.16), rgba(255,255,255,0.98) 58%, rgba(68,207,189,0.06))",
  },
  "Market Analysis": {
    label: "Market Analysis",
    href: "/market-analysis",
    description:
      "Market context, identity strategies, regulatory shifts, and myGaru positioning.",
    iconType: "star",
    accent: "#44cfbd",
    background:
      "linear-gradient(135deg, rgba(17,17,17,0.04), rgba(255,255,255,0.98) 55%, rgba(92,70,180,0.10))",
  },
  "Integrations Guide": {
    label: "Integrations Guide",
    href: "/integrations-guide",
    description:
      "Platform deployment, integrations, and technical setup across partner environments.",
    iconType: "gear",
    accent: "#44cfbd",
    background:
      "linear-gradient(135deg, rgba(92,70,180,0.10), rgba(255,255,255,0.98) 58%, rgba(68,207,189,0.08))",
  },
  "Legal documents": {
    label: "Legal Documents",
    href: "/legal-documents",
    description:
      "Legal framework, compliance, and data protection documentation for platform usage.",
    iconType: "document",
    accent: "#44cfbd",
    background:
      "linear-gradient(135deg, rgba(255,255,255,1), rgba(247,246,242,0.95) 58%, rgba(68,207,189,0.07))",
  },
};

async function getArticles(): Promise<Article[]> {
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
          property: "Status",
          select: {
            equals: "Ready",
          },
        },
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) return [];

  return data.results.map((item: any) => ({
    title: item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: item.properties?.Category?.select?.name || "Uncategorised",
  }));
}

export default async function HomePage() {
  const articles = await getArticles();

  const groupedArticles = articles.reduce<Record<string, Article[]>>(
    (acc, article) => {
      if (!acc[article.category]) acc[article.category] = [];
      acc[article.category].push(article);
      return acc;
    },
    {}
  );

  const categories = Object.keys(categoryMeta);

  return (
    <main
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background:
          "radial-gradient(circle at top left, rgba(68,207,189,0.12), transparent 34%), radial-gradient(circle at top right, rgba(92,70,180,0.10), transparent 32%), #f4f3ef",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      <style>{`
        .home-card {
          transform: translateY(0);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .home-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 22px 46px rgba(0,0,0,0.11);
          border-color: rgba(68,207,189,0.42);
        }

        .home-card:hover .card-arrow {
          transform: translateX(4px);
        }

        .card-arrow {
          display: inline-block;
          transition: transform 180ms ease;
        }

        .welcome-panel {
          animation: fadeUp 420ms ease both;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
            backdropFilter: "blur(10px)",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              textDecoration: "none",
              color: "#111",
            }}
          >
            <img
              src="/mygaru-icon.png"
              alt="myGaru"
              style={{ width: 42, height: 42 }}
            />
            <strong style={{ fontSize: 28 }}>myGaru</strong>
          </a>

          <a
            href="https://mygaru.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "13px 24px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            myGaru website
          </a>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "42px 24px 80px",
        }}
      >
        <div
          className="welcome-panel"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82) 55%, rgba(68,207,189,0.10))",
            border: "1px solid #e4e1d8",
            borderRadius: 24,
            padding: "22px 26px",
            marginBottom: 28,
            boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 6,
              letterSpacing: "-0.2px",
            }}
          >
            Welcome to the myGaru Help Center
          </div>

          <div
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.55,
              maxWidth: 760,
            }}
          >
            Find product documentation, market analysis, integration guidance,
            and legal materials in one internal knowledge space.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {categories.map((category) => {
            const meta = categoryMeta[category];
            const count = groupedArticles[category]?.length || 0;

            return (
              <a
                key={category}
                href={meta.href}
                className="home-card"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "#111",
                  background: meta.background,
                  border: "1px solid #e4e1d8",
                  borderRadius: 28,
                  padding: 34,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                  display: "block",
                  minHeight: 250,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: -42,
                    top: -42,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    background: "rgba(68,207,189,0.10)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background:
                      meta.iconType === "logo"
                        ? "#44cfbd"
                        : meta.iconType === "star"
                        ? "#111"
                        : "#f1f0ec",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
                  }}
                >
                  {meta.iconType === "logo" ? (
                    <img
                      src="/mygaru-icon.png"
                      alt=""
                      style={{ width: 34, height: 34 }}
                    />
                  ) : meta.iconType === "star" ? (
                    <span style={{ color: "#44cfbd", fontSize: 27 }}>✦</span>
                  ) : meta.iconType === "gear" ? (
                    <span style={{ fontSize: 26 }}>⚙️</span>
                  ) : (
                    <span style={{ fontSize: 25 }}>📄</span>
                  )}
                </div>

                <h2
                  style={{
                    position: "relative",
                    fontSize: 29,
                    lineHeight: 1.15,
                    margin: "0 0 12px",
                    letterSpacing: "-0.45px",
                  }}
                >
                  {meta.label}
                </h2>

                <p
                  style={{
                    position: "relative",
                    color: "#4f4f4f",
                    fontSize: 16,
                    lineHeight: 1.55,
                    margin: "0 0 26px",
                    maxWidth: 520,
                  }}
                >
                  {meta.description}
                </p>

                <p
                  style={{
                    position: "relative",
                    color: "#168f82",
                    fontWeight: 700,
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  {count} {count === 1 ? "document" : "documents"}{" "}
                  <span className="card-arrow">→</span>
                </p>
              </a>
            );
          })}
        </div>

        <div
          style={{
            maxWidth: 460,
            margin: "36px auto 0",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #e4e1d8",
            borderRadius: 18,
            padding: "12px 17px",
            color: "#777",
            fontSize: 14,
            boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
            backdropFilter: "blur(8px)",
          }}
        >
          🔍 Search will be added later
        </div>
      </section>
    </main>
  );
}
