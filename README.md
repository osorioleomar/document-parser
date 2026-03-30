# Liteparse UI

A small **Next.js** app: upload a document, click **Parse**, see the **original** and **parsed text** side by side, then **save the parsed output as a `.md` file**.

Parsing uses the **`@llamaindex/liteparse`** library on the **server** (the same engine as the `lit` CLI). You do **not** need the `lit` binary installed on **Vercel** or other hosts—only the npm dependency.

The **last successful parse** is stored in the **browser** with **IndexedDB** (not on the server), so revisiting the app can restore the parsed text without uploading again. Re-upload the file if you need the original preview.

---

## Prerequisites

- **Node.js** — Next.js 15 generally expects **Node 18.18+**; **20+** is a safe choice.
- **npm** (or pnpm/yarn).

---

## How to set it up

### 1. Open the project

```bash
cd /path/to/parser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app (development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Production build

```bash
npm run build
npm start
```

---

## Vercel and serverless

- The API route imports **`LiteParse`** from `@llamaindex/liteparse` and parses the uploaded bytes in Node—**no shell `lit` command**.
- [`next.config.ts`](next.config.ts) sets **`serverExternalPackages`** for `@llamaindex/liteparse` and **`sharp`** so the server bundle resolves native assets correctly.
- **`outputFileTracingIncludes`** for **`/api/parse`** pulls in **`@llamaindex/liteparse/dist/**/*`** so PDF.js can load **`pdf.worker.mjs`** on Vercel (fixes “Setting up fake worker failed / Cannot find module … pdf.worker.mjs”).
- **`outputFileTracingRoot`** is set to this project directory if a **parent folder** has another `package-lock.json`, so file tracing does not miss `node_modules` paths.
- **PDFs** are a good fit for serverless. **Office formats** (DOCX, etc.) may require **LibreOffice** on the machine for conversion; typical **Vercel** images do **not** include it, so those formats may fail there while **PDF** works.
- Large documents can hit **function duration / memory** limits—raise **maxDuration** in [`app/api/parse/route.ts`](app/api/parse/route.ts) and your Vercel plan limits if needed.

---

## npm scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Development server      |
| `npm run build` | Production build        |
| `npm start`     | Serve production build  |
| `npm run lint`  | ESLint (Next.js config) |

---

## What it does

- **Upload** — pick a file in the browser.
- **Parse** — `POST /api/parse` runs **LiteParse** on the file bytes in Node (no temp upload folder required for PDF; other formats may use temp files inside the library).
- **Side by side** — left: in-browser preview when possible (PDF, images, text, HTML); right: parsed text.
- **Save as .md** — downloads the parsed text.
- **IndexedDB** — after a successful parse, the app saves **original filename + parsed text** locally. On the next visit, it can **restore** that text (use **Clear saved parse** to remove it).

---

## Configuration (environment)

| Variable                  | Required | Description |
| ------------------------- | -------- | ----------- |
| `LITEPARSE_OCR_ENABLED`   | No       | Set to `false` to disable OCR (faster, worse on scanned PDFs). Default: OCR on. |

Tesseract language data may download on first OCR use unless you configure offline tessdata (see [LiteParse docs](https://developers.llamaindex.ai/liteparse/)).

---

## Limits

- Max upload size: **50 MB** (see [`lib/constants.ts`](lib/constants.ts)).
- API route sets **`maxDuration`** (see [`app/api/parse/route.ts`](app/api/parse/route.ts)) for long parses.

---

## Troubleshooting

- **Parse errors on Vercel for Office files** — conversion often needs **LibreOffice**, which is not available on default Vercel. Try **PDF** uploads, or run the app on a **VPS/Docker** image where you can install LibreOffice.
- **Timeouts** — increase Vercel **function duration** and/or simplify documents (fewer pages, lower DPI via LiteParse config if you extend the route).
- **IndexedDB** — private browsing or blocked storage may prevent saving; parsing still works session-to-session.
- **Lint / type errors after clone** — run `npm install`, then `npm run lint`.
