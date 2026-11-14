export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      eventos_stripe: {
        Row: {
          id: string;
          procesado_en: string;
          tipo: string;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          procesado_en?: string;
          tipo: string;
        };
        Update: {
          id?: string;
          procesado_en?: string;
          tipo?: string;
        };
        Relationships: [];
      };
      negocios: {
        Row: {
          activo: boolean;
          creado_en: string;
          deposito_pct: number;
          descripcion_en: string;
          descripcion_es: string;
          email_contacto: string;
          horas_cancelacion: number;
          id: string;
          nombre: string;
          owner_id: string;
          slug: string;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          creado_en?: string;
          deposito_pct?: number;
          descripcion_en?: string;
          descripcion_es?: string;
          email_contacto: string;
          horas_cancelacion?: number;
          id?: string;
          nombre: string;
          owner_id: string;
          slug: string;
          whatsapp?: string | null;
        };
        Update: {
          activo?: boolean;
          creado_en?: string;
          deposito_pct?: number;
          descripcion_en?: string;
          descripcion_es?: string;
          email_contacto?: string;
          horas_cancelacion?: number;
          id?: string;
          nombre?: string;
          owner_id?: string;
          slug?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      reservas: {
        Row: {
          cancelada_en: string | null;
          confirmada_en: string | null;
          creado_en: string;
          deposito_cents: number;
          email: string;
          estado: Database['public']['Enums']['estado_reserva'];
          expira_en: string;
          id: string;
          idioma: Database['public']['Enums']['idioma'];
          negocio_id: string;
          nombre: string;
          personas: number;
          salida_id: string;
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          telefono: string;
          token_hash: string;
          total_cents: number;
        };
        ComputedFields: never;
        Insert: {
          cancelada_en?: string | null;
          confirmada_en?: string | null;
          creado_en?: string;
          deposito_cents: number;
          email: string;
          estado?: Database['public']['Enums']['estado_reserva'];
          expira_en: string;
          id?: string;
          idioma?: Database['public']['Enums']['idioma'];
          negocio_id: string;
          nombre: string;
          personas: number;
          salida_id: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          telefono: string;
          token_hash: string;
          total_cents: number;
        };
        Update: {
          cancelada_en?: string | null;
          confirmada_en?: string | null;
          creado_en?: string;
          deposito_cents?: number;
          email?: string;
          estado?: Database['public']['Enums']['estado_reserva'];
          expira_en?: string;
          id?: string;
          idioma?: Database['public']['Enums']['idioma'];
          negocio_id?: string;
          nombre?: string;
          personas?: number;
          salida_id?: string;
          stripe_payment_intent?: string | null;
          stripe_session_id?: string | null;
          telefono?: string;
          token_hash?: string;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'reservas_negocio_id_fkey';
            columns: ['negocio_id'];
            isOneToOne: false;
            referencedRelation: 'negocios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservas_salida_id_fkey';
            columns: ['salida_id'];
            isOneToOne: false;
            referencedRelation: 'salidas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservas_salida_id_fkey';
            columns: ['salida_id'];
            isOneToOne: false;
            referencedRelation: 'salidas_ocupacion';
            referencedColumns: ['id'];
          },
        ];
      };
      salidas: {
        Row: {
          creado_en: string;
          cupo: number;
          estado: Database['public']['Enums']['estado_salida'];
          id: string;
          inicia_en: string;
          negocio_id: string;
          tour_id: string;
        };
        ComputedFields: never;
        Insert: {
          creado_en?: string;
          cupo: number;
          estado?: Database['public']['Enums']['estado_salida'];
          id?: string;
          inicia_en: string;
          negocio_id: string;
          tour_id: string;
        };
        Update: {
          creado_en?: string;
          cupo?: number;
          estado?: Database['public']['Enums']['estado_salida'];
          id?: string;
          inicia_en?: string;
          negocio_id?: string;
          tour_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salidas_negocio_id_fkey';
            columns: ['negocio_id'];
            isOneToOne: false;
            referencedRelation: 'negocios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salidas_tour_id_fkey';
            columns: ['tour_id'];
            isOneToOne: false;
            referencedRelation: 'tours';
            referencedColumns: ['id'];
          },
        ];
      };
      tours: {
        Row: {
          activo: boolean;
          creado_en: string;
          cupo_default: number;
          descripcion_en: string;
          descripcion_es: string;
          duracion_min: number;
          id: string;
          imagen_url: string | null;
          negocio_id: string;
          nombre_en: string;
          nombre_es: string;
          precio_cents: number;
          punto_encuentro: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          activo?: boolean;
          creado_en?: string;
          cupo_default: number;
          descripcion_en?: string;
          descripcion_es?: string;
          duracion_min: number;
          id?: string;
          imagen_url?: string | null;
          negocio_id: string;
          nombre_en: string;
          nombre_es: string;
          precio_cents: number;
          punto_encuentro?: string;
          slug: string;
        };
        Update: {
          activo?: boolean;
          creado_en?: string;
          cupo_default?: number;
          descripcion_en?: string;
          descripcion_es?: string;
          duracion_min?: number;
          id?: string;
          imagen_url?: string | null;
          negocio_id?: string;
          nombre_en?: string;
          nombre_es?: string;
          precio_cents?: number;
          punto_encuentro?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tours_negocio_id_fkey';
            columns: ['negocio_id'];
            isOneToOne: false;
            referencedRelation: 'negocios';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      salidas_ocupacion: {
        Row: {
          creado_en: string;
          cupo: number;
          estado: Database['public']['Enums']['estado_salida'];
          id: string;
          inicia_en: string;
          negocio_id: string;
          ocupados: number | null;
          tour_id: string;
          tour_nombre: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: 'salidas_negocio_id_fkey';
            columns: ['negocio_id'];
            isOneToOne: false;
            referencedRelation: 'negocios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salidas_tour_id_fkey';
            columns: ['tour_id'];
            isOneToOne: false;
            referencedRelation: 'tours';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      crear_negocio: {
        Args: { p_email: string; p_nombre: string; p_slug: string };
        Returns: {
          activo: boolean;
          creado_en: string;
          deposito_pct: number;
          descripcion_en: string;
          descripcion_es: string;
          email_contacto: string;
          horas_cancelacion: number;
          id: string;
          nombre: string;
          owner_id: string;
          slug: string;
          whatsapp: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'negocios';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      crear_reserva: {
        Args: {
          p_email: string;
          p_idioma: Database['public']['Enums']['idioma'];
          p_nombre: string;
          p_personas: number;
          p_salida_id: string;
          p_telefono: string;
          p_token_hash: string;
        };
        Returns: {
          cancelada_en: string | null;
          confirmada_en: string | null;
          creado_en: string;
          deposito_cents: number;
          email: string;
          estado: Database['public']['Enums']['estado_reserva'];
          expira_en: string;
          id: string;
          idioma: Database['public']['Enums']['idioma'];
          negocio_id: string;
          nombre: string;
          personas: number;
          salida_id: string;
          stripe_payment_intent: string | null;
          stripe_session_id: string | null;
          telefono: string;
          token_hash: string;
          total_cents: number;
        };
        SetofOptions: {
          from: '*';
          to: 'reservas';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cupos_disponibles: { Args: { p_salida_id: string }; Returns: number };
    };
    Enums: {
      estado_reserva:
        | 'pendiente_pago'
        | 'confirmada'
        | 'cancelada'
        | 'reembolsada'
        | 'expirada';
      estado_salida: 'programada' | 'cancelada';
      idioma: 'es' | 'en';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_reserva: [
        'pendiente_pago',
        'confirmada',
        'cancelada',
        'reembolsada',
        'expirada',
      ],
      estado_salida: ['programada', 'cancelada'],
      idioma: ['es', 'en'],
    },
  },
} as const;
