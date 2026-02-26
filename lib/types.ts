export type PromoType = "PERCENT" | "FIXED" | "BOGO" | "FREE_SHIPPING" | "BUNDLE" | "CUSTOM_TEXT";
export type ImageProvider = "nanobanana2" | "nanobananaPro" | "seedream";
export type GoalPreset =
  | "DRIVE_COLD_SALES" | "LAUNCH_NEW_PRODUCT" | "INCREASE_AOV" | "CLEAR_STOCK"
  | "DRIVE_BUNDLES" | "IMPROVE_CONVERSION" | "INCREASE_REPEAT" | "SEASONAL_PROMO" | "OTHER";

export type Promotion = { type: PromoType; value?: number; currency?: string; text?: string; };

export type Product = { id: string; title: string; url?: string; price?: number; currency?: string; image?: string; description?: string; tags?: string[]; };

export type CampaignInputs = {
  country: string; month: string; theme: string;
  goalPreset: GoalPreset; goalOther?: string;
  promotion: Promotion; storeUrl: string;
  maxProducts: 2 | 3 | 5;
  imageProvider: ImageProvider;
  includeUGC: boolean;
  includePROMO: boolean;
};

export type MotionObject = { recommended: boolean; duration_s: number; kling_prompt: string; music_style: string; sound_design: string; };

export type CreativeBlock = {
  id: string; code: string; name: string; rationale: string;
  selected_product_id: string; hook: string; static_prompt: string; image_angle_prompts: string[];
  motion: MotionObject;
  facebook_copy: { primary_text: string; headlines: string[] };
  generated_image_url?: string | null; generated_at?: string | null; actual_cost_usd?: number | null;
};

export type GooglePMaxPack = {
  headlines_30: string[]; headlines_60: string[]; headlines_90: string[];
  descriptions: string[]; search_terms: string[]; pro_tips: string[];
};

export type CampaignOutput = {
  campaign_id: string; inputs: CampaignInputs;
  products: Product[]; selected_products: Product[];
  creative_blocks: CreativeBlock[];
  google_pmax_pack: GooglePMaxPack;
  cost_estimate_usd: number; cost_actual_usd: number;
};
