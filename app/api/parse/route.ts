import { LiteParse } from "@llamaindex/liteparse";
import { NextRequest, NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const runtime = "nodejs";

/** Vercel / long-running parses: raise in dashboard if you hit timeouts. */
export const maxDuration = 120;

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const entry = formData.get("file");

    if (!entry || typeof entry === "string") {
      return jsonError("No file uploaded. Use field name \"file\".", 400);
    }

    const file = entry as File;
    if (!file.size) {
      return jsonError("The file is empty.", 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(
        `File too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
        413,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return jsonError("File exceeds maximum size after read.", 413);
    }

    const ocrEnabled = process.env.LITEPARSE_OCR_ENABLED !== "false";

    const parser = new LiteParse({
      ocrEnabled,
    });

    // Pass Buffer + optional path-like hint: library accepts path | Buffer | Uint8Array
    const result = await parser.parse(buffer, true);

    const text = (result.text ?? "").trim();
    if (!text) {
      return jsonError(
        "Parser returned no text for this file. It may be unsupported on the server (e.g. Office conversion needs LibreOffice, which is not available on typical serverless hosts), or the document may be empty.",
        422,
      );
    }

    return NextResponse.json({
      ok: true,
      parsedText: result.text,
      originalName: file.name,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error while parsing.";
    return jsonError(message.slice(0, 4000), 500);
  }
}
