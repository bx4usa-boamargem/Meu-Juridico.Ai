import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentAutoSave(docId: string | undefined, dados: Record<string, any>) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  const save = useCallback(async () => {
    if (!docId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ dados_estruturados: dados as any, updated_at: new Date().toISOString() })
        .eq("id", docId);
      if (!error) setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  }, [docId, dados]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, 500);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [dados, save]);

  return { saving, lastSaved, saveNow: save };
}
