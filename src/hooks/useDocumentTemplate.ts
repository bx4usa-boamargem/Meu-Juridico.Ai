import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSectionsForType, type SectionDef } from "@/lib/document-sections";

interface DBTemplateRow {
  section_id: string;
  title: string;
  order_index: number;
  required: boolean;
  instructions: string | null;
  agent: string | null;
  skill: string | null;
}

interface TemplateSectionPlan {
  section_id: string;
  title: string;
  order_index: number;
  required: boolean;
  instructions: string;
  fields?: any[];
}

/** Convert DB rows (new per-row format) into SectionDef[] for the wizard */
function convertDBRows(rows: DBTemplateRow[]): SectionDef[] {
  return [...rows]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((s) => ({
      id: s.section_id,
      label: s.title,
      required: s.required ?? true,
      unlocksNext: s.required ?? true,
      fields: [
        {
          key: s.section_id,
          label: s.title,
          type: "textarea" as const,
          required: s.required ?? true,
          colspan: 2,
          maxLength: 5000,
          showGerarTexto: true,
          contextoSecao: s.instructions ?? undefined,
        },
      ],
    }));
}

/** Convert legacy sections_plan JSONB into SectionDef[] */
function convertSectionsPlan(plan: TemplateSectionPlan[]): SectionDef[] {
  return [...plan]
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      id: s.section_id,
      label: s.title,
      required: s.required ?? true,
      unlocksNext: s.required ?? true,
      fields: s.fields ?? [
        {
          key: s.section_id,
          label: s.title,
          type: "textarea" as const,
          required: s.required ?? true,
          colspan: 2,
          maxLength: 5000,
        },
      ],
    }));
}

// Types with rich hardcoded field definitions (radio_cards, team_list, AI buttons)
const HARDCODED_TYPES = new Set(["dfd", "etp", "tr"]);

export function useDocumentTemplate(docType: string | null | undefined) {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["document_template_sections", docType],
    queryFn: async () => {
      if (!docType) return [];

      const normalizedType = docType.toLowerCase();

      // 1. Try loading per-row sections from DB (new format with section_id column)
      const { data: dbRows, error: rowsError } = await supabase
        .from("document_templates")
        .select("section_id, title, order_index, required, instructions, agent, skill")
        .eq("doc_type", normalizedType)
        .not("section_id", "is", null)
        .order("order_index");

      if (!rowsError && dbRows && dbRows.length > 0) {
        // For known types with rich UI, keep hardcoded sections but enrich with DB metadata
        if (HARDCODED_TYPES.has(normalizedType)) {
          return getSectionsForType(normalizedType);
        }
        // For other types, build sections from DB rows
        return convertDBRows(dbRows as DBTemplateRow[]);
      }

      // 2. Fallback: try legacy sections_plan JSONB
      const { data, error } = await supabase
        .from("document_templates")
        .select("sections_plan")
        .eq("doc_type", normalizedType)
        .maybeSingle();

      if (!error && data?.sections_plan) {
        const plan = data.sections_plan as unknown as TemplateSectionPlan[];
        if (Array.isArray(plan) && plan.length > 0) {
          return convertSectionsPlan(plan);
        }
      }

      // 3. Final fallback: hardcoded
      return getSectionsForType(normalizedType);
    },
    enabled: !!docType,
  });

  return { sections: sections ?? [], loading: isLoading };
}
