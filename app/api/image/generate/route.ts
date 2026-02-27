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
  
  console.log("Seedream config:", { base: base?.substring(0, 30), key: key?.substring(0, 10), model });
  
  if (!base || !key) {
    throw new Error("SEEDREAM_BASE_URL/SEEDREAM_API_KEY (or ARK_*) missing");
  }

  const url = `${base.replace(/\/$/, "")}/images/generations`;
  
  console.log("Calling Seedream at:", url);
  
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

  console.log("Seedream response status:", res.status);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("Seedream error response:", t);
    throw new Error(`Seedream error (${res.status}): ${t.slice(0, 400)}`);
  }

  const text = await res.text();
  console.log("Seedream response length:", text.length);
  
  if (!text) {
    throw new Error("Seedream returned empty response");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text.substring(0, 200));
    throw new Error("Invalid JSON response from Seedream");
  }
  
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    const urlOut = json?.data?.[0]?.url;
    if (!urlOut) {
      console.error("Seedream response:", JSON.stringify(json).substring(0, 200));
      throw new Error("Seedream returned neither b64_json nor url");
    }
    const imgRes = await fetch(urlOut);
    if (!imgRes.ok) throw new Error(`Failed to fetch Seedream image url: ${imgRes.status}`);
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    return { bytes, mime: imgRes.headers.get("content-type") || "image/png" };
  }
  return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
}

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new NextResponse(JSON.stringify({ error: "Invalid input", details: parsed.error }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const aspectRatio = parsed.data.aspect_ratio || "9:16";
    const size = aspectRatio === "9:16" ? "1024x1792" : "1024x1024";
    
    console.log("Generating image with prompt:", parsed.data.prompt.substring(0, 50));
    
    const out = await generateWithSeedream({ prompt: parsed.data.prompt, size });

    const key = `campaigns/${parsed.data.campaign_id}/${parsed.data.block_id}/${crypto
      .randomBytes(6)
      .toString("hex")}.png`;

    let url: string | null = null;
    try {
      if (process.env.R2_ACCOUNT_ID) {
        url = await uploadToR2(key, new Uint8Array(out.bytes), out.mime);
      }
    } catch (e) {
      console.log("R2 upload failed, returning base64:", e);
    }

    const b64 = out.bytes.toString("base64");
    return NextResponse.json({
      ok: true,
      provider: "seedream",
      image_url: url,
      mime: out.mime,
      image_b64: url ? null : b64
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return new NextResponse(JSON.stringify({ 
      error: error.message || "Image generation failed",
      details: error.stack
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
