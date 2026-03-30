# Liteparse UI

A small **Next.js** app: upload a document (types your **Liteparse** CLI accepts), click **Parse**, see the **original** and **parsed text** side by side, then **save the parsed output as a `.md` file**.

---

## Prerequisites

- **Node.js** — use a current LTS version (Next.js 15 generally expects **Node 18.18+**; **20+** is a safe choice).
- **npm** (or another compatible package manager).
- **Liteparse** installed on the machine that runs the Next.js **server**, with the `lit` command working in a terminal (e.g. `lit parse yourfile.pdf`).

---

## How to set it up

### 1. Clone or open the project

```bash
cd /path/to/parser
```

(Use your actual project folder path.)

### 2. Install dependencies

```bash
npm install
```

### 3. Make sure `lit` is available to the server

Parsing runs **on the server** inside `app/api/parse/route.ts`. The process must be able to run:

```bash
lit parse <path-to-temp-file>
```

- If `lit` works in your terminal but **fails in the app**, the dev server often has a **narrower `PATH`** (common on macOS when launching the editor or IDE from the GUI). Fix it in one of these ways:

  **Option A — full path to the executable**

  ```bash
  export LIT_CLI_PATH=/full/path/to/lit
  npm run dev
  ```

  To find the path:

  ```bash
  which lit
  ```

  **Option B — `.env.local` (recommended for local dev)**

  Create a file named `.env.local` in the project root:

  ```env
  LIT_CLI_PATH=/full/path/to/lit
  ```

  Next.js loads this automatically. Restart `npm run dev` after changing it.

### 4. Run the app (development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Production build (optional)

```bash
npm run build
npm start
```

Use the same `PATH` / `LIT_CLI_PATH` setup for the environment that runs `npm start` (your host, process manager, or container).

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
- **Parse** — sends the file to **`POST /api/parse`**; the server writes a temporary file, runs `lit parse` on it, then deletes the temp file.
- **Side by side** — left: preview when the browser can (PDF, images, text, simple HTML); right: parsed text.
- **Save as .md** — downloads the parsed text as a Markdown file.

The API expects parsed content on **`stdout`**. If your CLI only writes to a file, change [`app/api/parse/route.ts`](app/api/parse/route.ts) to read that output.

---

## Configuration

| Variable        | Required | Description |
| --------------- | -------- | ----------- |
| `LIT_CLI_PATH`  | No       | Absolute path to the `lit` binary if it is not on the server `PATH`. |

---

## Limits

- Max upload size: **50 MB** (see [`lib/constants.ts`](lib/constants.ts)).

---

## Troubleshooting

- **`Could not run the parser CLI`** — `lit` is missing for the Node process. Set `LIT_CLI_PATH` or fix `PATH` for the environment that runs `npm run dev` / `npm start`.
- **Empty or error output** — confirm in a terminal that `lit parse <file>` prints the text you want to **stdout** for that file type.
- **Lint / type errors after clone** — run `npm install`, then `npm run lint`.
