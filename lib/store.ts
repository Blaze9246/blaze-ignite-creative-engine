import { create } from "zustand";
import type { CampaignInputs, CampaignOutput, Product } from "@/lib/types";
type State = {
  step: 1|2|3|4;
  inputs: CampaignInputs;
  suggestedProducts: Product[];
  selectedProductIds: string[];
  output?: CampaignOutput;
  isAnalyzing: boolean;
  isGenerating: boolean;
  error?: string;
  setStep: (s: State["step"]) => void;
  patchInputs: (p: Partial<CampaignInputs>) => void;
  setSuggestedProducts: (p: Product[]) => void;
  toggleProduct: (id: string) => void;
  setSelectedProductIds: (ids: string[]) => void;
  setOutput: (o?: CampaignOutput) => void;
  setFlags: (p: Partial<Pick<State,"isAnalyzing"|"isGenerating"|"error">>) => void;
};
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const useEngine = create<State>((set, get) => ({
  step: 1,
  inputs: {
    country: "South Africa",
    month: months[new Date().getMonth()],
    theme: "",
    goalPreset: "DRIVE_COLD_SALES",
    goalOther: "",
    promotion: { type: "PERCENT", value: 10, currency: "ZAR" },
    storeUrl: "",
    maxProducts: 2,
    imageProvider: "nanobanana2",
    includeUGC: true,
    includePROMO: true
  },
  suggestedProducts: [],
  selectedProductIds: [],
  output: undefined,
  isAnalyzing: false,
  isGenerating: false,
  error: undefined,
  setStep: (step) => set({ step }),
  patchInputs: (p) => set({ inputs: { ...get().inputs, ...p } }),
  setSuggestedProducts: (suggestedProducts) => set({ suggestedProducts }),
  toggleProduct: (id) => {
    const cur = new Set(get().selectedProductIds);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    set({ selectedProductIds: Array.from(cur) });
  },
  setSelectedProductIds: (ids) => set({ selectedProductIds: ids }),
  setOutput: (output) => set({ output }),
  setFlags: (p) => set({ ...p })
}));
