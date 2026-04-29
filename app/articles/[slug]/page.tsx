type Article = {
  title: string;
  category: string;
  shortAnswer: string;
  content: string;
  slug: string;
};

async function getArticle(slug: string): Promise<Article | null> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) return null;

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
              property: "Slug",
              rich_text: {
                equals: slug,
              },
            },
          ],
        },
        page_size: 1,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.results?.length) return null;

  const item = data.results[0];

  return {
    title: item.properties?.Title?.title?.[0]?.plain_text || "Untitled",
    category: item.properties?.Category?.select?.name || "",
    shortAnswer:
      item.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "",
    content:
      item.properties?.Content?.rich_text
        ?.map((t: any) => t.plain_text)
        .join("\n") || "",
    slug: item.properties?.Slug?.rich_text?.[0]?.plain_text || "",
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <main
        style={{
          fontFamily: "Ubuntu, Arial, sans-serif",
          background: "#f4f3ef",
          minHeight: "100vh",
          padding: 40,
        }}
      >
        <h1>Article not found</h1>
        <a href="/" style={{ color: "#111" }}>
          Back to Help Center
        </a>
      </main>
    );
  }

  const backHref =
    article.category === "Market Analysis"
      ? "/market-analysis"
      : "/product-guide";

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
            Back to myGaru
          </a>
        </div>
      </header>

      <section
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: "40px 24px 90px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#777",
            marginBottom: 24,
          }}
        >
          <a href="/" style={{ color: "#777", textDecoration: "none" }}>
            All collections
          </a>{" "}
          ›{" "}
          <a href={backHref} style={{ color: "#777", textDecoration: "none" }}>
            {article.category}
          </a>{" "}
          › {article.title}
        </div>

        <article
          style={{
            background: "white",
            border: "1px solid #e4e1d8",
            borderRadius: 30,
            padding: "46px 54px",
            boxShadow: "0 14px 42px rgba(0,0,0,0.07)",
          }}
        >
          <h1
            style={{
              fontSize: 42,
              lineHeight: 1.15,
              margin: "0 0 18px",
              letterSpacing: "-0.8px",
            }}
          >
            {article.title}
          </h1>

          {article.shortAnswer && (
            <p
              style={{
                fontSize: 20,
                lineHeight: 1.6,
                color: "#555",
                margin: "0 0 32px",
              }}
            >
              {article.shortAnswer}
            </p>
          )}

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "28px 0",
            }}
          />

          <div
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: "#222",
              whiteSpace: "pre-line",
            }}
          >
            {article.content || "Content is not added yet."}
          </div>

          <div
            style={{
              marginTop: 38,
              padding: 22,
              background: "#f7f6f2",
              borderRadius: 18,
            }}
          >
            <strong>Back to: </strong>
            <a href={backHref} style={{ color: "#111" }}>
              {article.category}
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
