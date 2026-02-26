import OpenAI from "openai";
export function deepSeekClient() {
  const baseURL = process.env.ARK_BASE_URL;
  const apiKey = process.env.ARK_API_KEY;
  if (!baseURL || !apiKey) throw new Error("ARK_BASE_URL/ARK_API_KEY missing");
  return new OpenAI({ baseURL, apiKey });
}
export async function deepSeekChat(messages: {role:"system"|"user"|"assistant"; content:string}[], opts?: {temperature?: number}) {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v3-1-250821";
  const client = deepSeekClient();
  const completion = await client.chat.completions.create({ model, messages, temperature: opts?.temperature ?? 0.6 });
  return { text: completion.choices[0]?.message?.content ?? "", usage: completion.usage ?? null };
}
