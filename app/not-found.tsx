'use client'

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.codeBlock}>
          <span style={styles.errorCode}>404</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.content}>
          <h1 style={styles.title}>Page Not Found</h1>
          <p style={styles.message}>
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
            It may have been moved, deleted, or never existed.
          </p>

          <div style={styles.actions}>
            <Link href="/" style={styles.primaryBtn}>
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              style={styles.secondaryBtn}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "3rem 2.5rem",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
  },
  codeBlock: {
    marginBottom: "1.5rem",
  },
  errorCode: {
    fontSize: "6rem",
    fontWeight: "800",
    color: "#111827",
    letterSpacing: "-4px",
    lineHeight: 1,
  },
  divider: {
    height: "2px",
    background: "linear-gradient(90deg, #e5e7eb, #6366f1, #e5e7eb)",
    borderRadius: "2px",
    marginBottom: "1.5rem",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  message: {
    fontSize: "0.95rem",
    color: "#6b7280",
    lineHeight: "1.6",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    marginTop: "0.5rem",
    flexWrap: "wrap",
  },
  primaryBtn: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
    padding: "0.65rem 1.5rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "background 0.2s",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    color: "#374151",
    padding: "0.65rem 1.5rem",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
};