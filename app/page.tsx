type Article = {
  title: string;
  category: string;
  shortAnswer: string;
  slug: string;
  order: number;
};

const categoryMeta: Record<
  string,
  {
    href: string;
    description: string;
    iconType: "logo" | "star";
  }
> = {
  "Product Guide": {
    href: "/product-guide",
    description: "Core concepts, platform modules, and telecom-powered identity logic.",
    iconType: "logo",
  },
  "Market Analysis": {
    href: "/market-analysis",
    description: "Identity solutions, AdTech market shifts, and myGaru positioning.",
    iconType: "star",
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
          status: {
            equals: "Ready",
          },
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

  if (!response.ok) {
    console.error("Notion API error:", data);
    return [];
  }

  return data.results.map((item: any) => ({
    title: item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: item.properties?.Category?.select?.name || "Uncategorised",
    shortAnswer:
      item.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    slug: item.properties?.Slug?.rich_text?.[0]?.plain_text || "",
    order: item.properties?.Order?.number || 999,
  }));
}

export default async function Home() {
  const articles = await getArticles();

  const groupedArticles = articles.reduce<Record<string, Article[]>>(
    (acc, article) => {
      if (!acc[article.category]) acc[article.category] = [];
      acc[article.category].push(article);
      return acc;
    },
    {}
  );

  const categories = Object.keys(categoryMeta).filter(
    (category) => groupedArticles[category]?.length
  );

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
            <img
              src="/mygaru-icon.png"
              alt="myGaru"
              style={{ width: 42, height: 42 }}
            />
            <strong style={{ fontSize: 28 }}>myGaru</strong>
          </a>

          <a
            href="https://mygaru.com/"
            style={{
              background: "#111",
              color: "white",
              textDecoration: "none",
              padding: "13px 24px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            Back to myGaru
          </a>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "28px 32px 34px",
        }}
      >
        <div
          style={{
            borderRadius: 34,
            padding: "34px 46px",
            background:
              "linear-gradient(135deg, rgba(68,207,189,0.16), rgba(255,255,255,0.94) 45%, rgba(92,70,180,0.14))",
            boxShadow: "0 16px 44px rgba(0,0,0,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -70,
              top: -90,
              width: 250,
              height: 250,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(68,207,189,0.42), transparent 65%)",
              filter: "blur(10px)",
            }}
          />

          <div style={{ position: "relative", maxWidth: 820 }}>
            <p
              style={{
                color: "#168f82",
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontSize: 13,
                margin: "0 0 12px",
              }}
            >
              myGaru Knowledge Base
            </p>

            <h1
              style={{
                fontSize: 42,
                lineHeight: 1.08,
                margin: "0 0 16px",
                letterSpacing: "-1px",
              }}
            >
              Search for answers or browse by topic
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.5,
                color: "#555",
                maxWidth: 720,
                margin: "0 0 24px",
              }}
            >
              Practical guidance on the myGaru platform, telecom-powered identity,
              data collaboration, and audience activation.
            </p>

            <div
              style={{
                maxWidth: 640,
                background: "white",
                border: "1px solid #dedbd2",
                borderRadius: 18,
                padding: "16px 22px",
                fontSize: 18,
                color: "#777",
                boxShadow: "0 12px 30px rgba(0,0,0,0.07)",
              }}
            >
              🔍 Search for articles...
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 32px 70px",
        }}
      >
        <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Browse by topic</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
            gap: 28,
          }}
        >
          {categories.map((category) => {
            const meta = categoryMeta[category];
            const count = groupedArticles[category]?.length || 0;

            return (
              <a
                key={category}
                href={meta.href}
                style={{
                  display: "block",
                  minHeight: 215,
                  padding: 32,
                  borderRadius: 30,
                  background:
                    meta.iconType === "star"
                      ? "linear-gradient(135deg, rgba(68,207,189,0.14), rgba(255,255,255,1) 45%, rgba(92,70,180,0.16))"
                      : "white",
                  border: "1px solid #e4e1d8",
                  textDecoration: "none",
                  color: "#111",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.07)",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 20,
                    background: meta.iconType === "logo" ? "#44cfbd" : "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 26,
                  }}
                >
                  {meta.iconType === "logo" ? (
                    <img
                      src="/mygaru-icon.png"
                      alt=""
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <span style={{ color: "#44cfbd", fontSize: 30 }}>✦</span>
                  )}
                </div>

                <h3 style={{ fontSize: 27, margin: "0 0 12px" }}>
                  {category}
                </h3>

                <p
                  style={{
                    color: "#666",
                    fontSize: 17,
                    lineHeight: 1.5,
                    marginBottom: 26,
                  }}
                >
                  {meta.description}
                </p>

                <p style={{ color: "#168f82", fontWeight: 700, fontSize: 17 }}>
                  {count} {count === 1 ? "article" : "articles"} →
                </p>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
