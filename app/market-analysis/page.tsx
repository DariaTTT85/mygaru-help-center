import { getArticles } from "../../lib/notion";
import DocumentList from "../document-list";
const LOGO_SRC = "/myGaru_logo_black.png";

export default async function MarketAnalysis() {
  const articles = (await getArticles({ category: "Market Analysis" })) ?? [];

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
        .document-row {
          transition: background 150ms ease, color 150ms ease, transform 150ms ease;
        }

        .document-row:hover {
          background: rgba(68, 207, 189, 0.10);
          transform: translateX(2px);
        }

        .document-row:hover .document-title {
          color: #008f82;
        }

        .document-row:hover .document-arrow {
          transform: translateX(4px);
        }

        .document-arrow {
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
            marginBottom: 46,
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

        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.05,
              margin: "0 0 14px",
              letterSpacing: "-1.4px",
            }}
          >
            Market Analysis
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
            Market context, identity strategies, regulatory shifts, and myGaru positioning.
          </p>
        </div>
      </div>

      <section style={{ maxWidth: 860, margin: "-48px auto 0", padding: "0 24px 80px" }}>
        <DocumentList articles={articles} legacyGroups />
      </section>
    </main>
  );
}
