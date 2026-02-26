import { NextResponse } from "next/server";
import { z } from "zod";
import type { Product } from "@/lib/types";

const Body = z.object({ storeUrl: z.string().url(), country: z.string().min(2) });

function normalizeStoreUrl(u: string) {
  return u.replace(/\/$/, "");
}

function uniqBy<T>(arr: T[], keyFn: (x:T)=>string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function tryShopifyProductsJson(storeUrl: string): Promise<Product[] | null> {
  const url = `${storeUrl}/products.json?limit=50`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;
  const json: any = await res.json().catch(() => null);
  if (!json?.products?.length) return null;

  const products: Product[] = json.products.map((p: any) => {
    const img = p?.images?.[0]?.src || p?.image?.src || null;
    const priceStr = p?.variants?.[0]?.price;
    const price = priceStr ? Number(priceStr) : undefined;
    return {
      id: String(p.id),
      title: p.title,
      url: `${storeUrl}/products/${p.handle}`,
      description: (p.body_html || "").replace(/<[^\u003e]+>/g, " ").replace(/\s+/g, " ").trim(),
      image: img || undefined,
      price: Number.isFinite(price) ? price : undefined,
      currency: undefined
    };
  });

  return uniqBy(products, (p) => p.id).slice(0, 20);
}

async function fetchText(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.text();
}

function extractProductJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^\u003e]*type=["']application\/ld\+json["'][^\u003e]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      out.push(parsed);
    } catch {
      try {
        const cleaned = raw.replace(/\n/g, " ").replace(/\t/g, " ");
        const parsed = JSON.parse(cleaned);
        out.push(parsed);
      } catch { }
    }
  }
  return out;
}

function flattenLd(ld: any): any[] {
  if (!ld) return [];
  if (Array.isArray(ld)) return ld.flatMap(flattenLd);
  if (ld["@graph"] && Array.isArray(ld["@graph"])) return ld["@graph"];
  return [ld];
}

function ldToProduct(ld: any, url: string): Product | null {
  const nodes = flattenLd(ld);
  const prod = nodes.find((n) => (n["@type"] === "Product") || (Array.isArray(n["@type"]) && n["@type"].includes("Product")));
  if (!prod) return null;

  const img = Array.isArray(prod.image) ? prod.image[0] : prod.image;
  const offers = prod.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const price = offer?.price ? Number(offer.price) : undefined;
  const currency = offer?.priceCurrency;

  return {
    id: String(prod.sku || prod.productID || prod.gtin || url),
    title: String(prod.name || "Product"),
    url,
    description: String(prod.description || ""),
    image: img || undefined,
    price: Number.isFinite(price) ? price : undefined,
    currency: currency || undefined
  };
}

async function trySitemap(storeUrl: string): Promise<string[]> {
  const candidates = [
    `${storeUrl}/sitemap.xml`,
    `${storeUrl}/sitemap_index.xml`,
    `${storeUrl}/sitemap.xml.gz`
  ];

  for (const url of candidates) {
    try {
      const xml = await fetchText(url);
      const locs = Array.from(xml.matchAll(/<loc>([^\u003c]+)<\/loc>/g)).map(m => m[1].trim());
      const productLike = locs.filter(l => /\/product\//i.test(l) || /\/products\//i.test(l));
      if (productLike.length) return productLike.slice(0, 30);
      const sitemapLike = locs.filter(l => /sitemap/i.test(l));
      if (sitemapLike.length) {
        for (const child of sitemapLike.slice(0, 5)) {
          try {
            const childXml = await fetchText(child);
            const childLocs = Array.from(childXml.matchAll(/<loc>([^\u003c]+)<\/loc>/g)).map(m => m[1].trim());
            const childProducts = childLocs.filter(l => /\/product\//i.test(l) || /\/products\//i.test(l));
            if (childProducts.length) return childProducts.slice(0, 30);
          } catch { }
        }
      }
    } catch { }
  }
  return [];
}

async function scrapeProductsFromPages(urls: string[]): Promise<Product[]> {
  const out: Product[] = [];
  for (const u of urls.slice(0, 12)) {
    try {
      const html = await fetchText(u);
      const lds = extractProductJsonLd(html);
      for (const ld of lds) {
        const p = ldToProduct(ld, u);
        if (p?.title && p.image) out.push(p);
      }
    } catch { }
  }
  const dedup = uniqBy(out, (p) => p.url || p.id).slice(0, 20);
  return dedup.map((p, idx) => ({ ...p, id: p.id || `p_${idx+1}` }));
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });

  const storeUrl = normalizeStoreUrl(parsed.data.storeUrl);

  const shopify = await tryShopifyProductsJson(storeUrl);
  if (shopify?.length) return NextResponse.json({ suggestedProducts: shopify });

  const urls = await trySitemap(storeUrl);
  if (urls.length) {
    const scraped = await scrapeProductsFromPages(urls);
    if (scraped.length) return NextResponse.json({ suggestedProducts: scraped });
  }

  const fallback: Product[] = [
    { id: "p1", title: "Best Seller 1", description: "Add manual product URL/image in next step.", url: storeUrl },
    { id: "p2", title: "Best Seller 2", description: "Add manual product URL/image in next step.", url: storeUrl },
    { id: "p3", title: "Best Seller 3", description: "Add manual product URL/image in next step.", url: storeUrl }
  ];
  return NextResponse.json({ suggestedProducts: fallback });
}
