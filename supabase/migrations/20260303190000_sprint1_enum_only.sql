-- ============================================================
-- SPRINT 1 — MIGRATION 1/3: EXPANDIR ENUM (separada)
-- PostgreSQL exige que ALTER TYPE esteja em transação própria
-- ============================================================
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'projeto_basico';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'mapa_risco';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'custom';
