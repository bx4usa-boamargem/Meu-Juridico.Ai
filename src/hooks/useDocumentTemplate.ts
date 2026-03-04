import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSectionsForType, type SectionDef } from "@/lib/document-sections";

interface TemplateSectionPlan {
  section_id: string;
  title: string;
  order_index: number;
  required: boolean;
  instructions: string;
  fields?: any[];
}

function convertTemplateSections(plan: TemplateSectionPlan[]): SectionDef[] {
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

export function useDocumentTemplate(docType: string | null | undefined) {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["document_template_sections", docType],
    queryFn: async () => {
      if (!docType) return [];

      // Try loading from database first
      const { data, error } = await supabase
        .from("document_templates")
        .select("sections_plan")
        .eq("doc_type", docType)
        .maybeSingle();

      if (!error && data?.sections_plan) {
        const plan = data.sections_plan as unknown as TemplateSectionPlan[];
        if (Array.isArray(plan) && plan.length > 0) {
          return convertTemplateSections(plan);
        }
      }

      // Fallback to hardcoded sections
      return getSectionsForType(docType);
    },
    enabled: !!docType,
  });

  return { sections: sections ?? [], loading: isLoading };
}
