import { NextResponse } from "next/server";
import { z } from "zod";
import type { CampaignInputs, Product, CampaignOutput, CreativeBlock } from "@/lib/types";
import { deepSeekChat } from "@/lib/brain/deepseek";
import { SYSTEM, step1StoreIntelPrompt, step2ProductPicksPrompt, step3ArchitectureMapPrompt, step4GenerateBlocksPrompt } from "@/lib/brain/prompts";
import crypto from "crypto";
import { db } from "@/lib/db";

const Body = z.object({
  inputs: z.any(),
  products: z.array(z.any()),
  selectedProductIds: z.array(z.string()).min(1)
});

function uid(prefix: string) { return `${prefix}_${crypto.randomBytes(8).toString("hex")}`; }

function estimateCostUSD(inputs: CampaignInputs, selectedCount: number) {
  const blocksPerProduct = 8 + (inputs.includeUGC ? 1 : 0) + (inputs.includePROMO ? 1 : 0);
  const images = selectedCount * blocksPerProduct;
  const llmEstimate = 0.40;
  const imgEstimate = inputs.imageProvider === "seedream" ? 0.12 : (inputs.imageProvider === "nanobananaPro" ? 0.18 : 0.10);
  return llmEstimate + images * imgEstimate;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });

  const inputs = parsed.data.inputs as CampaignInputs;
  const products = (parsed.data.products as Product[]) || [];
  const selected = products.filter(p => parsed.data.selectedProductIds.includes(p.id));
  const campaign_id = uid("cmp");

  const cost_estimate_usd = estimateCostUSD(inputs, selected.length);

  try {
    if (process.env.DATABASE_URL) {
      const pool = db();
      await pool.query(
        `INSERT INTO campaigns (id, store_url, country, month, theme, goal_preset, goal_other, promotion, max_products, image_provider, include_ugc, include_promo, cost_estimate_usd)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [campaign_id, inputs.storeUrl, inputs.country, inputs.month, inputs.theme || "", inputs.goalPreset, inputs.goalOther || "", JSON.stringify(inputs.promotion),
         inputs.maxProducts, inputs.imageProvider, inputs.includeUGC, inputs.includePROMO, cost_estimate_usd]
      );
      for (const p of products) {
        await pool.query(
          `INSERT INTO products (id, campaign_id, title, url, price, currency, image, description)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [p.id, campaign_id, p.title, p.url || "", p.price || null, p.currency || null, p.image || null, p.description || null]
        );
      }
    }
  } catch {
    // ignore
  }

  const hasKeys = !!(process.env.ARK_API_KEY && process.env.ARK_BASE_URL);

  let creative_blocks: CreativeBlock[] = [];
  let google_pmax_pack: any = null;

  if (hasKeys) {
    const s1 = await deepSeekChat([{ role:"system", content: SYSTEM }, { role:"user", content: step1StoreIntelPrompt({ storeUrl: inputs.storeUrl, country: inputs.country }) }], { temperature: 0.2 });
    const s2 = await deepSeekChat([{ role:"system", content: SYSTEM }, { role:"user", content: step2ProductPicksPrompt({ ...inputs, maxProducts: inputs.maxProducts, selectedProducts: selected }) }], { temperature: 0.35 });
    const s3 = await deepSeekChat([{ role:"system", content: SYSTEM }, { role:"user", content: step3ArchitectureMapPrompt({ ...inputs, selectedProducts: selected }) }], { temperature: 0.25 });
    const s4 = await deepSeekChat([{ role:"system", content: SYSTEM }, { role:"user", content: step4GenerateBlocksPrompt({ ...inputs, storeIntel: safeJSON(s1.text), productPicks: safeJSON(s2.text), archMap: safeJSON(s3.text), selectedProducts: selected }) }], { temperature: 0.65 });

    const final = safeJSON(s4.text);
    creative_blocks = (final?.creative_blocks || []).map((b: any) => ({
      ...b,
      id: b.id || uid("blk"),
      generated_image_url: null,
      generated_at: null,
      actual_cost_usd: null
    }));
    google_pmax_pack = final?.google_pmax_pack || null;
  } else {
    const demo = demoOutput(inputs, products, selected, campaign_id, cost_estimate_usd);
    creative_blocks = demo.creative_blocks;
    google_pmax_pack = demo.google_pmax_pack;
  }

  const out: CampaignOutput = {
    campaign_id,
    inputs,
    products,
    selected_products: selected,
    creative_blocks,
    google_pmax_pack,
    cost_estimate_usd,
    cost_actual_usd: 0
  };

  return NextResponse.json(out);
}

function safeJSON(s: string) { try { return JSON.parse(s); } catch { return { raw: s }; } }

function demoOutput(inputs: CampaignInputs, products: Product[], selected: Product[], campaignId: string, cost_est: number) {
  const arch = [
    { code: "IDENTITY", name: "Identity Mirror", rationale: "Turns the product into a personal identity upgrade." },
    { code: "CORPORATE", name: "Corporate Power", rationale: "Signals competence and control." },
    { code: "WEALTH", name: "Wealth Aura", rationale: "Luxury cues + success symbolism." },
    { code: "MYTHIC", name: "Mythic Companion", rationale: "Epic metaphor magnifies desire." },
    { code: "SURREAL", name: "Surreal Literalization", rationale: "Visualizes the benefit literally." },
    { code: "ORBIT", name: "Orbit Halo", rationale: "Orbit/halo energy composition." },
    { code: "LUXURY", name: "Luxury Product Studio", rationale: "High-end studio product realism." },
    { code: "MONUMENTAL", name: "Monumental Scale", rationale: "Oversized impact visual." }
  ];
  const blocks = [...arch];
  if (inputs.includeUGC) blocks.push({ code:"UGC", name:"UGC Block", rationale:"UGC script + Kling prompt + 7-layer image prompt." } as any);
  if (inputs.includePROMO) blocks.push({ code:"PROMO", name:"Promo Block", rationale:"One focused promo creative." } as any);

  const anglePrompts = [
    "Create a new image using the reference image of a different camera angle (left side view). The subject MUST BE STANDING UP instead of sitting down. Keep the exact same appearance, but show them standing confidently. in 9:16 ratio",
    "Create a new image using the reference image of a Different camera angle (left side view). The subject sitting down instead of standing up. Keep the exact same appearance, but show them sitting confidently. in 9:16 ratio",
    "Create a new image using the reference image of a Different camera angle (right side view), character maintaining the same appearance but in a completely modified pose.in 9:16 ratio",
    "Create a new image using the reference image of a Closer shot, character pose shifted naturally, resting hands in a new position in 9:16 ratio",
    "Create a new image using the reference image of a Wider shot showing the environment. The subject MUST BE STANDING instead of sitting. in 9:16 ratio",
    "Create a new image using the reference image of a Low angle perspective, character looking in an entirely new direction.in 9:16 ratio"
  ];

  const creative_blocks: CreativeBlock[] = blocks.map((a, i) => {
    const prod = selected[i % selected.length]!;
    return {
      id: `blk_${campaignId}_${a.code}`,
      code: a.code,
      name: a.name,
      rationale: a.rationale,
      selected_product_id: prod.id,
      hook: inputs.country === "Worldwide"
        ? `Stop scrolling — this is the easiest upgrade you'll make this ${inputs.month}.`
        : `Quick one for ${inputs.country} — if you want an upgrade that feels instantly premium, start here.`,
      static_prompt: `9:16 vertical premium advertising image in ${inputs.country} style, ${a.name} architecture for product "${prod.title}". Cinematic lighting, 50mm realism, natural color science, tactile textures, owned not staged, 2K output, no CGI. Month: ${inputs.month}. Theme: ${inputs.theme || "Evergreen"}.`,
      image_angle_prompts: anglePrompts,
      motion: {
        recommended: a.code !== "LUXURY",
        duration_s: 6,
        kling_prompt: `9:16 cinematic motion for "${prod.title}" using ${a.code}. Subtle push-in, natural interaction, premium pacing, country nuance: ${inputs.country}.`,
        music_style: a.code === "MYTHIC" ? "cinematic epic underscore" : "subtle modern commercial bed",
        sound_design: "room tone + product contact + gentle whoosh accents"
      },
      facebook_copy: {
        primary_text: `Problem: Most "upgrades" disappoint in real life.\n\nAgitation: You waste money and end up shopping again.\n\nSolution: ${prod.title} is built to feel premium immediately — details, finish, and quality you notice fast.`,
        headlines: ["The Upgrade You'll Feel", "Premium, Not Pretend", "Limited Offer This Month"]
      },
      generated_image_url: null,
      generated_at: null,
      actual_cost_usd: null
    };
  });

  const google_pmax_pack = {
    headlines_30: ["Premium Upgrade, Fast","Shop The New Drop","Limited-Time Offer","Feel The Difference Today","Designed To Impress","Best Sellers In Stock"],
    headlines_60: [
      "Premium quality that feels better the second you open it",
      "The easiest upgrade to your everyday — limited stock",
      "Shop best sellers with a limited-time promotion",
      "Look premium without the premium hassle",
      "Elevate your routine with a real upgrade",
      "Buy now before this month's offer ends"
    ],
    headlines_90: [
      "Stop wasting money on \"almost premium\" — get the upgrade that looks and feels elite",
      "New month, new upgrade: shop our best sellers with a limited-time promotion today",
      "Premium details, better feel, and the kind of quality you notice immediately — shop now",
      "If you're going to buy once, buy right — upgrade with a limited-time offer while stock lasts",
      "Turn your everyday into premium with a product that actually delivers in real life",
      "Shop now and lock in this month's promotion before it disappears"
    ],
    descriptions: [
      "Premium quality you can feel. Shop best sellers and grab this month's offer.",
      "Upgrade your everyday with products built to impress — limited availability.",
      "Designed for real life. Better materials, better feel, better results."
    ],
    search_terms: ["buy premium online","best gift ideas","luxury deal","premium product deal","shop online","best product near me","gift for her","gift for him","buy online deal","limited time offer"],
    pro_tips: ["Split asset groups by category & price-point.","Add 10–15 fresh images/month to prevent fatigue.","Rotate descriptions weekly and keep 1–2 promo headlines consistent."]
  };

  return { creative_blocks, google_pmax_pack, cost_estimate_usd: cost_est };
}
