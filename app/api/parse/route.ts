import { LiteParse } from "@llamaindex/liteparse";
import { NextRequest, NextResponse } from "next/server";
import { MAX_PARSE_OUTPUT_BYTES, MAX_UPLOAD_BYTES } from "@/lib/constants";

export const runtime = "nodejs";

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

    const parser = new LiteParse({
      outputFormat: "text",
      ocrEnabled: true,
      numWorkers: 1,
    });

    const result = await parser.parse(buffer);
    let text = (result.text ?? "").trim();

    if (text.length > MAX_PARSE_OUTPUT_BYTES) {
      text = text.slice(0, MAX_PARSE_OUTPUT_BYTES);
    }

    if (!text) {
      return jsonError(
        "Parser produced no text. For Office or image formats, the server may need LibreOffice or ImageMagick installed; PDFs should work without them.",
        422,
      );
    }

    return NextResponse.json({
      ok: true,
      parsedText: text,
      originalName: file.name,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error while parsing.";
    return jsonError(message.slice(0, 4000), 500);
  }
}
