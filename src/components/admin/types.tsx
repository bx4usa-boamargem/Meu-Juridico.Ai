export interface McTheme {
  bg: string;
  card: string;
  border: string;
  accent: string;
  green: string;
  text: string;
  muted: string;
}

export const MODEL_COLORS: Record<string, string> = {
  "google/gemini-3-flash-preview": "#FBBF24",
  "google/gemini-2.5-flash": "#FBBF24",
  "openai/gpt-5": "#06C270",
  "openai/gpt-5-mini": "#06C270",
  "google/gemini-2.5-pro": "#3B82F6",
  default: "#8B5CF6",
};

export function getModelColor(model: string) {
  return MODEL_COLORS[model] || MODEL_COLORS.default;
}

export function getModelShortName(model: string) {
  const map: Record<string, string> = {
    "google/gemini-3-flash-preview": "Gemini Flash",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "google/gemini-2.5-pro": "Gemini Pro",
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-mini": "GPT-5 Mini",
  };
  return map[model] || model.split("/").pop() || model;
}

export function getProviderFromModel(model: string): string {
  if (model.startsWith("google/")) return "google";
  if (model.startsWith("openai/")) return "openai";
  if (model.startsWith("anthropic/")) return "anthropic";
  return "other";
}

export function LiveBadge({ mc }: { mc: McTheme }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: mc.green }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: mc.green }} />
      </span>
      <span style={{ color: mc.green }}>LIVE</span>
    </span>
  );
}

export function formatBrl(usd: number): string {
  return `R$ ${(usd * 5.8).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
