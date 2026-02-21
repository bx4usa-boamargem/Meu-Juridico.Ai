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
            foreignKeyName: "alertas_cascata_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_cascata_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
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
        }
        Insert: {
          ativo?: boolean | null
          cadeia?: Json | null
          created_at?: string
          id?: string
          mapeamento_campos?: Json | null
          modalidade?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cadeia?: Json | null
          created_at?: string
          id?: string
          mapeamento_campos?: Json | null
          modalidade?: string | null
          nome?: string
        }
        Relationships: []
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
            foreignKeyName: "documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
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
            foreignKeyName: "heranca_campos_doc_origem_id_fkey"
            columns: ["doc_origem_id"]
            isOneToOne: false
            referencedRelation: "documentos"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
