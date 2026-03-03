import { useRef, useCallback, useEffect, useState } from "react";
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

export function RichTextEditor({
  value, onChange, className,
  processoContext, documentType, sectionType,
  dadosEstruturados, otherSections, documentoId,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [lineSpacing, setLineSpacing] = useState("1.5");

  // Floating menu state
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
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

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const handleInput = useCallback(() => {
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

  // Handle text selection for floating menu
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current) {
        setMenuPos(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setMenuPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setMenuPos(null);
        return;
      }

      savedSelectionRef.current = range.cloneRange();
      setSelectedText(text);

      const rect = range.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 400),
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

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }

    document.execCommand("insertText", false, rewrittenText);
    savedSelectionRef.current = null;
    isInternalChange.current = true;
    onChange(editor.innerHTML);
  }, [onChange]);

  return (
    <>
      <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)}>
        {/* Editable area — no top toolbar */}
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

      {/* Floating toolbar + AI menu */}
      {menuPos && (
        <AiContextMenu
          position={menuPos}
          onAction={handleAiAction}
          onClose={() => setMenuPos(null)}
          onExecCommand={execCommand}
          onHeading={handleHeading}
          onInsertTable={insertTable}
          onInsertPageBreak={insertPageBreak}
          onLineSpacing={handleLineSpacing}
          currentLineSpacing={lineSpacing}
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
    </>
  );
}

RichTextEditor.displayName = "RichTextEditor";
