export const SYSTEM = `You are Blaze Ignite Internal Creative Engine.
Output STRICT JSON only. No markdown. No commentary.

Hard rules:
- Hooks adapt to country culture without cringe slang.
- No prohibited medical claims.
- Prompts must be valid for 9:16 premium ad images, 2K output.
`;

export const STEP1 = `Return JSON: { platform_guess, currency_guess, categories_guess[], notes, product_url_candidates[] (max 30) }.`;
export const STEP2 = `Return JSON: { suggested_promotions[3], products[] }.
products[] items: { id,title,url,description,image,price,currency,score,reason }.`;
export const STEP3 = `Return JSON: { mappings[] }.
mappings[] items: { product_id, blocks[] } where blocks[] includes all selected architectures codes.
Architectures fixed: MONUMENTAL,LUXURY,ORBIT,SURREAL,IDENTITY,CORPORATE,WEALTH,MYTHIC plus optional UGC/PROMO depending on flags.`;
export const STEP4 = `Return JSON: { creative_blocks[], google_pmax_pack } with exact fields:
creative_blocks[] items: { id, code, name, rationale, selected_product_id, hook, static_prompt, image_angle_prompts[], motion{recommended,duration_s,kling_prompt,music_style,sound_design}, facebook_copy{primary_text,headlines[3]} }.
google_pmax_pack: { headlines_30(6+), headlines_60(6+), headlines_90(6+), descriptions(3+), search_terms(10+), pro_tips(3+) }.`;

export function step1StoreIntelPrompt(input: any) { return `STEP1_STORE_INTEL. ${STEP1} Input: ${JSON.stringify(input)}`; }
export function step2ProductPicksPrompt(input: any) { return `STEP2_PRODUCT_PICKS. ${STEP2} Input: ${JSON.stringify(input)}`; }
export function step3ArchitectureMapPrompt(input: any) { return `STEP3_ARCH_MAP. ${STEP3} Input: ${JSON.stringify(input)}`; }
export function step4GenerateBlocksPrompt(input: any) { return `STEP4_GENERATE_BLOCKS. ${STEP4} Input: ${JSON.stringify(input)}`; }
