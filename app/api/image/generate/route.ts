import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { uploadToR2 } from "@/lib/r2";

const Body = z.object({
  campaign_id: z.string(),
  block_id: z.string(),
  prompt: z.string().min(10),
  reference_image_url: z.string().url().optional(),
  aspect_ratio: z.string().optional(),
});

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
  const size = aspectRatio === "9:16" ? "1024x1792" : "1024x1024";
  
  const out = await generateWithSeedream({ prompt: parsed.data.prompt, size });

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
    provider: "seedream",
    image_url: url,
    mime: out.mime,
    image_b64: url ? null : b64
  });
}
