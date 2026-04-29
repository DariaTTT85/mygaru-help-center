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
    return <img src="/mygaru-icon.png" style={{ width: 30 }} />;
  }

  if (type === "star") {
    return <span style={{ color: "#44cfbd", fontSize: 24 }}>✦</span>;
  }

  if (type === "nodes") {
    return (
      <svg width="30" height="30" viewBox="0 0 32 32">
        <circle cx="8" cy="9" r="4" fill="#44cfbd" />
        <circle cx="24" cy="9" r="4" fill="#44cfbd" />
        <circle cx="16" cy="23" r="4" fill="#44cfbd" />
        <path
          d="M11.5 10.5H20.5M10.5 12.5L14.2 19.2M21.5 12.5L17.8 19.2"
          stroke="#111"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 30 30">
      <path
        d="M8 4H18L23 9V26H8V4Z"
        fill="#44cfbd"
        stroke="#111"
        strokeWidth="2"
      />
      <path d="M18 4V10H23" stroke="#111" strokeWidth="2" />
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
        background: "#f4f3ef",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      <style>{`
        .home-card {
          transition: all 0.18s ease;
        }

        .home-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
      `}</style>

      {/* 🔥 ГРАДИЕНТНЫЙ ХЕДЕР */}
      <div
        style={{
          background:
            "linear-gradient(180deg, #9de3d7 0%, #44cfbd 60%, #f4f3ef 60%)",
          paddingBottom: 40,
        }}
      >
        <header
          style={{
            padding: "20px 60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/mygaru-icon.png" style={{ width: 40 }} />
            <strong style={{ fontSize: 26 }}>myGaru</strong>
          </div>

          <a
            href="https://mygaru.com"
            target="_blank"
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

        {/* 🔥 НОВЫЙ ЗАГОЛОВОК */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <h1
            style={{
              fontSize: 48,
              margin: "0 0 10px",
              letterSpacing: "-1px",
            }}
          >
            Product Documentation
          </h1>

          <p style={{ fontSize: 18, maxWidth: 700, margin: "0 auto" }}>
            Product documentation, market analysis, integration guidance, and legal materials in one knowledge space.
          </p>
        </div>
      </div>

      {/* 🔥 КАРТОЧКИ */}
      <section style={{ maxWidth: 1100, margin: "0 auto", marginTop: -30 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
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
                  background: "white",
                  borderRadius: 24,
                  padding: 24,
                  border: "1px solid #e4e1d8",
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background:
                      meta.iconType === "star" ? "#111" : "#44cfbd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <CardIcon type={meta.iconType} />
                </div>

                <h2 style={{ fontSize: 22 }}>{meta.label}</h2>

                <p style={{ color: "#555", fontSize: 14 }}>
                  {meta.description}
                </p>

                <p style={{ color: "#168f82", fontWeight: 700 }}>
                  {count} documents →
                </p>
              </a>
            );
          })}
        </div>

        <div
          style={{
            margin: "30px auto",
            maxWidth: 400,
            textAlign: "center",
            background: "white",
            padding: 12,
            borderRadius: 16,
            border: "1px solid #e4e1d8",
          }}
        >
          🔍 Search will be added later
        </div>
      </section>
    </main>
  );
}
