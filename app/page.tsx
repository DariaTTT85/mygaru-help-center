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
    iconType: "logo" | "star" | "nodes" | "document";
  }
> = {
  "Product Guide": {
    label: "Product Guide",
    href: "/product-guide",
    description:
      "Platform functionality, UX/UI logic, identity, billing, DSP, and product cases.",
    iconType: "logo",
  },
  "Market Analysis": {
    label: "Market Analysis",
    href: "/market-analysis",
    description:
      "Market context, identity strategies, regulatory shifts, and myGaru positioning.",
    iconType: "star",
  },
  "Integrations Guide": {
    label: "Integrations Guide",
    href: "/integrations-guide",
    description:
      "Deployment, integrations, and technical setup across partner environments.",
    iconType: "nodes",
  },
  "Legal Documents": {
    label: "Legal Documents",
    href: "/legal-documents",
    description:
      "Legal framework, compliance, and data protection documentation.",
    iconType: "document",
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
          select: { equals: "Ready" },
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

function CardIcon({ type }: { type: "logo" | "star" | "nodes" | "document" }) {
  if (type === "logo") {
    return <img src="/mygaru-icon.png" alt="" style={{ width: 31, height: 31 }} />;
  }

  if (type === "star") {
    return <span style={{ color: "#44cfbd", fontSize: 26, lineHeight: 1 }}>✦</span>;
  }

  if (type === "nodes") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="8" cy="9" r="4" fill="#44cfbd" />
        <circle cx="24" cy="9" r="4" fill="#44cfbd" />
        <circle cx="16" cy="23" r="4" fill="#44cfbd" />
        <path
          d="M11.5 10.5H20.5M10.5 12.5L14.2 19.2M21.5 12.5L17.8 19.2"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <path
        d="M8 4H18L23 9V26H8V4Z"
        fill="#44cfbd"
        stroke="#111"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M18 4V10H23" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 15H19.5M11.5 19H19.5M11.5 23H16.5" stroke="#111" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function HomePage() {
  const articles = await getArticles();

  const groupedArticles = articles.reduce<Record<string, Article[]>>((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {});

  const categories = Object.keys(categoryMeta);

  return (
    <main
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background:
          "linear-gradient(180deg, #bff3ea 0%, #44cfbd 34%, #f4f3ef 34%, #f4f3ef 100%)",
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
          transform: translateY(-4px);
          box-shadow: 0 20px 42px rgba(0,0,0,0.13);
          border-color: rgba(68,207,189,0.7);
        }

        .home-card:hover .card-arrow {
          transform: translateX(4px);
        }

        .card-arrow {
          display: inline-block;
          transition: transform 180ms ease;
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
            boxShadow: "0 14px 38px rgba(0,0,0,0.12)",
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
            <img src="/mygaru-icon.png" alt="myGaru" style={{ width: 42, height: 42 }} />
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
          maxWidth: 1120,
          margin: "0 auto",
          padding: "26px 24px 56px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            margin: "8px auto 28px",
            maxWidth: 760,
          }}
        >
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1,
              margin: "0 0 14px",
              letterSpacing: "-1.7px",
            }}
          >
            myGaru Help Center
          </h1>

          <p
            style={{
              color: "#202020",
              fontSize: 17,
              lineHeight: 1.45,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Product documentation, market analysis, integration guidance, and legal materials in one knowledge space.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 18,
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
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(228,225,216,0.95)",
                  borderRadius: 24,
                  padding: "24px 22px",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.09)",
                  minHeight: 245,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: -36,
                    top: -36,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "rgba(68,207,189,0.13)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    width: 54,
                    height: 54,
                    borderRadius: 17,
                    background:
                      meta.iconType === "star" ? "#111" : "#44cfbd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 22,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.10)",
                  }}
                >
                  <CardIcon type={meta.iconType} />
                </div>

                <h2
                  style={{
                    position: "relative",
                    fontSize: 25,
                    lineHeight: 1.12,
                    margin: "0 0 12px",
                    letterSpacing: "-0.4px",
                  }}
                >
                  {meta.label}
                </h2>

                <p
                  style={{
                    position: "relative",
                    color: "#555",
                    fontSize: 14.5,
                    lineHeight: 1.48,
                    margin: "0 0 20px",
                    flex: 1,
                  }}
                >
                  {meta.description}
                </p>

                <p
                  style={{
                    position: "relative",
                    color: "#168f82",
                    fontWeight: 700,
                    fontSize: 15,
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
            margin: "30px auto 0",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #e4e1d8",
            borderRadius: 18,
            padding: "12px 17px",
            color: "#777",
            fontSize: 14,
            boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
          }}
        >
          🔍 Search will be added later
        </div>
      </section>
    </main>
  );
}
