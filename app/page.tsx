export default async function Home() {
  try {
    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token) {
      throw new Error("NOTION_TOKEN is missing");
    }

    if (!databaseId) {
      throw new Error("NOTION_DATABASE_ID is missing");
    }

    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();

    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Notion API Test</h1>

        <p>
          <strong>Status:</strong> {response.status}
        </p>

        <pre
          style={{
            background: "#f4f4f4",
            padding: 20,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </main>
    );
  } catch (error: any) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Notion API Error</h1>

        <pre
          style={{
            background: "#ffecec",
            padding: 20,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
            color: "#b00020",
          }}
        >
          {error?.message || String(error)}
        </pre>
      </main>
    );
  }
}
