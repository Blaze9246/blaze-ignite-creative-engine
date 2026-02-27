"use client";
import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { useEngine } from "@/lib/store";
import type { GoalPreset, PromoType, ImageProvider } from "@/lib/types";
import { Panel, Field, Input, Select, Button, Pill, Toggle } from "@/components/ui";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const goals: { value: GoalPreset; label: string }[] = [
  { value: "DRIVE_COLD_SALES", label: "Drive cold sales (TOFU)" },
  { value: "LAUNCH_NEW_PRODUCT", label: "Launch a new product" },
  { value: "INCREASE_AOV", label: "Increase AOV" },
  { value: "CLEAR_STOCK", label: "Clear slow-moving stock" },
  { value: "DRIVE_BUNDLES", label: "Drive bundles" },
  { value: "IMPROVE_CONVERSION", label: "Improve conversion rate" },
  { value: "INCREASE_REPEAT", label: "Increase repeat purchases" },
  { value: "SEASONAL_PROMO", label: "Seasonal promotion" },
  { value: "OTHER", label: "Other…" }
];

const promoTypes: { value: PromoType; label: string }[] = [
  { value: "PERCENT", label: "Percentage Off" },
  { value: "FIXED", label: "Fixed Amount Off" },
  { value: "BOGO", label: "Buy One Get One" },
  { value: "FREE_SHIPPING", label: "Free Shipping" },
  { value: "BUNDLE", label: "Bundle Offer" },
  { value: "CUSTOM_TEXT", label: "Custom Text" }
];

const providers: { value: ImageProvider; label: string }[] = [
  { value: "seedream", label: "Seedream 4.5" }
];

export default function Page() {
  const {
    step, setStep, inputs, patchInputs,
    suggestedProducts, setSuggestedProducts,
    selectedProductIds, toggleProduct, setSelectedProductIds,
    output, setOutput,
    isAnalyzing, isGenerating, setFlags, error
  } = useEngine();

  const selectedProducts = useMemo(
    () => suggestedProducts.filter(p => selectedProductIds.includes(p.id)),
    [suggestedProducts, selectedProductIds]
  );

  const estImages = useMemo(() => {
    const base = 8 + (inputs.includeUGC ? 1 : 0) + (inputs.includePROMO ? 1 : 0);
    return Math.max(1, selectedProducts.length) * base;
  }, [selectedProducts.length, inputs.includeUGC, inputs.includePROMO]);

  async function analyzeStore() {
    setFlags({ isAnalyzing: true, error: undefined });
    setOutput(undefined);
    try {
      const res = await fetch("/api/analyze-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: inputs.storeUrl, country: inputs.country })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSuggestedProducts(data.suggestedProducts || []);
      setSelectedProductIds((data.suggestedProducts || []).slice(0, inputs.maxProducts).map((p: any) => p.id));
      setStep(2);
    } catch (e: any) {
      setFlags({ error: e?.message || "Failed to analyze store." });
    } finally {
      setFlags({ isAnalyzing: false });
    }
  }

  async function generateCampaign() {
    setFlags({ isGenerating: true, error: undefined });
    setOutput(undefined);
    try {
      const res = await fetch("/api/brain/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, products: suggestedProducts, selectedProductIds })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOutput(data);
      setStep(4);
    } catch (e: any) {
      setFlags({ error: e?.message || "Failed to generate campaign." });
    } finally {
      setFlags({ isGenerating: false });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blaze-panel2 grid place-items-center border border-blaze-line">
            <span className="text-blaze-accent text-lg">⚡</span>
          </div>
          <div>
            <div className="text-lg font-semibold">BLAZE IGNITE</div>
            <div className="text-xs text-blaze-muted">CREATIVE ENGINE v0.2</div>
          </div>
        </div>
        <div className="flex items-center gap-2"><Pill>STEP {step}/4</Pill></div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-6 pb-10">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Panel title="Campaign Inputs">
            <div className="space-y-4">
              <Field label="Country / Market">
                <Select value={inputs.country} onChange={(e) => patchInputs({ country: e.target.value })}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>

              <Field label="Month">
                <Select value={inputs.month} onChange={(e) => patchInputs({ month: e.target.value })}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>

              <Field label="Theme (optional)" hint="e.g. Mother's Day">
                <Input value={inputs.theme} onChange={(e) => patchInputs({ theme: e.target.value })} placeholder="Mother's Day" />
              </Field>

              <Field label="Goal">
                <Select value={inputs.goalPreset} onChange={(e) => patchInputs({ goalPreset: e.target.value as any })}>
                  {goals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
              </Field>
              {inputs.goalPreset === "OTHER" ? (
                <Field label="Goal (Other)"><Input value={inputs.goalOther || ""} onChange={(e) => patchInputs({ goalOther: e.target.value })} placeholder="Type your goal…" /></Field>
              ) : null}

              <Panel title="Promotion Builder">
                <div className="space-y-3">
                  <Field label="Promotion type">
                    <Select value={inputs.promotion.type} onChange={(e) => patchInputs({ promotion: { ...inputs.promotion, type: e.target.value as PromoType } })}>
                      {promoTypes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </Select>
                  </Field>

                  {(inputs.promotion.type === "PERCENT" || inputs.promotion.type === "FIXED") ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Value"><Input type="number" value={inputs.promotion.value ?? 10} onChange={(e) => patchInputs({ promotion: { ...inputs.promotion, value: Number(e.target.value || 0) } })} /></Field>
                      <Field label="Currency" hint="optional"><Input value={inputs.promotion.currency ?? "ZAR"} onChange={(e) => patchInputs({ promotion: { ...inputs.promotion, currency: e.target.value } })} /></Field>
                    </div>
                  ) : null}

                  {(inputs.promotion.type === "CUSTOM_TEXT" || inputs.promotion.type === "BOGO" || inputs.promotion.type === "BUNDLE" || inputs.promotion.type === "FREE_SHIPPING") ? (
                    <Field label="Promotion text">
                      <Input value={inputs.promotion.text ?? ""} onChange={(e) => patchInputs({ promotion: { ...inputs.promotion, text: e.target.value } })} placeholder='e.g. Buy 1 Get 1 Free / Free shipping over R799' />
                    </Field>
                  ) : null}

                  <div className="text-xs text-blaze-muted">The brain will also suggest promotions based on store + goal.</div>
                </div>
              </Panel>

              <Panel title="Engine Controls">
                <div className="space-y-3">
                  <Field label="Max products (cost control)" hint="2 / 3 / 5">
                    <Select value={String(inputs.maxProducts)} onChange={(e) => patchInputs({ maxProducts: Number(e.target.value) as any })}>
                      {[2,3,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </Field>

                  <Field label="Image Provider"><Select value={inputs.imageProvider} onChange={(e) => patchInputs({ imageProvider: e.target.value as ImageProvider })}>
                    {providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </Select></Field>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blaze-muted">Include UGC block</div>
                    <Toggle checked={inputs.includeUGC} onChange={(v) => patchInputs({ includeUGC: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blaze-muted">Include PROMO block</div>
                    <Toggle checked={inputs.includePROMO} onChange={(v) => patchInputs({ includePROMO: v })} />
                  </div>

                  <div className="text-xs text-blaze-muted">Estimated images this run: <span className="text-blaze-text">{estImages}</span></div>
                </div>
              </Panel>

              <Field label="Store URL" hint="required"><Input value={inputs.storeUrl} onChange={(e) => patchInputs({ storeUrl: e.target.value })} placeholder="https://brand.com" /></Field>

              <div className="flex gap-3">
                <Button onClick={analyzeStore} disabled={!inputs.storeUrl || isAnalyzing}>{isAnalyzing ? "Analyzing…" : "Analyze Store"}</Button>
                <Button variant="ghost" onClick={() => { setStep(1); setOutput(undefined); }} disabled={isAnalyzing || isGenerating}>Reset</Button>
              </div>
              {error ? <div className="text-sm text-blaze-danger">{error}</div> : null}
            </div>
          </Panel>

          {step >= 2 ? (
            <Panel title="Products">
              <div className="text-xs text-blaze-muted mb-3">Select up to {inputs.maxProducts} products. Add manual product if needed.</div>
              
              {/* Manual Product Add */}
              <ManualProductAdd onAdd={(product) => {
                setSuggestedProducts([...suggestedProducts, product]);
                toggleProduct(product.id);
              }} />
              
              <div className="space-y-3 max-h-[360px] overflow-auto pr-1 mt-4">
                {suggestedProducts.map((p) => {
                  const checked = selectedProductIds.includes(p.id);
                  const disabled = !checked && selectedProductIds.length >= inputs.maxProducts;
                  return (
                    <button key={p.id} onClick={() => !disabled && toggleProduct(p.id)}
                      className={"w-full text-left rounded-xl border px-4 py-3 transition " + (checked ? "border-blaze-accent bg-white/5" : "border-blaze-line bg-blaze-panel2 hover:bg-white/5") + (disabled ? " opacity-50 cursor-not-allowed" : "")}
                      disabled={disabled}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-sm">{p.title}</div>
                        <Pill>{checked ? "SELECTED" : disabled ? "LIMIT" : "ADD"}</Pill>
                      </div>
                      {p.image ? (
                        <div className="mt-2">
                          <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                        </div>
                      ) : null}
                      {p.description ? <div className="text-xs text-blaze-muted mt-1 line-clamp-2">{p.description}</div> : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Pill>SELECTED: {selectedProductIds.length}</Pill>
                <Button onClick={() => setStep(3)} variant="ghost" disabled={selectedProductIds.length === 0}>Next</Button>
              </div>
            </Panel>
          ) : null}

          {step >= 3 ? (
            <Panel title="Generate">
              <div className="text-sm text-blaze-muted">Generates architecture prompts + hooks + FB copy + motion suggestions + Google PMax.</div>
              <div className="mt-4 flex gap-3">
                <Button onClick={generateCampaign} disabled={isGenerating || selectedProductIds.length === 0}>{isGenerating ? "Generating…" : "Generate Campaign"}</Button>
                <Button variant="ghost" onClick={() => setStep(2)} disabled={isGenerating}>Back</Button>
              </div>
            </Panel>
          ) : null}
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Panel title="Output">
            {step < 4 ? (
              <div className="h-[520px] grid place-items-center text-center">
                <div className="space-y-3">
                  <div className="mx-auto h-24 w-24 rounded-full border border-blaze-line grid place-items-center bg-blaze-panel2"><span className="text-3xl text-blaze-accent">⚡</span></div>
                  <div className="text-lg font-semibold">READY</div>
                  <div className="text-sm text-blaze-muted">Analyze store → select products → generate campaign.</div>
                </div>
              </div>
            ) : (<OutputView />)}
          </Panel>
        </div>
      </main>
    </div>
  );
}

function OutputView() {
  const { output } = useEngine();
  const [imgByBlock, setImgByBlock] = useState<Record<string, { src: string; url?: string | null }>>({});
  const [busyByBlock, setBusyByBlock] = useState<Record<string, boolean>>({});

  if (!output) return <div className="text-sm text-blaze-muted">No output yet.</div>;

  function productImageFor(productId: string) {
    const p = output!.products.find((x) => x.id === productId);
    return p?.image || undefined;
  }

  async function generate(blockId: string, prompt: string, productId: string) {
    try {
      setBusyByBlock((s) => ({ ...s, [blockId]: true }));
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: output!.campaign_id,
          block_id: blockId,
          provider: output!.inputs.imageProvider,
          prompt,
          reference_image_url: productImageFor(productId),
          aspect_ratio: "9:16",
          image_size: "2K"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Image generation failed");
      const src = data.image_url
        ? data.image_url
        : `data:${data.mime};base64,${data.image_b64}`;
      setImgByBlock((s) => ({ ...s, [blockId]: { src, url: data.image_url } }));
    } catch (e: any) {
      alert(e?.message || "Failed to generate image.");
    } finally {
      setBusyByBlock((s) => ({ ...s, [blockId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Pill>COUNTRY: {output.inputs.country}</Pill>
        <Pill>MONTH: {output.inputs.month}</Pill>
        {output.inputs.theme ? <Pill>THEME: {output.inputs.theme}</Pill> : null}
        <Pill>EST COST: ${output.cost_estimate_usd.toFixed(2)}</Pill>
        <Pill>ACTUAL COST: ${output.cost_actual_usd.toFixed(2)}</Pill>
      </div>

      <div className="space-y-4">
        <div className="text-sm tracking-widest text-blaze-muted">CREATIVE BLOCKS</div>
        <div className="grid grid-cols-1 gap-4">
          {output.creative_blocks.map((b) => {
            const img = imgByBlock[b.id];
            const busy = !!busyByBlock[b.id];
            const refImg = productImageFor(b.selected_product_id);
            return (
              <div key={b.id} className="rounded-2xl border border-blaze-line bg-blaze-panel2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{b.code}: {b.name}</div>
                    <div className="text-xs text-blaze-muted mt-1">{b.rationale}</div>
                  </div>
                  <Pill>PRODUCT: {b.selected_product_id}</Pill>
                </div>

                {refImg ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blaze-muted">
                    <span>Reference image:</span>
                    <a className="underline hover:text-blaze-text" href={refImg} target="_blank" rel="noreferrer">open</a>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-blaze-muted">
                    No product image detected. For best "locked product" results, add a product image (Shopify JSON or JSON-LD scrape usually provides it).
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  {img ? (
                    <div className="rounded-2xl border border-blaze-line bg-black/20 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt="Generated creative" className="w-full rounded-xl" />
                    </div>
                  ) : null}

                  <div><div className="text-xs text-blaze-muted mb-1">HOOK</div><div className="text-sm">{b.hook}</div></div>

                  <div>
                    <div className="text-xs text-blaze-muted mb-1">IMAGE PROMPT (2K)</div>
                    <pre className="whitespace-pre-wrap text-xs rounded-xl border border-blaze-line bg-black/30 p-3">{b.static_prompt}</pre>
                  </div>

                  <div>
                    <div className="text-xs text-blaze-muted mb-1">MOTION (OPTIONAL)</div>
                    <pre className="whitespace-pre-wrap text-xs rounded-xl border border-blaze-line bg-black/30 p-3">{b.motion.kling_prompt}</pre>
                  </div>

                  <div>
                    <div className="text-xs text-blaze-muted mb-1">FACEBOOK PAS COPY</div>
                    <pre className="whitespace-pre-wrap text-xs rounded-xl border border-blaze-line bg-black/30 p-3">{b.facebook_copy.primary_text}</pre>
                    <div className="mt-2 flex flex-wrap gap-2">{b.facebook_copy.headlines.map((h, i) => <Pill key={i}>{h}</Pill>)}</div>
                  </div>

                  <details><summary className="cursor-pointer text-xs text-blaze-muted">Image angle prompts</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs rounded-xl border border-blaze-line bg-black/30 p-3">{b.image_angle_prompts.join("\n")}</pre>
                  </details>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => generate(b.id, b.static_prompt, b.selected_product_id)}
                    disabled={busy}
                    title="Generates using selected provider"
                  >
                    {busy ? "Generating…" : img ? "Regenerate" : "Generate Image"}
                  </Button>

                  {img ? (
                    <a href={img.src} download={`creative_${b.code}_${b.id}.png`}>
                      <Button variant="ghost" type="button">Download</Button>
                    </a>
                  ) : (
                    <Button variant="ghost" disabled type="button">Download</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm tracking-widest text-blaze-muted">GOOGLE PMAX PACK</div>
        <div className="rounded-2xl border border-blaze-line bg-blaze-panel2 p-5 text-xs space-y-3">
          <div><span className="text-blaze-muted">Headlines 30:</span> {output.google_pmax_pack.headlines_30.join(" | ")}</div>
          <div><span className="text-blaze-muted">Headlines 60:</span> {output.google_pmax_pack.headlines_60.join(" | ")}</div>
          <div><span className="text-blaze-muted">Headlines 90:</span> {output.google_pmax_pack.headlines_90.join(" | ")}</div>
          <div><span className="text-blaze-muted">Descriptions:</span> {output.google_pmax_pack.descriptions.join(" | ")}</div>
          <div><span className="text-blaze-muted">Search terms:</span> {output.google_pmax_pack.search_terms.join(", ")}</div>
          <div className="text-blaze-muted">Pro tips:</div>
          <ul className="list-disc ml-5">{output.google_pmax_pack.pro_tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function ManualProductAdd({ onAdd }: { onAdd: (product: any) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <Button variant="ghost" onClick={() => setShowForm(true)}>
        + Add Manual Product
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-blaze-line bg-blaze-panel2 p-3 space-y-3">
      <div className="text-sm font-medium">Add Manual Product</div>
      <Input 
        placeholder="Product Title" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <Input 
        placeholder="Product URL" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
      />
      <Input 
        placeholder="Image URL (optional)" 
        value={image} 
        onChange={(e) => setImage(e.target.value)} 
      />
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            if (title) {
              onAdd({
                id: `manual_${Date.now()}`,
                title,
                url: url || "",
                image: image || undefined,
                description: "Manual product"
              });
              setTitle("");
              setUrl("");
              setImage("");
              setShowForm(false);
            }
          }}
          disabled={!title}
        >
          Add Product
        </Button>
        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
      </div>
    </div>
  );
}
