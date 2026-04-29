type Article = {
  title: string;
  category: string;
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
    description:
      "Platform functionality, UX/UI logic, identity, billing, DSP, and product cases.",
    iconType: "logo",
  },
  "Market Analysis": {
    href: "/market-analysis",
    description:
      "Market context, identity strategies, regulatory shifts, and myGaru positioning.",
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
    title:
      item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category:
      item.properties?.Category?.select?.name ||
      "Uncategorised",
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
          maxWidth: 980,
          margin: "0 auto",
          padding: "42px 24px 80px",
        }}
      >
        {/* ✅ Welcome banner */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e4e1d8",
            borderRadius: 18,
            padding: "18px 22px",
            marginBottom: 28,
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Welcome to the myGaru Help Center
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#666",
            }}
          >
            Find product documentation, market analysis, and platform guidance in one place.
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
                style={{
                  textDecoration: "none",
                  color: "#111",
                  background: "white",
                  border: "1px solid #e4e1d8",
                  borderRadius: 24,
                  padding: 32,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                  display: "block",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background:
                      meta.iconType === "logo"
                        ? "#44cfbd"
                        : "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 22,
                  }}
                >
                  {meta.iconType === "logo" ? (
                    <img
                      src="/mygaru-icon.png"
                      alt=""
                      style={{ width: 34, height: 34 }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#44cfbd",
                        fontSize: 26,
                      }}
                    >
                      ✦
                    </span>
                  )}
                </div>

                <h2
                  style={{
                    fontSize: 28,
                    margin: "0 0 12px",
                  }}
                >
                  {category}
                </h2>

                <p
                  style={{
                    color: "#555",
                    fontSize: 16,
                    lineHeight: 1.55,
                    margin: "0 0 24px",
                  }}
                >
                  {meta.description}
                </p>

                <p
                  style={{
                    color: "#168f82",
                    fontWeight: 700,
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  {count} {count === 1 ? "document" : "documents"} →
                </p>
              </a>
            );
          })}
        </div>

        <div
          style={{
            maxWidth: 420,
            margin: "34px auto 0",
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 16,
            padding: "11px 16px",
            color: "#777",
            fontSize: 14,
            boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
          }}
        >
          🔍 Search will be added later
        </div>
      </section>
    </main>
  );
}
