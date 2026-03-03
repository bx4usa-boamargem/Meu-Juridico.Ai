import { useRef, useCallback, useEffect, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Table, Minus, Undo2, Redo2, Type, Palette, Highlighter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiContextMenu, type AiAction } from "./AiContextMenu";
import { AiRewriteDialog } from "./AiRewriteDialog";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  processoContext?: { objeto?: string; orgao?: string; modalidade?: string; numero_processo?: string };
  documentType?: string;
  sectionType?: string;
  dadosEstruturados?: Record<string, any>;
  otherSections?: { field: string; value: string }[];
  documentoId?: string;
}

const FONTS = [
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
];

const FONT_SIZES = [
  { value: "1", label: "10px" },
  { value: "2", label: "12px" },
  { value: "3", label: "14px" },
  { value: "4", label: "16px" },
  { value: "5", label: "18px" },
  { value: "6", label: "20px" },
  { value: "7", label: "24px" },
];

const LINE_SPACINGS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
];

const TEXT_COLORS = [
  { label: "Preto", value: "#1a1a1a" },
  { label: "Cinza escuro", value: "#444444" },
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

type ToolbarAction = {
  command: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
};

const FORMAT_ACTIONS: ToolbarAction[] = [
  { command: "bold", icon: Bold, label: "Negrito" },
  { command: "italic", icon: Italic, label: "Itálico" },
  { command: "underline", icon: Underline, label: "Sublinhado" },
  { command: "strikeThrough", icon: Strikethrough, label: "Tachado" },
];

const ALIGN_ACTIONS: ToolbarAction[] = [
  { command: "justifyLeft", icon: AlignLeft, label: "Esquerda" },
  { command: "justifyCenter", icon: AlignCenter, label: "Centro" },
  { command: "justifyRight", icon: AlignRight, label: "Direita" },
  { command: "justifyFull", icon: AlignJustify, label: "Justificado" },
];

const LIST_ACTIONS: ToolbarAction[] = [
  { command: "insertUnorderedList", icon: List, label: "Lista" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Lista numerada" },
];

function ToolBtn({ action, onExec }: { action: ToolbarAction; onExec: (cmd: string, val?: string) => void }) {
  const Icon = action.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onMouseDown={(e) => { e.preventDefault(); onExec(action.command, action.value); }}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">{action.label}</TooltipContent>
    </Tooltip>
  );
}

export function RichTextEditor({
  value, onChange, className,
  processoContext, documentType, sectionType,
  dadosEstruturados, otherSections, documentoId,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [lineSpacing, setLineSpacing] = useState("1.5");

  // AI context menu state
  const [aiMenuPos, setAiMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // AI rewrite dialog state
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteAction, setRewriteAction] = useState<AiAction>("melhorar");

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    emitChange();
  }, []);

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handleFontChange = useCallback((font: string) => {
    document.execCommand("fontName", false, font);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const handleSizeChange = useCallback((size: string) => {
    document.execCommand("fontSize", false, size);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const handleHeading = useCallback((tag: string) => {
    document.execCommand("formatBlock", false, `<${tag}>`);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const handleLineSpacing = useCallback((spacing: string) => {
    setLineSpacing(spacing);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = spacing;
      emitChange();
    }
  }, [emitChange]);

  const insertTable = useCallback(() => {
    const tableHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
        <thead>
          <tr>
            <th style="border:1px solid #ccc;padding:6px 10px;background:#f5f5f5;text-align:left;">Coluna 1</th>
            <th style="border:1px solid #ccc;padding:6px 10px;background:#f5f5f5;text-align:left;">Coluna 2</th>
            <th style="border:1px solid #ccc;padding:6px 10px;background:#f5f5f5;text-align:left;">Coluna 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
            <td style="border:1px solid #ccc;padding:6px 10px;">&nbsp;</td>
          </tr>
        </tbody>
      </table><p><br/></p>`;
    document.execCommand("insertHTML", false, tableHtml);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const insertPageBreak = useCallback(() => {
    const breakHtml = `<div style="page-break-before:always;border-top:2px dashed #ccc;margin:16px 0;padding-top:8px;text-align:center;color:#999;font-size:10px;">— QUEBRA DE PÁGINA —</div>`;
    document.execCommand("insertHTML", false, breakHtml);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const insertToken = useCallback((token: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertText", false, `{{${token}}}`);
    isInternalChange.current = true;
    onChange(editor.innerHTML);
  }, [onChange]);

  // Handle text selection for AI menu
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current) {
        setAiMenuPos(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 10) {
        setAiMenuPos(null);
        return;
      }

      // Check selection is inside editor
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setAiMenuPos(null);
        return;
      }

      // Save selection and show menu
      savedSelectionRef.current = range.cloneRange();
      setSelectedText(text);

      const rect = range.getBoundingClientRect();
      setAiMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 240),
      });
    }, 50);
  }, []);

  const handleAiAction = useCallback((action: AiAction) => {
    setRewriteAction(action);
    setRewriteOpen(true);
  }, []);

  const handleApplyRewrite = useCallback((rewrittenText: string) => {
    const editor = editorRef.current;
    if (!editor || !savedSelectionRef.current) return;

    // Restore saved selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }

    // Replace selected text
    document.execCommand("insertText", false, rewrittenText);
    savedSelectionRef.current = null;
    isInternalChange.current = true;
    onChange(editor.innerHTML);
  }, [onChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1">
          {/* Font Family */}
          <Select defaultValue="Times New Roman" onValueChange={handleFontChange}>
            <SelectTrigger className="h-7 w-[130px] text-[11px] border-0 bg-transparent focus:ring-0 px-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select defaultValue="3" onValueChange={handleSizeChange}>
            <SelectTrigger className="h-7 w-[65px] text-[11px] border-0 bg-transparent focus:ring-0 px-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Format */}
          {FORMAT_ACTIONS.map((a) => <ToolBtn key={a.command} action={a} onExec={execCommand} />)}

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Alignment */}
          {ALIGN_ACTIONS.map((a) => <ToolBtn key={a.command} action={a} onExec={execCommand} />)}

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Headings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); handleHeading("h1"); }}>
                <Heading1 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Título 1</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); handleHeading("h2"); }}>
                <Heading2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Título 2</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); handleHeading("h3"); }}>
                <Heading3 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Título 3</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] font-bold"
                onMouseDown={(e) => { e.preventDefault(); handleHeading("p"); }}>
                <Type className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Parágrafo</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Lists */}
          {LIST_ACTIONS.map((a) => <ToolBtn key={a.command} action={a} onExec={execCommand} />)}

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Line Spacing */}
          <Select value={lineSpacing} onValueChange={handleLineSpacing}>
            <SelectTrigger className="h-7 w-[55px] text-[11px] border-0 bg-transparent focus:ring-0 px-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_SPACINGS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Table */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); insertTable(); }}>
                <Table className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Inserir tabela</TooltipContent>
          </Tooltip>

          {/* Page Break */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); insertPageBreak(); }}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Quebra de página</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Undo / Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); execCommand("undo"); }}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Desfazer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                onMouseDown={(e) => { e.preventDefault(); execCommand("redo"); }}>
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Refazer</TooltipContent>
          </Tooltip>
        </div>

        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[300px] p-6 text-sm text-foreground outline-none prose prose-sm max-w-none
            [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:uppercase
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:uppercase
            [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2
            [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold [&_th]:text-left"
          style={{ lineHeight: lineSpacing, fontFamily: "'Times New Roman', serif" }}
          onInput={handleInput}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* AI Context Menu (floating) */}
      {aiMenuPos && (
        <AiContextMenu
          position={aiMenuPos}
          onAction={handleAiAction}
          onClose={() => setAiMenuPos(null)}
        />
      )}

      {/* AI Rewrite Dialog */}
      <AiRewriteDialog
        open={rewriteOpen}
        onOpenChange={setRewriteOpen}
        action={rewriteAction}
        selectedText={selectedText}
        sectionType={sectionType}
        documentType={documentType}
        processoContext={processoContext}
        dadosEstruturados={dadosEstruturados}
        otherSections={otherSections}
        documentoId={documentoId}
        onApply={handleApplyRewrite}
      />
    </TooltipProvider>
  );
}

RichTextEditor.displayName = "RichTextEditor";
