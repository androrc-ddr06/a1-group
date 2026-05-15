export default function LogoPreview() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "48px", background: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "13px", letterSpacing: "4px", textTransform: "uppercase", color: "#999", marginBottom: "48px" }}>
        A1 Group — Logo System
      </h1>

      {/* Light version */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", color: "#aaa", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
          Version 1 — White Background
        </p>
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #eee", padding: "40px", display: "inline-block" }}>
          <img src="/logo-light.svg" alt="A1 Group logo light" style={{ height: "100px", display: "block" }} />
        </div>
      </div>

      {/* Dark version */}
      <div style={{ marginBottom: "48px" }}>
        <p style={{ fontSize: "11px", color: "#aaa", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
          Version 2 — Navy Background
        </p>
        <div style={{ background: "#0A1628", borderRadius: "16px", padding: "40px", display: "inline-block" }}>
          <img src="/logo-dark.svg" alt="A1 Group logo dark" style={{ height: "100px", display: "block" }} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", fontSize: "13px", color: "#999" }}>
        Happy with this? Tell me and I&apos;ll put it in the navbar, footer, and portal.
      </div>
    </div>
  );
}
