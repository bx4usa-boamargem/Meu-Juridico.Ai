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
      ai_audit_log: {
        Row: {
          action: string
          created_at: string
          documento_id: string | null
          id: string
          input_text: string | null
          model: string
          output_text: string | null
          prompt_version: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          documento_id?: string | null
          id?: string
          input_text?: string | null
          model: string
          output_text?: string | null
          prompt_version?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          documento_id?: string | null
          id?: string
          input_text?: string | null
          model?: string
          output_text?: string | null
          prompt_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_log_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_audit_log_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          action: string
          created_at: string
          custo_usd: number | null
          documento_id: string | null
          duracao_ms: number | null
          erro: string | null
          estado: string | null
          fallback_de: string | null
          foi_fallback: boolean | null
          id: string
          modelo_utilizado: string
          org_id: string | null
          orgao: string | null
          tipo_documento: string | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          custo_usd?: number | null
          documento_id?: string | null
          duracao_ms?: number | null
          erro?: string | null
          estado?: string | null
          fallback_de?: string | null
          foi_fallback?: boolean | null
          id?: string
          modelo_utilizado: string
          org_id?: string | null
          orgao?: string | null
          tipo_documento?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          custo_usd?: number | null
          documento_id?: string | null
          duracao_ms?: number | null
          erro?: string | null
          estado?: string | null
          fallback_de?: string | null
          foi_fallback?: boolean | null
          id?: string
          modelo_utilizado?: string
          org_id?: string | null
          orgao?: string | null
          tipo_documento?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "ai_usage_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["org_id"]
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
      api_health_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string
          status?: string
        }
        Relationships: []
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
      document_share_links: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          documento_id: string
          expires_at: string | null
          id: string
          token: string
          version_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          documento_id: string
          expires_at?: string | null
          id?: string
          token?: string
          version_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          documento_id?: string
          expires_at?: string | null
          id?: string
          token?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_share_links_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_share_links_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "document_share_links_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          agent: string | null
          created_at: string
          description: string | null
          doc_type: string
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean
          order_index: number | null
          required: boolean | null
          section_id: string | null
          sections_plan: Json
          skill: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agent?: string | null
          created_at?: string
          description?: string | null
          doc_type: string
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          order_index?: number | null
          required?: boolean | null
          section_id?: string | null
          sections_plan?: Json
          skill?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agent?: string | null
          created_at?: string
          description?: string | null
          doc_type?: string
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          order_index?: number | null
          required?: boolean | null
          section_id?: string | null
          sections_plan?: Json
          skill?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          conteudo_html: string
          created_at: string
          documento_id: string
          gerado_em: string
          gerado_por: string | null
          id: string
          pdf_gerado_em: string | null
          pdf_url: string | null
          processo_id: string
          versao: number
        }
        Insert: {
          conteudo_html: string
          created_at?: string
          documento_id: string
          gerado_em?: string
          gerado_por?: string | null
          id?: string
          pdf_gerado_em?: string | null
          pdf_url?: string | null
          processo_id: string
          versao?: number
        }
        Update: {
          conteudo_html?: string
          created_at?: string
          documento_id?: string
          gerado_em?: string
          gerado_por?: string | null
          id?: string
          pdf_gerado_em?: string | null
          pdf_url?: string | null
          processo_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "document_versions_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["processo_id"]
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
          score_conformidade: number | null
          section_memories: Json | null
          status: string | null
          tipo: string | null
          updated_at: string
          versao: number | null
          workflow_status: string
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
          score_conformidade?: number | null
          section_memories?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          versao?: number | null
          workflow_status?: string
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
          score_conformidade?: number | null
          section_memories?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          versao?: number | null
          workflow_status?: string
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
      knowledge_base: {
        Row: {
          created_at: string
          created_by: string
          doc_type: string
          file_path: string
          file_size_bytes: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          doc_type: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          doc_type?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["org_id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number | null
          content_text: string
          created_at: string
          document_id: string
          embedding: string
          id: string
          metadata: Json | null
          org_id: string
        }
        Insert: {
          chunk_index?: number | null
          content_text: string
          created_at?: string
          document_id: string
          embedding: string
          id?: string
          metadata?: Json | null
          org_id: string
        }
        Update: {
          chunk_index?: number | null
          content_text?: string
          created_at?: string
          document_id?: string
          embedding?: string
          id?: string
          metadata?: Json | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["org_id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          affected_doc_types: string[] | null
          created_at: string
          detected_at: string
          id: string
          impact_analysis: string | null
          is_relevant: boolean
          severity: string
          source: string
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          affected_doc_types?: string[] | null
          created_at?: string
          detected_at?: string
          id?: string
          impact_analysis?: string | null
          is_relevant?: boolean
          severity?: string
          source: string
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          affected_doc_types?: string[] | null
          created_at?: string
          detected_at?: string
          id?: string
          impact_analysis?: string | null
          is_relevant?: boolean
          severity?: string
          source?: string
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      monitoring_config: {
        Row: {
          cost_limit_usd: number
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          scope: Json
          updated_at: string
        }
        Insert: {
          cost_limit_usd?: number
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          scope?: Json
          updated_at?: string
        }
        Update: {
          cost_limit_usd?: number
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          scope?: Json
          updated_at?: string
        }
        Relationships: []
      }
      monitoring_runs: {
        Row: {
          alerts_generated: number | null
          created_at: string
          error_message: string | null
          estimated_cost_usd: number | null
          finished_at: string | null
          id: string
          items_analyzed_deep: number | null
          items_analyzed_light: number | null
          items_collected: number | null
          items_filtered_out: number | null
          started_at: string
          status: string
        }
        Insert: {
          alerts_generated?: number | null
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          items_analyzed_deep?: number | null
          items_analyzed_light?: number | null
          items_collected?: number | null
          items_filtered_out?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          alerts_generated?: number | null
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          items_analyzed_deep?: number | null
          items_analyzed_light?: number | null
          items_collected?: number | null
          items_filtered_out?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          severity: string | null
          source: string | null
          source_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          severity?: string | null
          source?: string | null
          source_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          severity?: string | null
          source?: string | null
          source_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_knowledge_base: {
        Row: {
          conteudo: string
          created_at: string
          created_by: string
          id: string
          orgao: string
          search_vector: unknown
          tags: string[] | null
          tipo: string
          titulo: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          created_by: string
          id?: string
          orgao: string
          search_vector?: unknown
          tags?: string[] | null
          tipo: string
          titulo: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          created_by?: string
          id?: string
          orgao?: string
          search_vector?: unknown
          tags?: string[] | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          created_at: string
          created_by: string
          nome: string
          org_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          nome: string
          org_id?: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          nome?: string
          org_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_references: {
        Row: {
          analise_ia: string | null
          created_at: string
          created_by: string
          estado: string | null
          estatisticas: Json | null
          id: string
          municipio: string | null
          objeto: string
          outliers_removidos: number | null
          periodo: string | null
          preco_referencia: number | null
          processo_id: string | null
          resultados: Json | null
          unidade_medida: string | null
        }
        Insert: {
          analise_ia?: string | null
          created_at?: string
          created_by: string
          estado?: string | null
          estatisticas?: Json | null
          id?: string
          municipio?: string | null
          objeto: string
          outliers_removidos?: number | null
          periodo?: string | null
          preco_referencia?: number | null
          processo_id?: string | null
          resultados?: Json | null
          unidade_medida?: string | null
        }
        Update: {
          analise_ia?: string | null
          created_at?: string
          created_by?: string
          estado?: string | null
          estatisticas?: Json | null
          id?: string
          municipio?: string | null
          objeto?: string
          outliers_removidos?: number | null
          periodo?: string | null
          preco_referencia?: number | null
          processo_id?: string | null
          resultados?: Json | null
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_references_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_references_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["processo_id"]
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
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          full_name: string | null
          id: string
          orgao: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          orgao?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          orgao?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_maps: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          created_by: string
          documento_id: string | null
          id: string
          processo_id: string
          resumo_executivo: string | null
          riscos: Json
          updated_at: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          created_by: string
          documento_id?: string | null
          id?: string
          processo_id: string
          resumo_executivo?: string | null
          riscos?: Json
          updated_at?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          created_by?: string
          documento_id?: string | null
          id?: string
          processo_id?: string
          resumo_executivo?: string | null
          riscos?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_maps_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_maps_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["dfd_id"]
          },
          {
            foreignKeyName: "risk_maps_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_maps_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "vw_processo_com_dfd"
            referencedColumns: ["processo_id"]
          },
        ]
      }
      roi_benchmarks: {
        Row: {
          created_at: string | null
          fonte: string | null
          id: string
          indicador: string
          unidade: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          fonte?: string | null
          id?: string
          indicador: string
          unidade?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          fonte?: string | null
          id?: string
          indicador?: string
          unidade?: string | null
          valor?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      get_alertas_documento: {
        Args: { p_doc_type: string }
        Returns: {
          affected_doc_types: string[] | null
          created_at: string
          detected_at: string
          id: string
          impact_analysis: string | null
          is_relevant: boolean
          severity: string
          source: string
          source_url: string | null
          summary: string | null
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "monitoring_alerts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_orgao: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_knowledge_chunks: {
        Args: {
          p_doc_types?: string[]
          p_embedding: string
          p_match_count: number
          p_match_threshold: number
          p_org_id: string
        }
        Returns: {
          chunk_id: string
          content_text: string
          doc_title: string
          document_id: string
          similarity: number
        }[]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
