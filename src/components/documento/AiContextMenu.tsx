import { useState } from "react";
import {
  Sparkles, Scale, Building2, BookOpen, GitCompareArrows,
  Bold, Italic, Underline, Type, Palette, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type AiAction = "melhorar" | "fundamentar" | "adequar_orgao" | "base_legal" | "diferenciar";

interface AiContextMenuProps {
  position: { top: number; left: number };
  onAction: (action: AiAction) => void;
  onClose: () => void;
}

const AI_ACTIONS: { action: AiAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { action: "melhorar", label: "Melhorar redação", icon: Sparkles },
  { action: "fundamentar", label: "Fundamentar juridicamente", icon: Scale },
  { action: "adequar_orgao", label: "Adequar ao órgão", icon: Building2 },
  { action: "base_legal", label: "Inserir base legal", icon: BookOpen },
  { action: "diferenciar", label: "Diferenciar da seção anterior", icon: GitCompareArrows },
];

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px"];
const FONT_SIZE_CMD_MAP: Record<string, string> = {
  "10px": "1", "12px": "2", "14px": "3", "16px": "4", "18px": "5", "20px": "6", "24px": "7",
};

const TEXT_COLORS = [
  { label: "Preto", value: "#1a1a1a" },
  { label: "Cinza", value: "#666666" },
  { label: "Azul", value: "#1e40af" },
  { label: "Vermelho", value: "#dc2626" },
  { label: "Verde", value: "#16a34a" },
  { label: "Laranja", value: "#ea580c" },
  { label: "Roxo", value: "#7c3aed" },
];

const FONT_FAMILIES = [
  "Times New Roman", "Arial", "Georgia", "Verdana", "Courier New",
];

function execCmd(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

export function AiContextMenu({ position, onAction, onClose }: AiContextMenuProps) {
  const [showAi, setShowAi] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showFonts, setShowFonts] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Menu */}
      <div
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
        style={{ top: position.top, left: position.left, minWidth: 240 }}
      >
        {/* ── Formatting row ── */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/50">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}>
            <Underline className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Font size dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5"
              onMouseDown={(e) => { e.preventDefault(); setShowSizes(!showSizes); setShowColors(false); setShowFonts(false); }}>
              <Type className="h-3 w-3" /> <ChevronDown className="h-2.5 w-2.5" />
            </Button>
            {showSizes && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1 min-w-[80px]">
                {FONT_SIZES.map((s) => (
                  <button key={s}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted/60 transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); execCmd("fontSize", FONT_SIZE_CMD_MAP[s]); setShowSizes(false); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5"
              onMouseDown={(e) => { e.preventDefault(); setShowColors(!showColors); setShowSizes(false); setShowFonts(false); }}>
              <Palette className="h-3 w-3" /> <ChevronDown className="h-2.5 w-2.5" />
            </Button>
            {showColors && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1.5 min-w-[120px]">
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button key={c.value} title={c.label}
                      className="h-5 w-5 rounded-full border border-border/60 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value }}
                      onMouseDown={(e) => { e.preventDefault(); execCmd("foreColor", c.value); setShowColors(false); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Font family dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5"
              onMouseDown={(e) => { e.preventDefault(); setShowFonts(!showFonts); setShowSizes(false); setShowColors(false); }}>
              Aa <ChevronDown className="h-2.5 w-2.5" />
            </Button>
            {showFonts && (
              <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1 min-w-[140px]">
                {FONT_FAMILIES.map((f) => (
                  <button key={f}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted/60 transition-colors"
                    style={{ fontFamily: f }}
                    onMouseDown={(e) => { e.preventDefault(); execCmd("fontName", f); setShowFonts(false); }}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── AI section (collapsible) ── */}
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-7 text-[10px] gap-1.5 font-semibold text-primary"
            onClick={() => setShowAi(!showAi)}
          >
            <Sparkles className="h-3 w-3" />
            IA Contextual
            <ChevronDown className={`h-2.5 w-2.5 ml-auto transition-transform ${showAi ? "rotate-180" : ""}`} />
          </Button>

          {showAi && (
            <div className="mt-0.5">
              {AI_ACTIONS.map(({ action, label, icon: Icon }) => (
                <Button
                  key={action}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs gap-2 font-normal"
                  onClick={() => { onAction(action); onClose(); }}
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
