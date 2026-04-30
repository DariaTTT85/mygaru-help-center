import Link from "next/link";

const LOGO_SRC = "/myGaru_logo_black.png";

export default function HomePage() {
  return (
    <div className="page">

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <img src={LOGO_SRC} alt="myGaru" />
        </div>

        <a href="https://mygaru.com" className="header-btn">
          myGaru website
        </a>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1>Product Documentation</h1>
        <p>
          A structured knowledge base for understanding how myGaru operates,
          connects with partners, and supports privacy-centric data collaboration.
        </p>

        {/* SEARCH (disabled for now) */}
        <div className="search">
          🔍 Search (coming soon)
        </div>
      </section>

      {/* CARDS */}
      <section className="cards">

        <Link href="/product-guide" className="card">
          <div className="icon" />
          <h3>Product Guide</h3>
          <p>
            Platform functionality, UX/UI logic, identity, billing, DSP, and product cases.
          </p>
        </Link>

        <Link href="/market-analysis" className="card">
          <div className="icon" />
          <h3>Market Analysis</h3>
          <p>
            Market context, identity strategies, regulatory shifts, and positioning.
          </p>
        </Link>

        <Link href="/integrations-guide" className="card">
          <div className="icon" />
          <h3>Integrations Guide</h3>
          <p>
            Deployment, integrations, and technical setup across partner environments.
          </p>
        </Link>

        <Link href="/legal-documents" className="card">
          <div className="icon" />
          <h3>Legal Documents</h3>
          <p>
            Legal framework, compliance, and data protection documentation.
          </p>
        </Link>

      </section>

      {/* STYLES */}
      <style jsx>{`
        :root {
          --brand-green: #39b7a5;
          --brand-green-soft: #6fd3c3;
          --bg: #f4f2ef;
          --text: #111;
          --muted: #6b6b6b;
        }

        .page {
          background: var(--bg);
          min-height: 100vh;
          font-family: Inter, sans-serif;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
        }

        .header-left img {
          height: 34px;
        }

        .header-btn {
          background: #111;
          color: #fff;
          padding: 10px 18px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 14px;
        }

        /* HERO */
        .hero {
          background: linear-gradient(
            180deg,
            var(--brand-green-soft) 0%,
            var(--brand-green) 60%,
            rgba(255,255,255,0) 100%
          );
          text-align: center;
          padding: 60px 20px 80px;
        }

        .hero h1 {
          font-size: 56px;
          margin-bottom: 16px;
          color: var(--text);
        }

        .hero p {
          max-width: 700px;
          margin: 0 auto 30px;
          color: var(--text);
          opacity: 0.8;
          font-size: 16px;
        }

        .search {
          display: inline-block;
          background: #fff;
          padding: 12px 24px;
          border-radius: 999px;
          color: var(--muted);
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        /* CARDS */
        .cards {
          margin-top: -60px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 0 40px 80px;
        }

        .card {
          background: #fff;
          padding: 24px;
          border-radius: 18px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.08);
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--brand-green);
          margin-bottom: 16px;
        }

        .card h3 {
          font-size: 20px;
          margin-bottom: 10px;
        }

        .card p {
          font-size: 14px;
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .cards {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

    </div>
  );
}
