import { put, del } from "@vercel/blob";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export type StorageProvider = "vercel-blob" | "supabase";

function getProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "vercel-blob").toLowerCase();
  if (provider === "supabase") return "supabase";
  return "vercel-blob";
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios");
  }
  return createClient(url, key);
}

async function compressImage(
  buffer: Buffer,
  mime: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  let pipeline = sharp(buffer).rotate();
  const meta = await pipeline.metadata();

  if (meta.width && meta.width > 1600) {
    pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true });
  }

  if (mime === "image/png") {
    const out = await pipeline.png({ compressionLevel: 8 }).toBuffer();
    return { buffer: out, contentType: "image/png", ext: "png" };
  }

  if (mime === "image/webp") {
    const out = await pipeline.webp({ quality: 80 }).toBuffer();
    return { buffer: out, contentType: "image/webp", ext: "webp" };
  }

  const out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return { buffer: out, contentType: "image/jpeg", ext: "jpg" };
}

export class UploadError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "UploadError";
  }
}

export async function uploadFoto(userId: string, file: File): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError(
      "INVALID_FILE_TYPE",
      "Aceitos apenas jpg, jpeg, png e webp"
    );
  }

  if (file.size > MAX_BYTES) {
    throw new UploadError("FILE_TOO_LARGE", "Arquivo deve ter no máximo 5MB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  const compressed = await compressImage(input, file.type);
  const pathname = `${userId}/${randomUUID()}.${compressed.ext}`;
  const provider = getProvider();

  if (provider === "supabase") {
    const supabase = getSupabase();
    const bucket = process.env.SUPABASE_BUCKET || "closet-fotos";
    const { error } = await supabase.storage
      .from(bucket)
      .upload(pathname, compressed.buffer, {
        contentType: compressed.contentType,
        upsert: false,
      });

    if (error) {
      throw new UploadError("UPLOAD_FAILED", error.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(pathname);
    return data.publicUrl;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new UploadError(
      "STORAGE_NOT_CONFIGURED",
      "BLOB_READ_WRITE_TOKEN não configurado"
    );
  }

  const blob = await put(pathname, compressed.buffer, {
    access: "public",
    contentType: compressed.contentType,
    token,
  });

  return blob.url;
}

export async function deleteFoto(
  fotoUrl: string | null | undefined
): Promise<void> {
  if (!fotoUrl) return;

  const provider = getProvider();

  try {
    if (provider === "supabase") {
      const supabase = getSupabase();
      const bucket = process.env.SUPABASE_BUCKET || "closet-fotos";
      const path = extractSupabasePath(fotoUrl, bucket);
      if (!path) return;
      await supabase.storage.from(bucket).remove([path]);
      return;
    }

    if (!isVercelBlobUrl(fotoUrl)) return;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return;
    await del(fotoUrl, { token });
  } catch {
    // Best-effort delete — não bloqueia exclusão do registro
  }
}

function isVercelBlobUrl(url: string): boolean {
  return (
    url.includes("blob.vercel-storage.com") ||
    url.includes("public.blob.vercel-storage.com")
  );
}

function extractSupabasePath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
