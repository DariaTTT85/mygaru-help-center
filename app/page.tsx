export default async function Home() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Missing environment variables</h1>
        <p>Check NOTION_TOKEN and NOTION_DATABASE_ID in Vercel.</p>
      </main>
    );
  }

  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Notion API Error</h1>
        <p>
          <strong>Status:</strong> {response.status}
        </p>
        <pre
          style={{
            background: "#ffecec",
            padding: 20,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Articles from Notion</h1>

      {data.results.map((item: any) => {
        const title =
          item.properties?.Title?.title?.[0]?.plain_text || "No title";

        const short =
          item.properties?.["Short answer"]?.rich_text?.[0]?.plain_text || "";

        const category =
          item.properties?.Category?.select?.name || "No category";

        const slug =
          item.properties?.Slug?.rich_text?.[0]?.plain_text || "";

        return (
          <div
            key={item.id}
            style={{
              marginBottom: 20,
              padding: 20,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "white",
            }}
          >
            <h2>{title}</h2>
            <p>{short}</p>
            <p>
              <strong>Category:</strong> {category}
            </p>
            <p>
              <strong>Slug:</strong> {slug}
            </p>
          </div>
        );
      })}
    </main>
  );
}
