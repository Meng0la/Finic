// Gerado a partir do projeto Supabase (gukamrxtrnwmgthczqnz) via
// generate_typescript_types. Regenerar sempre que o schema mudar
// (supabase/migrations/*.sql é a fonte da verdade).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          ativo: boolean;
          created_at: string;
          dia_fechamento: number | null;
          dia_vencimento: number | null;
          id: string;
          limite: number | null;
          nome: string;
          saldo_inicial: number;
          tipo: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          dia_fechamento?: number | null;
          dia_vencimento?: number | null;
          id?: string;
          limite?: number | null;
          nome: string;
          saldo_inicial?: number;
          tipo: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          dia_fechamento?: number | null;
          dia_vencimento?: number | null;
          id?: string;
          limite?: number | null;
          nome?: string;
          saldo_inicial?: number;
          tipo?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          acao: string;
          created_at: string;
          dado_anterior: Json | null;
          dado_novo: Json | null;
          entidade: string;
          entidade_id: string | null;
          id: string;
          origem: string;
          user_id: string;
        };
        Insert: {
          acao: string;
          created_at?: string;
          dado_anterior?: Json | null;
          dado_novo?: Json | null;
          entidade: string;
          entidade_id?: string | null;
          id?: string;
          origem?: string;
          user_id: string;
        };
        Update: {
          acao?: string;
          created_at?: string;
          dado_anterior?: Json | null;
          dado_novo?: Json | null;
          entidade?: string;
          entidade_id?: string | null;
          id?: string;
          origem?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          limite_mensal: number;
          mes_referencia: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          limite_mensal: number;
          mes_referencia: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          limite_mensal?: number;
          mes_referencia?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          cor: string;
          created_at: string;
          icone: string;
          id: string;
          is_padrao: boolean;
          nome: string;
          tipo: string;
          user_id: string;
        };
        Insert: {
          cor?: string;
          created_at?: string;
          icone?: string;
          id?: string;
          is_padrao?: boolean;
          nome: string;
          tipo: string;
          user_id: string;
        };
        Update: {
          cor?: string;
          created_at?: string;
          icone?: string;
          id?: string;
          is_padrao?: boolean;
          nome?: string;
          tipo?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      investment_suggestions: {
        Row: {
          id: string;
          user_id: string;
          mes_referencia: string;
          valor_base: number;
          perfil_risco: string;
          experiencia: string;
          sugestao: Json;
          modelo: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mes_referencia: string;
          valor_base: number;
          perfil_risco: string;
          experiencia?: string;
          sugestao: Json;
          modelo?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mes_referencia?: string;
          valor_base?: number;
          perfil_risco?: string;
          experiencia?: string;
          sugestao?: Json;
          modelo?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          perfil_risco: string;
          experiencia: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          perfil_risco?: string;
          experiencia?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          perfil_risco?: string;
          experiencia?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          category_id: string | null;
          conta_destino_id: string | null;
          created_at: string;
          data: string;
          descricao: string | null;
          forma_pagamento: string | null;
          grupo_recorrencia_id: string | null;
          id: string;
          origem: string;
          parcela_atual: number | null;
          parcelas_total: number | null;
          recorrencia: string;
          status: string;
          tipo: string;
          updated_at: string;
          user_id: string;
          valor: number;
        };
        Insert: {
          account_id: string;
          category_id?: string | null;
          conta_destino_id?: string | null;
          created_at?: string;
          data: string;
          descricao?: string | null;
          forma_pagamento?: string | null;
          grupo_recorrencia_id?: string | null;
          id?: string;
          origem?: string;
          parcela_atual?: number | null;
          parcelas_total?: number | null;
          recorrencia?: string;
          status?: string;
          tipo: string;
          updated_at?: string;
          user_id: string;
          valor: number;
        };
        Update: {
          account_id?: string;
          category_id?: string | null;
          conta_destino_id?: string | null;
          created_at?: string;
          data?: string;
          descricao?: string | null;
          forma_pagamento?: string | null;
          grupo_recorrencia_id?: string | null;
          id?: string;
          origem?: string;
          parcela_atual?: number | null;
          parcelas_total?: number | null;
          recorrencia?: string;
          status?: string;
          tipo?: string;
          updated_at?: string;
          user_id?: string;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_conta_destino_id_fkey";
            columns: ["conta_destino_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_links: {
        Row: {
          codigo_expira_em: string | null;
          codigo_verificacao_hash: string | null;
          created_at: string;
          id: string;
          numero_hash: string;
          numero_ultimos_digitos: string;
          revogado_em: string | null;
          status: string;
          user_id: string;
          verificado_em: string | null;
        };
        Insert: {
          codigo_expira_em?: string | null;
          codigo_verificacao_hash?: string | null;
          created_at?: string;
          id?: string;
          numero_hash: string;
          numero_ultimos_digitos: string;
          revogado_em?: string | null;
          status?: string;
          user_id: string;
          verificado_em?: string | null;
        };
        Update: {
          codigo_expira_em?: string | null;
          codigo_verificacao_hash?: string | null;
          created_at?: string;
          id?: string;
          numero_hash?: string;
          numero_ultimos_digitos?: string;
          revogado_em?: string | null;
          status?: string;
          user_id?: string;
          verificado_em?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Aliases amigáveis usados pela aplicação, com colunas "enum-like" (texto +
// check constraint no banco) estreitadas para union literal no TypeScript.
// ---------------------------------------------------------------------------

export type ContaTipo = "corrente" | "poupanca" | "dinheiro" | "cartao";
export type CategoriaTipo = "receita" | "despesa";
export type TransacaoTipo = "receita" | "despesa" | "transferencia";
export type Recorrencia = "unica" | "fixa_mensal" | "parcelada";
export type Origem = "web" | "whatsapp";
export type TransacaoStatus = "ativo" | "estornado";
export type PerfilRisco = "conservador" | "moderado" | "arrojado";
export type Experiencia = "iniciante" | "intermediario" | "avancado";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type InvestmentSuggestionRow = Database["public"]["Tables"]["investment_suggestions"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

export interface Account extends Omit<AccountRow, "tipo"> {
  tipo: ContaTipo;
}

export interface Category extends Omit<CategoryRow, "tipo"> {
  tipo: CategoriaTipo;
}

export interface Transaction extends Omit<TransactionRow, "tipo" | "recorrencia" | "origem" | "status"> {
  tipo: TransacaoTipo;
  recorrencia: Recorrencia;
  origem: Origem;
  status: TransacaoStatus;
}

export type Budget = BudgetRow;

export type AuditLogAcao = "insert" | "update" | "soft_delete" | "estorno";

export interface AuditLogEntry extends Omit<AuditLogRow, "acao" | "origem"> {
  acao: AuditLogAcao;
  origem: Origem | "sistema";
}

export interface Profile extends Omit<ProfileRow, "perfil_risco" | "experiencia"> {
  perfil_risco: PerfilRisco;
  experiencia: Experiencia;
}

export interface AllocationItem {
  categoria: string;
  percentual: number;
  risco: "baixo" | "medio" | "alto";
  explicacao: string;
  como_investir: string;
}

export interface FonteConsultada {
  titulo: string;
  url: string;
}

export interface InvestmentSuggestionPayload {
  resumo: string;
  alocacao: AllocationItem[];
  alertas: string[];
  fontes: FonteConsultada[];
}

export interface InvestmentSuggestion
  extends Omit<InvestmentSuggestionRow, "perfil_risco" | "experiencia" | "sugestao"> {
  perfil_risco: PerfilRisco;
  experiencia: Experiencia;
  sugestao: InvestmentSuggestionPayload;
}
