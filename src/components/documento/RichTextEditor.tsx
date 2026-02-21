import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, Underline, List, Heading2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

const TOOLBAR_ACTIONS = [
  { command: "bold", icon: Bold, label: "Negrito" },
  { command: "italic", icon: Italic, label: "Itálico" },
  { command: "underline", icon: Underline, label: "Sublinhado" },
  { command: "insertUnorderedList", icon: List, label: "Lista" },
] as const;

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value only on first render or when value changes externally
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  }, []);

  const handleHeading = useCallback(() => {
    document.execCommand("formatBlock", false, "<h2>");
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertToken = useCallback((token: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = document.createTextNode(`{{${token}}}`);
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand("insertText", false, `{{${token}}}`);
    }
    isInternalChange.current = true;
    onChange(editor.innerHTML);
  }, [onChange]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1">
        {TOOLBAR_ACTIONS.map(({ command, icon: Icon, label }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(command);
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title="Título"
          onMouseDown={(e) => {
            e.preventDefault();
            handleHeading();
          }}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[300px] p-4 text-sm text-foreground outline-none prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        onInput={handleInput}
      />
    </div>
  );
}

// Expose insertToken via ref-like pattern
RichTextEditor.displayName = "RichTextEditor";
