"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

type ParseResponse =
  | { ok: true; parsedText: string; originalName: string; stderr?: string }
  | { ok: false; error: string };

function baseNameFromFilename(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "");
  return base || "parsed";
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnStderr, setWarnStderr] = useState<string | null>(null);

  const previewKind = useMemo(() => {
    if (!file) return "none";
    const t = file.type;
    const lower = file.name.toLowerCase();
    if (t === "application/pdf") return "pdf";
    if (t.startsWith("image/")) return "image";
    if (
      t === "text/html" ||
      lower.endsWith(".html") ||
      lower.endsWith(".htm")
    )
      return "html";
    if (t.startsWith("text/") || t === "application/json") return "text";
    return "unknown";
  }, [file]);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      setTextPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    if (previewKind === "text") {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setTextPreview(result.slice(0, 120_000));
      };
      reader.readAsText(file.slice(0, 500_000));
    } else {
      setTextPreview(null);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, previewKind]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_UPLOAD_BYTES) {
      setError(
        `File too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
      );
      setFile(null);
      setParsedText("");
      setWarnStderr(null);
      e.target.value = "";
      return;
    }
    setFile(f);
    setParsedText("");
    setError(null);
    setWarnStderr(null);
  }, []);

  const parse = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setWarnStderr(null);
    setParsedText("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body,
      });

      const data = (await res.json()) as ParseResponse;

      if (!res.ok || !data.ok) {
        setError("error" in data ? data.error : `Request failed (${res.status})`);
        return;
      }

      setParsedText(data.parsedText);
      if (data.stderr) {
        setWarnStderr(data.stderr);
      }
    } catch {
      setError("Network error or invalid response.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const downloadMd = useCallback(() => {
    if (!parsedText.trim() || !file) return;
    const name = `${baseNameFromFilename(file.name)}.md`;
    const blob = new Blob([parsedText], {
      type: "text/markdown;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
    URL.revokeObjectURL(href);
  }, [parsedText, file]);

  return (
    <main
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "1.5rem 1.25rem 3rem",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.35rem" }}>
          Liteparse
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
          Upload a document, run <code>lit parse</code> on the server, compare
          original and parsed output, then save as Markdown.
        </p>
      </header>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.25rem",
          padding: "1rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Document
          </span>
          <input type="file" onChange={onFileChange} />
        </label>
        <button
          type="button"
          onClick={parse}
          disabled={!file || loading}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "none",
            background:
              !file || loading ? "var(--border)" : "var(--accent)",
            color: "var(--text)",
            fontWeight: 600,
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Parsing…" : "Parse"}
        </button>
        <button
          type="button"
          onClick={downloadMd}
          disabled={!parsedText.trim()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontWeight: 600,
            cursor: !parsedText.trim() ? "not-allowed" : "pointer",
          }}
        >
          Save as .md
        </button>
        {file && (
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </span>
        )}
      </section>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: 8,
            background: "rgba(248,113,113,0.12)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {warnStderr && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: 8,
            background: "rgba(251,191,36,0.1)",
            border: "1px solid #fbbf24",
            color: "#fcd34d",
            fontSize: "0.85rem",
            whiteSpace: "pre-wrap",
          }}
        >
          Parser stderr: {warnStderr}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          minHeight: 520,
        }}
        className="split-grid"
      >
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            Original
          </div>
          <div style={{ flex: 1, minHeight: 480, position: "relative" }}>
            {!file && (
              <p style={{ padding: "1rem", color: "var(--muted)", margin: 0 }}>
                Choose a file to preview when possible.
              </p>
            )}
            {file && previewKind === "pdf" && objectUrl && (
              <object
                data={objectUrl}
                type="application/pdf"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 480,
                  border: "none",
                }}
                title="Original PDF"
              />
            )}
            {file && previewKind === "image" && objectUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={objectUrl}
                alt="Original"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            )}
            {file && previewKind === "text" && textPreview !== null && (
              <pre
                style={{
                  margin: 0,
                  padding: "0.75rem",
                  height: "100%",
                  overflow: "auto",
                  fontSize: "0.8rem",
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {textPreview}
                {file.size > 500_000 && (
                  <span style={{ color: "var(--muted)" }}>
                    {"\n\n"}… (preview truncated)
                  </span>
                )}
              </pre>
            )}
            {file && previewKind === "html" && objectUrl && (
              <iframe
                title="Original HTML"
                src={objectUrl}
                sandbox=""
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 480,
                  border: "none",
                }}
              />
            )}
            {file && previewKind === "unknown" && (
              <div style={{ padding: "1rem", color: "var(--muted)" }}>
                <p style={{ margin: "0 0 0.5rem" }}>
                  No embedded preview for this type in the browser.
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem" }}>
                  After parsing, compare using the parsed text on the right.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            Parsed text
          </div>
          <textarea
            readOnly
            value={parsedText}
            placeholder={
              loading
                ? "Waiting for parser…"
                : "Parsed output from `lit parse` appears here."
            }
            style={{
              flex: 1,
              minHeight: 480,
              width: "100%",
              resize: "vertical",
              border: "none",
              padding: "0.75rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.8rem",
              lineHeight: 1.45,
              background: "var(--bg)",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </section>
      </div>
    </main>
  );
}
