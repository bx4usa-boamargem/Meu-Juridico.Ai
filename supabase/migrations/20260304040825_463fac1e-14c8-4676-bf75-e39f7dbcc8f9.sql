ALTER TABLE documentos 
  ADD COLUMN IF NOT EXISTS section_memories jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS score_conformidade numeric(4,3);