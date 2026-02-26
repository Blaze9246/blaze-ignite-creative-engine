import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { uploadToR2 } from "@/lib/r2";

const Body = z.object({
  campaign_id: z.string(),
  block_id: z.string(),
  provider: z.enum(["nanobanana2", "nanobananaPro", "seedream"]),
  prompt: z.string().min(10),
  reference_image_url: z.string().url().optional(),
  aspect_ratio: z.string().optional(),
  image_size: z.enum(["2K", "1K", "4K"]).optional()
});

function guessMime(url: string) {
  const u = url.toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function fetchAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  return {
    mimeType: res.headers.get("content-type") || guessMime(url),
    data: Buffer.from(arr).toString("base64")
  };
}

async function generateWithGemini(opts: {
  model: string;
  prompt: string;
  refUrl?: string;
  aspectRatio: string;
  imageSize: "2K" | "1K" | "4K";
}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const parts: any[] = [];
  if (opts.refUrl) {
    const inline = await fetchAsBase64(opts.refUrl);
    parts.push({ inlineData: inline });
  }
  parts.push({ text: opts.prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["Image"],
      imageConfig: {
        aspectRatio: opts.aspectRatio,
        imageSize: opts.imageSize
      }
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    opts.model
  )}:generateContent`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini image error (${res.status}): ${t.slice(0, 400)}`);
  }

  const json: any = await res.json();
  const partsOut: any[] = json?.candidates?.[0]?.content?.parts || [];
  const imgPart = partsOut.find((p) => p.inlineData?.data) || null;
  if (!imgPart) throw new Error("Gemini returned no image data");
  const b64 = imgPart.inlineData.data as string;
  const mime = imgPart.inlineData.mimeType || "image/png";
  return { bytes: Buffer.from(b64, "base64"), mime };
}

async function generateWithSeedream(opts: {
  prompt: string;
  size: string;
}) {
  const base = process.env.SEEDREAM_BASE_URL || process.env.ARK_BASE_URL;
  const key = process.env.SEEDREAM_API_KEY || process.env.ARK_API_KEY;
  const model = process.env.SEEDREAM_MODEL || "doubao-seedream-4-5-251128";
  if (!base || !key) throw new Error("SEEDREAM_BASE_URL/SEEDREAM_API_KEY (or ARK_*) missing");

  const url = `${base.replace(/\/$/, "")}/images/generations`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: opts.prompt,
      n: 1,
      size: opts.size,
      response_format: "b64_json"
    })
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Seedream error (${res.status}): ${t.slice(0, 400)}`);
  }

  const json: any = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    const urlOut = json?.data?.[0]?.url;
    if (!urlOut) throw new Error("Seedream returned neither b64_json nor url");
    const imgRes = await fetch(urlOut);
    if (!imgRes.ok) throw new Error(`Failed to fetch Seedream image url: ${imgRes.status}`);
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    return { bytes, mime: imgRes.headers.get("content-type") || "image/png" };
  }
  return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });

  const aspectRatio = parsed.data.aspect_ratio || "9:16";
  const imageSize = parsed.data.image_size || "2K";

  let out: { bytes: Buffer; mime: string };
  if (parsed.data.provider === "nanobanana2") {
    out = await generateWithGemini({
      model: "gemini-3.1-flash-image-preview",
      prompt: parsed.data.prompt,
      refUrl: parsed.data.reference_image_url,
      aspectRatio,
      imageSize
    });
  } else if (parsed.data.provider === "nanobananaPro") {
    out = await generateWithGemini({
      model: "gemini-3-pro-image-preview",
      prompt: parsed.data.prompt,
      refUrl: parsed.data.reference_image_url,
      aspectRatio,
      imageSize
    });
  } else {
    const size = aspectRatio === "9:16" ? "1024x1792" : "1024x1024";
    out = await generateWithSeedream({ prompt: parsed.data.prompt, size });
  }

  const key = `campaigns/${parsed.data.campaign_id}/${parsed.data.block_id}/${crypto
    .randomBytes(6)
    .toString("hex")}.png`;

  let url: string | null = null;
  try {
    if (process.env.R2_ACCOUNT_ID) {
      url = await uploadToR2(key, new Uint8Array(out.bytes), out.mime);
    }
  } catch {
    // ignore storage failures; still return base64
  }

  const b64 = out.bytes.toString("base64");
  return NextResponse.json({
    ok: true,
    provider: parsed.data.provider,
    image_url: url,
    mime: out.mime,
    image_b64: url ? null : b64
  });
}
