import { randomBytes } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { MAX_PARSE_OUTPUT_BYTES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { safeExtensionFromFilename } from "@/lib/files";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  let tempPath: string | null = null;

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

    const ext = safeExtensionFromFilename(file.name);
    const base = `liteparse-${randomBytes(16).toString("hex")}`;
    tempPath = path.join(os.tmpdir(), `${base}${ext}`);

    await fs.writeFile(tempPath, buffer);

    const cli = process.env.LIT_CLI_PATH?.trim() || "lit";

    const { stdout, stderr } = await execFileAsync(cli, ["parse", tempPath], {
      maxBuffer: MAX_PARSE_OUTPUT_BYTES,
      encoding: "utf8",
      env: process.env,
      windowsHide: true,
    });

    const parsed = (stdout ?? "").trim();
    if (!parsed) {
      const hint = (stderr ?? "").trim();
      return jsonError(
        hint
          ? `Parser produced no text. stderr: ${hint.slice(0, 2000)}`
          : "Parser produced no text. Check that `lit parse` writes to stdout for this file type.",
        422,
      );
    }

    return NextResponse.json({
      ok: true,
      parsedText: stdout,
      originalName: file.name,
      stderr: stderr?.trim() || undefined,
    });
  } catch (err: unknown) {
    const errno =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;

    if (errno === "ENOENT") {
      return jsonError(
        "Could not run the parser CLI. Ensure `lit` is on PATH when Next.js runs, or set LIT_CLI_PATH to the full path of the executable.",
        500,
      );
    }

    const execErr = err as {
      stderr?: string | Buffer;
      stdout?: string | Buffer;
      message?: string;
      code?: string | number;
    };

    const stderrStr =
      typeof execErr.stderr === "string"
        ? execErr.stderr
        : execErr.stderr instanceof Buffer
          ? execErr.stderr.toString("utf8")
          : "";
    const stdoutStr =
      typeof execErr.stdout === "string"
        ? execErr.stdout
        : execErr.stdout instanceof Buffer
          ? execErr.stdout.toString("utf8")
          : "";

    const exitCode =
      typeof execErr.code === "number" ? execErr.code : undefined;
    if (exitCode !== undefined || stderrStr || stdoutStr) {
      const trimmedErr = stderrStr.trim();
      const trimmedOut = stdoutStr.trim();
      const msg =
        trimmedErr ||
        trimmedOut ||
        execErr.message ||
        `Parse command failed${exitCode !== undefined ? ` (exit ${exitCode})` : ""}.`;
      return jsonError(msg.slice(0, 4000), 500);
    }

    const message =
      err instanceof Error ? err.message : "Unexpected error while parsing.";
    return jsonError(message, 500);
  } finally {
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
