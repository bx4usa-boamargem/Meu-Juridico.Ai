
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS section_id text;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS agent text;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS skill text;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS order_index integer;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS required boolean DEFAULT false;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS instructions text;

ALTER TABLE public.document_templates DROP CONSTRAINT IF EXISTS document_templates_doc_type_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'document_templates_doc_type_section_id_key'
    ) THEN
        ALTER TABLE public.document_templates ADD CONSTRAINT document_templates_doc_type_section_id_key UNIQUE (doc_type, section_id);
    END IF;
END $$;
