import { useState } from "react";
import {
  Sparkles, Scale, Building2, BookOpen, GitCompareArrows,
  Bold, Italic, Underline, Strikethrough, Type, Palette, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Table, Minus, Undo2, Redo2, Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type AiAction = "melhorar" | "fundamentar" | "adequar_orgao" | "base_legal" | "diferenciar";

interface AiContextMenuProps {
  position: { top: number; left: number };
  onAction: (action: AiAction) => void;
  onClose: () => void;
  onExecCommand: (cmd: string, val?: string) => void;
  onHeading: (tag: string) => void;
  onInsertTable: () => void;
  onInsertPageBreak: () => void;
  onLineSpacing: (val: string) => void;
  currentLineSpacing: string;
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

const HIGHLIGHT_COLORS = [
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bfdbfe" },
  { label: "Rosa", value: "#fecdd3" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Nenhum", value: "transparent" },
];

const FONT_FAMILIES = [
  "Times New Roman", "Arial", "Georgia", "Verdana", "Courier New",
];

const LINE_SPACINGS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
];

export function AiContextMenu({
  position, onAction, onClose,
  onExecCommand, onHeading, onInsertTable, onInsertPageBreak,
  onLineSpacing, currentLineSpacing,
}: AiContextMenuProps) {
  const [showAi, setShowAi] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [showSpacing, setShowSpacing] = useState(false);

  const closeAllDropdowns = () => {
    setShowSizes(false);
    setShowColors(false);
    setShowHighlight(false);
    setShowFonts(false);
    setShowSpacing(false);
  };

  const exec = (cmd: string, val?: string) => {
    onExecCommand(cmd, val);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
        style={{ top: position.top, left: position.left, maxWidth: 380 }}
      >
        {/* ── Row 1: Font family + size ── */}
        <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-1">
          {/* Font Family */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5 min-w-[90px] justify-between"
              onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); setShowFonts(!showFonts); }}>
              <span className="truncate">Aa</span> <ChevronDown className="h-2.5 w-2.5 shrink-0" />
            </Button>
            {showFonts && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1 min-w-[140px]">
                {FONT_FAMILIES.map((f) => (
                  <button key={f}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted/60 transition-colors"
                    style={{ fontFamily: f }}
                    onMouseDown={(e) => { e.preventDefault(); exec("fontName", f); setShowFonts(false); }}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5"
              onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); setShowSizes(!showSizes); }}>
              <Type className="h-3 w-3" /> <ChevronDown className="h-2.5 w-2.5" />
            </Button>
            {showSizes && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1 min-w-[80px]">
                {FONT_SIZES.map((s) => (
                  <button key={s}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted/60 transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); exec("fontSize", FONT_SIZE_CMD_MAP[s]); setShowSizes(false); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          {/* Line spacing */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] gap-0.5"
              onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); setShowSpacing(!showSpacing); }}>
              {currentLineSpacing} <ChevronDown className="h-2.5 w-2.5" />
            </Button>
            {showSpacing && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1 min-w-[70px]">
                {LINE_SPACINGS.map((s) => (
                  <button key={s.value}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-muted/60 transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); onLineSpacing(s.value); setShowSpacing(false); }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Format + Color + Highlight ── */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/30">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}>
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }}>
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          {/* Text Color */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); setShowColors(!showColors); }}>
              <Palette className="h-3.5 w-3.5" />
            </Button>
            {showColors && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1.5 min-w-[120px]">
                <p className="text-[9px] font-semibold text-muted-foreground mb-1">Cor do texto</p>
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button key={c.value} title={c.label}
                      className="h-5 w-5 rounded-full border border-border/60 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value }}
                      onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c.value); setShowColors(false); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); setShowHighlight(!showHighlight); }}>
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
            {showHighlight && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 p-1.5 min-w-[120px]">
                <p className="text-[9px] font-semibold text-muted-foreground mb-1">Destaque</p>
                <div className="flex flex-wrap gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button key={c.value} title={c.label}
                      className="h-5 w-5 rounded-full border border-border/60 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value === "transparent" ? "#fff" : c.value }}
                      onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", c.value); setShowHighlight(false); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Alignment + Headings ── */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/30">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}>
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}>
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}>
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("justifyFull"); }}>
            <AlignJustify className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onHeading("h1"); }}>
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onHeading("h2"); }}>
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onHeading("h3"); }}>
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onHeading("p"); }}>
            <Type className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ── Row 4: Lists + Insert + Undo/Redo ── */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/30">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}>
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}>
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onInsertTable(); }}>
            <Table className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); onInsertPageBreak(); }}>
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("undo"); }}>
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onMouseDown={(e) => { e.preventDefault(); exec("redo"); }}>
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ── AI section (collapsible) ── */}
        <div className="p-1 border-t border-border/50">
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
