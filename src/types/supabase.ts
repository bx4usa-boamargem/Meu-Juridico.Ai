export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_jobs: {
        Row: {
          agent: string | null
          completed_at: string | null
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string | null
          document_id: string
          error_message: string | null
          execution_stage: string | null
          id: string
          input_payload: Json | null
          job_type: string
          latency_ms: number | null
          llm_model: string | null
          max_retries: number | null
          org_id: string
          output_payload: Json | null
          priority: number | null
          prompt_tokens: number | null
          requested_by: string | null
          retry_count: number | null
          section_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ai_job_status"] | null
        }
        Insert: {
          agent?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          execution_stage?: string | null
          id?: string
          input_payload?: Json | null
          job_type: string
          latency_ms?: number | null
          llm_model?: string | null
          max_retries?: number | null
          org_id: string
          output_payload?: Json | null
          priority?: number | null
          prompt_tokens?: number | null
          requested_by?: string | null
          retry_count?: number | null
          section_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"] | null
        }
        Update: {
          agent?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          execution_stage?: string | null
          id?: string
          input_payload?: Json | null
          job_type?: string
          latency_ms?: number | null
          llm_model?: string | null
          max_retries?: number | null
          org_id?: string
          output_payload?: Json | null
          priority?: number | null
          prompt_tokens?: number | null
          requested_by?: string | null
          retry_count?: number | null
          section_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_cascata: {
        Row: {
          campo: string
          created_at: string
          doc_afetado_id: string
          doc_origem_id: string
          id: string
          processo_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string | null
          valor_antigo: Json | null
          valor_novo: Json | null
        }
        Insert: {
          campo: string
          created_at?: string
          doc_afetado_id: string
          doc_origem_id: string
          id?: string
          processo_id: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string | null
          valor_antigo?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          campo?: string
          created_at?: string
          doc_afetado_id?: string
          doc_origem_id?: string
          id?: string
          processo_id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string | null
          valor_antigo?: Json | null
          valor_novo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_cascata_doc_afetado_id_fkey"
            columns: ["doc_afetado_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_cascata_doc_afetado_id_fkey"
            columns: ["doc_afetado_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "alertas_cascata_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_cascata_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "alertas_cascata_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_cascata_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      approval_instances: {
        Row: {
          assigned_to: string | null
          comment: string | null
          created_at: string | null
          deadline: string | null
          decided_at: string | null
          document_id: string
          id: string
          status: string | null
          step_id: string
        }
        Insert: {
          assigned_to?: string | null
          comment?: string | null
          created_at?: string | null
          deadline?: string | null
          decided_at?: string | null
          document_id: string
          id?: string
          status?: string | null
          step_id: string
        }
        Update: {
          assigned_to?: string | null
          comment?: string | null
          created_at?: string | null
          deadline?: string | null
          decided_at?: string | null
          document_id?: string
          id?: string
          status?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_instances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_instances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_instances_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          deadline_days: number | null
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_required: boolean | null
          org_id: string
          required_role: Database["public"]["Enums"]["user_role"]
          step_name: string
          step_order: number
        }
        Insert: {
          deadline_days?: number | null
          doc_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_required?: boolean | null
          org_id: string
          required_role: Database["public"]["Enums"]["user_role"]
          step_name: string
          step_order: number
        }
        Update: {
          deadline_days?: number | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_required?: boolean | null
          org_id?: string
          required_role?: Database["public"]["Enums"]["user_role"]
          step_name?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          diff: Json | null
          document_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: number
          ip_address: unknown
          job_id: string | null
          new_value: Json | null
          old_value: Json | null
          org_id: string
          process_id: string | null
          reason: string | null
          section_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: string
          created_at?: string | null
          diff?: Json | null
          document_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: unknown
          job_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          org_id: string
          process_id?: string | null
          reason?: string | null
          section_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: string
          created_at?: string | null
          diff?: Json | null
          document_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: unknown
          job_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          org_id?: string
          process_id?: string | null
          reason?: string | null
          section_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cadeias_documentais: {
        Row: {
          ativo: boolean | null
          cadeia: Json | null
          created_at: string
          id: string
          mapeamento_campos: Json | null
          modalidade: string | null
          nome: string
          tipo_procedimento: string | null
        }
        Insert: {
          ativo?: boolean | null
          cadeia?: Json | null
          created_at?: string
          id?: string
          mapeamento_campos?: Json | null
          modalidade?: string | null
          nome: string
          tipo_procedimento?: string | null
        }
        Update: {
          ativo?: boolean | null
          cadeia?: Json | null
          created_at?: string
          id?: string
          mapeamento_campos?: Json | null
          modalidade?: string | null
          nome?: string
          tipo_procedimento?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          agent: string
          checklist: Json | null
          checklist_score: number | null
          commitments: Json | null
          created_at: string | null
          created_by: string | null
          defined_terms: Json | null
          depends_on: string[] | null
          document_id: string
          has_warnings: boolean | null
          id: string
          is_complete: boolean | null
          is_required: boolean | null
          key_facts: Json | null
          last_edited_by: string | null
          last_validated_at: string | null
          normative_refs: Json | null
          order_index: number
          org_id: string
          rendered_content: string | null
          rendered_html: string | null
          section_id: string
          section_number: string
          status: string | null
          structured_data: Json | null
          title: string
          updated_at: string | null
          validation_report: Json | null
          validation_status: string | null
          values_declared: Json | null
        }
        Insert: {
          agent: string
          checklist?: Json | null
          checklist_score?: number | null
          commitments?: Json | null
          created_at?: string | null
          created_by?: string | null
          defined_terms?: Json | null
          depends_on?: string[] | null
          document_id: string
          has_warnings?: boolean | null
          id?: string
          is_complete?: boolean | null
          is_required?: boolean | null
          key_facts?: Json | null
          last_edited_by?: string | null
          last_validated_at?: string | null
          normative_refs?: Json | null
          order_index: number
          org_id: string
          rendered_content?: string | null
          rendered_html?: string | null
          section_id: string
          section_number: string
          status?: string | null
          structured_data?: Json | null
          title: string
          updated_at?: string | null
          validation_report?: Json | null
          validation_status?: string | null
          values_declared?: Json | null
        }
        Update: {
          agent?: string
          checklist?: Json | null
          checklist_score?: number | null
          commitments?: Json | null
          created_at?: string | null
          created_by?: string | null
          defined_terms?: Json | null
          depends_on?: string[] | null
          document_id?: string
          has_warnings?: boolean | null
          id?: string
          is_complete?: boolean | null
          is_required?: boolean | null
          key_facts?: Json | null
          last_edited_by?: string | null
          last_validated_at?: string | null
          normative_refs?: Json | null
          order_index?: number
          org_id?: string
          rendered_content?: string | null
          rendered_html?: string | null
          section_id?: string
          section_number?: string
          status?: string | null
          structured_data?: Json | null
          title?: string
          updated_at?: string | null
          validation_report?: Json | null
          validation_status?: string | null
          values_declared?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_default: boolean | null
          name: string
          normative_base: Json | null
          org_id: string | null
          sections_plan: Json
          updated_at: string | null
          version: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_default?: boolean | null
          name: string
          normative_base?: Json | null
          org_id?: string | null
          sections_plan: Json
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_default?: boolean | null
          name?: string
          normative_base?: Json | null
          org_id?: string | null
          sections_plan?: Json
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          cadeia_id: string | null
          conteudo_final: string | null
          conteudo_gerado: Json | null
          created_at: string
          dados_estruturados: Json | null
          dados_herdados: Json | null
          gerado_por: string | null
          id: string
          parent_doc_id: string | null
          posicao_cadeia: number | null
          processo_id: string
          status: string | null
          tipo: string | null
          updated_at: string
          versao: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cadeia_id?: string | null
          conteudo_final?: string | null
          conteudo_gerado?: Json | null
          created_at?: string
          dados_estruturados?: Json | null
          dados_herdados?: Json | null
          gerado_por?: string | null
          id?: string
          parent_doc_id?: string | null
          posicao_cadeia?: number | null
          processo_id: string
          status?: string | null
          tipo?: string | null
          updated_at?: string
          versao?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cadeia_id?: string | null
          conteudo_final?: string | null
          conteudo_gerado?: Json | null
          created_at?: string
          dados_estruturados?: Json | null
          dados_herdados?: Json | null
          gerado_por?: string | null
          id?: string
          parent_doc_id?: string | null
          posicao_cadeia?: number | null
          processo_id?: string
          status?: string | null
          tipo?: string | null
          updated_at?: string
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cadeia_id_fkey"
            columns: ["cadeia_id"]
            isOneToOne: false
            referencedRelation: "cadeias_documentais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_parent_doc_id_fkey"
            columns: ["parent_doc_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_parent_doc_id_fkey"
            columns: ["parent_doc_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          created_by: string
          current_step: number | null
          doc_type: Database["public"]["Enums"]["document_type"]
          document_hash: string | null
          docx_url: string | null
          exported_at: string | null
          finalized_at: string | null
          id: string
          inherited_data: Json | null
          last_edited_by: string | null
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          object_summary: string | null
          org_id: string
          parent_doc_id: string | null
          pdf_url: string | null
          process_id: string
          status: Database["public"]["Enums"]["document_status"] | null
          title: string | null
          total_steps: number | null
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_step?: number | null
          doc_type: Database["public"]["Enums"]["document_type"]
          document_hash?: string | null
          docx_url?: string | null
          exported_at?: string | null
          finalized_at?: string | null
          id?: string
          inherited_data?: Json | null
          last_edited_by?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          object_summary?: string | null
          org_id: string
          parent_doc_id?: string | null
          pdf_url?: string | null
          process_id: string
          status?: Database["public"]["Enums"]["document_status"] | null
          title?: string | null
          total_steps?: number | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_step?: number | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          document_hash?: string | null
          docx_url?: string | null
          exported_at?: string | null
          finalized_at?: string | null
          id?: string
          inherited_data?: Json | null
          last_edited_by?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          object_summary?: string | null
          org_id?: string
          parent_doc_id?: string | null
          pdf_url?: string | null
          process_id?: string
          status?: Database["public"]["Enums"]["document_status"] | null
          title?: string | null
          total_steps?: number | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_doc_id_fkey"
            columns: ["parent_doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      heranca_campos: {
        Row: {
          campo_destino: string
          campo_origem: string
          created_at: string
          doc_destino_id: string
          doc_origem_id: string
          id: string
          justificativa: string | null
          modificado: boolean | null
          valor_atual: Json | null
          valor_herdado: Json | null
        }
        Insert: {
          campo_destino: string
          campo_origem: string
          created_at?: string
          doc_destino_id: string
          doc_origem_id: string
          id?: string
          justificativa?: string | null
          modificado?: boolean | null
          valor_atual?: Json | null
          valor_herdado?: Json | null
        }
        Update: {
          campo_destino?: string
          campo_origem?: string
          created_at?: string
          doc_destino_id?: string
          doc_origem_id?: string
          id?: string
          justificativa?: string | null
          modificado?: boolean | null
          valor_atual?: Json | null
          valor_herdado?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "heranca_campos_doc_destino_id_fkey"
            columns: ["doc_destino_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heranca_campos_doc_destino_id_fkey"
            columns: ["doc_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "heranca_campos_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heranca_campos_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          affected_doc_types: string[] | null
          created_at: string | null
          detected_at: string | null
          id: string
          impact_analysis: string | null
          is_relevant: boolean | null
          notified_at: string | null
          org_id: string | null
          published_at: string | null
          raw_content: string | null
          severity: string
          source: string
          source_url: string | null
          summary: string
          title: string
        }
        Insert: {
          affected_doc_types?: string[] | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          impact_analysis?: string | null
          is_relevant?: boolean | null
          notified_at?: string | null
          org_id?: string | null
          published_at?: string | null
          raw_content?: string | null
          severity?: string
          source: string
          source_url?: string | null
          summary: string
          title: string
        }
        Update: {
          affected_doc_types?: string[] | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          impact_analysis?: string | null
          is_relevant?: boolean | null
          notified_at?: string | null
          org_id?: string | null
          published_at?: string | null
          raw_content?: string | null
          severity?: string
          source?: string
          source_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_config: {
        Row: {
          cost_limit_usd: number
          created_at: string | null
          created_by: string | null
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          org_id: string | null
          scope: Json
          updated_at: string | null
        }
        Insert: {
          cost_limit_usd?: number
          created_at?: string | null
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          scope?: Json
          updated_at?: string | null
        }
        Update: {
          cost_limit_usd?: number
          created_at?: string | null
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          scope?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_runs: {
        Row: {
          alerts_generated: number | null
          estimated_cost_usd: number | null
          finished_at: string | null
          id: string
          items_analyzed_deep: number | null
          items_analyzed_light: number | null
          items_fetched: number | null
          items_filtered_out: number | null
          org_id: string | null
          sources_checked: string[] | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          alerts_generated?: number | null
          estimated_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          items_analyzed_deep?: number | null
          items_analyzed_light?: number | null
          items_fetched?: number | null
          items_filtered_out?: number | null
          org_id?: string | null
          sources_checked?: string[] | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          alerts_generated?: number | null
          estimated_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          items_analyzed_deep?: number | null
          items_analyzed_light?: number | null
          items_fetched?: number | null
          items_filtered_out?: number | null
          org_id?: string | null
          sources_checked?: string[] | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          document_id: string | null
          id: string
          org_id: string
          process_id: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          org_id: string
          process_id?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          org_id?: string
          process_id?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          active: boolean | null
          cnpj: string | null
          created_at: string | null
          esfera: string | null
          id: string
          logo_url: string | null
          municipio: string | null
          name: string
          plan: string | null
          plan_expires_at: string | null
          settings: Json | null
          slug: string
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          esfera?: string | null
          id?: string
          logo_url?: string | null
          municipio?: string | null
          name: string
          plan?: string | null
          plan_expires_at?: string | null
          settings?: Json | null
          slug: string
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          esfera?: string | null
          id?: string
          logo_url?: string | null
          municipio?: string | null
          name?: string
          plan?: string | null
          plan_expires_at?: string | null
          settings?: Json | null
          slug?: string
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      price_researches: {
        Row: {
          collected_by: string | null
          created_at: string | null
          document_id: string
          excluded_reason: string | null
          id: string
          is_valid: boolean | null
          item_description: string
          job_id: string | null
          org_id: string
          quantity: number | null
          section_id: string | null
          source_date: string | null
          source_ref: string | null
          source_type: string
          source_url: string | null
          supplier_cnpj: string | null
          supplier_name: string | null
          total_price: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          collected_by?: string | null
          created_at?: string | null
          document_id: string
          excluded_reason?: string | null
          id?: string
          is_valid?: boolean | null
          item_description: string
          job_id?: string | null
          org_id: string
          quantity?: number | null
          section_id?: string | null
          source_date?: string | null
          source_ref?: string | null
          source_type: string
          source_url?: string | null
          supplier_cnpj?: string | null
          supplier_name?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price: number
        }
        Update: {
          collected_by?: string | null
          created_at?: string | null
          document_id?: string
          excluded_reason?: string | null
          id?: string
          is_valid?: boolean | null
          item_description?: string
          job_id?: string | null
          org_id?: string
          quantity?: number | null
          section_id?: string | null
          source_date?: string | null
          source_ref?: string | null
          source_type?: string
          source_url?: string | null
          supplier_cnpj?: string | null
          supplier_name?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_researches_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_researches_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_researches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_researches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_researches_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      process_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          process_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          process_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          process_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_process"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string | null
          created_by: string
          dados_base: Json | null
          department_id: string | null
          dotacao_orcamentaria: string | null
          finalized_at: string | null
          id: string
          modalidade_prevista: string | null
          numero_processo: string | null
          objeto: string
          objeto_detalhado: string | null
          org_id: string
          prazo_conclusao: string | null
          prioridade: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          tipo_objeto: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          dados_base?: Json | null
          department_id?: string | null
          dotacao_orcamentaria?: string | null
          finalized_at?: string | null
          id?: string
          modalidade_prevista?: string | null
          numero_processo?: string | null
          objeto: string
          objeto_detalhado?: string | null
          org_id: string
          prazo_conclusao?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tipo_objeto?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          dados_base?: Json | null
          department_id?: string | null
          dotacao_orcamentaria?: string | null
          finalized_at?: string | null
          id?: string
          modalidade_prevista?: string | null
          numero_processo?: string | null
          objeto?: string
          objeto_detalhado?: string | null
          org_id?: string
          prazo_conclusao?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tipo_objeto?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          context_data: Json | null
          created_at: string
          created_by: string
          id: string
          modalidade: string | null
          numero_processo: string | null
          objeto: string | null
          orgao: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          created_by: string
          id?: string
          modalidade?: string | null
          numero_processo?: string | null
          objeto?: string | null
          orgao?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          modalidade?: string | null
          numero_processo?: string | null
          objeto?: string | null
          orgao?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rag_documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_revoked: boolean | null
          metadata: Json | null
          org_id: string | null
          published_date: string | null
          revoked_by: string | null
          source_ref: string
          source_type: string
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_revoked?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          published_date?: string | null
          revoked_by?: string | null
          source_ref: string
          source_type: string
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_revoked?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          published_date?: string | null
          revoked_by?: string | null
          source_ref?: string
          source_type?: string
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      section_requirement_tabs: {
        Row: {
          field_data: Json | null
          has_warnings: boolean | null
          id: string
          is_complete: boolean | null
          order_index: number
          section_id: string
          tab_key: string
          tab_label: string
        }
        Insert: {
          field_data?: Json | null
          has_warnings?: boolean | null
          id?: string
          is_complete?: boolean | null
          order_index: number
          section_id: string
          tab_key: string
          tab_label: string
        }
        Update: {
          field_data?: Json | null
          has_warnings?: boolean | null
          id?: string
          is_complete?: boolean | null
          order_index?: number
          section_id?: string
          tab_key?: string
          tab_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_requirement_tabs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          ai_cost_usd: number | null
          ai_jobs_run: number | null
          ai_tokens_used: number | null
          documents_created: number | null
          exports_docx: number | null
          exports_pdf: number | null
          id: string
          org_id: string
          period_month: string
          plan_limit_docs: number | null
          plan_limit_users: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_cost_usd?: number | null
          ai_jobs_run?: number | null
          ai_tokens_used?: number | null
          documents_created?: number | null
          exports_docx?: number | null
          exports_pdf?: number | null
          id?: string
          org_id: string
          period_month: string
          plan_limit_docs?: number | null
          plan_limit_users?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_cost_usd?: number | null
          ai_jobs_run?: number | null
          ai_tokens_used?: number | null
          documents_created?: number | null
          exports_docx?: number | null
          exports_pdf?: number | null
          id?: string
          org_id?: string
          period_month?: string
          plan_limit_docs?: number | null
          plan_limit_users?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          cargo: string | null
          cpf: string | null
          created_at: string | null
          department_id: string | null
          full_name: string
          id: string
          last_login_at: string | null
          matricula: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name: string
          id: string
          last_login_at?: string | null
          matricula?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          matricula?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          action: Database["public"]["Enums"]["transition_action"]
          comment: string | null
          document_id: string
          from_status: Database["public"]["Enums"]["document_status"]
          id: string
          is_rejection: boolean | null
          notified_users: string[] | null
          org_id: string
          performed_at: string | null
          performed_by: string
          to_status: Database["public"]["Enums"]["document_status"]
        }
        Insert: {
          action: Database["public"]["Enums"]["transition_action"]
          comment?: string | null
          document_id: string
          from_status: Database["public"]["Enums"]["document_status"]
          id?: string
          is_rejection?: boolean | null
          notified_users?: string[] | null
          org_id: string
          performed_at?: string | null
          performed_by: string
          to_status: Database["public"]["Enums"]["document_status"]
        }
        Update: {
          action?: Database["public"]["Enums"]["transition_action"]
          comment?: string | null
          document_id?: string
          from_status?: Database["public"]["Enums"]["document_status"]
          id?: string
          is_rejection?: boolean | null
          notified_users?: string[] | null
          org_id?: string
          performed_at?: string | null
          performed_by?: string
          to_status?: Database["public"]["Enums"]["document_status"]
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_processo_com_dfd: {
        Row: {
          cadeia_id: string | null
          context_data: Json | null
          created_at: string | null
          created_by: string | null
          dfd_dados: Json | null
          dfd_id: string | null
          dfd_status: string | null
          dfd_versao: number | null
          modalidade: string | null
          numero_processo: string | null
          objeto: string | null
          orgao: string | null
          processo_id: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cadeia_id_fkey"
            columns: ["cadeia_id"]
            isOneToOne: false
            referencedRelation: "cadeias_documentais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_processo_com_documento_raiz: {
        Args: {
          p_cadeia_id: string
          p_modalidade: string
          p_numero_processo: string
          p_objeto: string
          p_orgao: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_document_id?: string
          p_entity_id: string
          p_entity_type: string
          p_new_value?: Json
          p_old_value?: Json
          p_org_id: string
          p_reason?: string
          p_section_id?: string
          p_user_id: string
        }
        Returns: string
      }
      obter_pipeline_processo: {
        Args: { p_processo_id: string }
        Returns: Json
      }
      resolver_heranca: {
        Args: {
          p_parent_doc_id?: string
          p_processo_id: string
          p_tipo_documento: string
        }
        Returns: Json
      }
      transition_document_status: {
        Args: {
          p_action: Database["public"]["Enums"]["transition_action"]
          p_comment?: string
          p_document_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_action_type: "improve" | "validate" | "suggest"
      ai_job_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      document_status:
        | "rascunho"
        | "em_elaboracao"
        | "em_revisao"
        | "em_ajuste"
        | "aprovado"
        | "finalizado"
        | "arquivado"
      document_type:
        | "dfd"
        | "etp"
        | "tr"
        | "edital"
        | "contrato"
        | "parecer_juridico"
        | "portaria_designacao"
        | "projeto_basico"
        | "mapa_risco"
        | "custom"
      transition_action:
        | "submit_for_review"
        | "request_adjustment"
        | "approve"
        | "finalize"
        | "archive"
        | "reopen"
      user_role:
        | "admin_org"
        | "demandante"
        | "planejamento"
        | "juridico"
        | "controle_interno"
        | "gestor_contrato"
        | "autoridade_competente"
        | "visualizador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_action_type: ["improve", "validate", "suggest"],
      ai_job_status: ["pending", "running", "completed", "failed", "cancelled"],
      document_status: [
        "rascunho",
        "em_elaboracao",
        "em_revisao",
        "em_ajuste",
        "aprovado",
        "finalizado",
        "arquivado",
      ],
      document_type: [
        "dfd",
        "etp",
        "tr",
        "edital",
        "contrato",
        "parecer_juridico",
        "portaria_designacao",
        "projeto_basico",
        "mapa_risco",
        "custom",
      ],
      transition_action: [
        "submit_for_review",
        "request_adjustment",
        "approve",
        "finalize",
        "archive",
        "reopen",
      ],
      user_role: [
        "admin_org",
        "demandante",
        "planejamento",
        "juridico",
        "controle_interno",
        "gestor_contrato",
        "autoridade_competente",
        "visualizador",
      ],
    },
  },
} as const
