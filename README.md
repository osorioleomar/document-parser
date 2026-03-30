# Liteparse UI

A small **Next.js** app: upload a document, click **Parse**, see the **original** and **parsed text** side by side, then **save the parsed output as a `.md` file**. Parsing uses the **`@llamaindex/liteparse`** library on the server (same engine as the `lit` CLI), so deploys like **Vercel** do not need a global `lit` binary.

---

## Prerequisites

- **Node.js** — use a current LTS version (Next.js 15 generally expects **Node 18.18+**; **20+** is a safe choice).
- **npm** (or another compatible package manager).

---

## How to set it up

### 1. Clone or open the project

```bash
cd /path/to/document-parser
```

(Use your actual project folder path.)

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app (development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Production build (optional)

```bash
npm run build
npm start
```

---

## npm scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm start`    | Serve production build   |
| `npm run lint` | ESLint (Next.js config)  |

---

## What it does

- **Upload** — pick a file in the browser.
- **Parse** — sends the file to **`POST /api/parse`**; the server runs **LiteParse** on the bytes (no separate `lit` CLI).
- **Side by side** — left: preview when the browser can (PDF, images, text, simple HTML); right: parsed text.
- **Save as .md** — downloads the parsed text as a Markdown file.
- **Browser storage** — after a successful parse, the app saves the **parsed text** and **original filename** in **localStorage** on this device. Reloading the page restores that text (you still need to choose the file again for a full preview).

---

## Deployment (e.g. Vercel)

- Install dependencies and deploy as a normal Next.js app. You do **not** need `LIT_CLI_PATH` or `lit` on `PATH`.
- **PDFs** (and formats LiteParse can handle without extra system tools) work in serverless.
- **Office documents** (Word, Excel, etc.) and some image pipelines may require **LibreOffice** / **ImageMagick** on the host. Those are **not** available on default Vercel serverless; use a **container/VM** or parse **PDFs** in that environment.

---

## Configuration

There is no required environment variable for basic operation. Optional LiteParse options (OCR language, tessdata path, etc.) can be added in [`app/api/parse/route.ts`](app/api/parse/route.ts) via the `LiteParse` constructor.

---

## Limits

- Max upload size: **50 MB** (see [`lib/constants.ts`](lib/constants.ts)).
- Parsed output is capped (see `MAX_PARSE_OUTPUT_BYTES` in [`lib/constants.ts`](lib/constants.ts)).

---

## Troubleshooting

- **Build errors involving `liteparse` / PDF workers** — the app lists `@llamaindex/liteparse` and related packages in `serverExternalPackages` in [`next.config.ts`](next.config.ts) so Next does not break dynamic PDF assets.
- **Empty or error output for Office/image files on Vercel** — confirm the format is supported without extra binaries, or run the app where LibreOffice/ImageMagick are installed.
- **Lint / type errors after clone** — run `npm install`, then `npm run lint`.
