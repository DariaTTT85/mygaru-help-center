export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: "#f4f3ef",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      {/* HEADER */}
      <header style={{ padding: "18px 72px", display: "flex", justifyContent: "center" }}>
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
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#111" }}>
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
            Back to myGaru
          </a>
        </div>
      </header>

      {/* HERO (уменьшенный) */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 20px" }}>
        <div
          style={{
            borderRadius: 28,
            padding: "28px 34px",
            background:
              "linear-gradient(135deg, rgba(68,207,189,0.14), rgba(255,255,255,0.96) 52%, rgba(92,70,180,0.10))",
            border: "1px solid #e4e1d8",
            boxShadow: "0 12px 34px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ fontSize: 40, marginBottom: 12 }}>
            Search for answers or browse by topic
          </h1>

          <p style={{ color: "#555", fontSize: 17, marginBottom: 18 }}>
            Practical guidance on the myGaru platform, telecom-powered identity,
            data collaboration, and audience activation.
          </p>

          <div
            style={{
              background: "#f7f6f2",
              borderRadius: 16,
              padding: "14px 18px",
              color: "#777",
              fontSize: 15,
            }}
          >
            🔍 Search for articles...
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "12px 24px 80px" }}>
        <h2 style={{ fontSize: 28, marginBottom: 20 }}>Browse by topic</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* PRODUCT GUIDE */}
          <a
            href="/product-guide"
            style={{
              textDecoration: "none",
              color: "#111",
              background: "white",
              border: "1px solid #e4e1d8",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              display: "block",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: "#44cfbd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <img src="/mygaru-icon.png" alt="" style={{ width: 34 }} />
            </div>

            <h3 style={{ fontSize: 22, marginBottom: 10 }}>Product Guide</h3>

            <p style={{ color: "#555", fontSize: 15 }}>
              Core concepts, platform modules, and telecom-powered identity logic.
            </p>
          </a>

          {/* MARKET ANALYSIS */}
          <a
            href="/market-analysis"
            style={{
              textDecoration: "none",
              color: "#111",
              background: "white",
              border: "1px solid #e4e1d8",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              display: "block",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <span style={{ color: "#44cfbd", fontSize: 26 }}>✦</span>
            </div>

            <h3 style={{ fontSize: 22, marginBottom: 10 }}>Market Analysis</h3>

            <p style={{ color: "#555", fontSize: 15 }}>
              Identity solutions, AdTech trends, and myGaru positioning.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
