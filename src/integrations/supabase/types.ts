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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      balance_transactions: {
        Row: {
          balance_after_cop: number
          created_at: string
          delta_cop: number
          gift_card_id: string | null
          id: string
          note: string | null
          order_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          balance_after_cop: number
          created_at?: string
          delta_cop: number
          gift_card_id?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          balance_after_cop?: number
          created_at?: string
          delta_cop?: number
          gift_card_id?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          balance_cop: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          expires_at: string | null
          id: string
          initial_amount_cop: number
          note: string | null
          purchased_by_order: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          balance_cop: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_amount_cop: number
          note?: string | null
          purchased_by_order?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          balance_cop?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_amount_cop?: number
          note?: string | null
          purchased_by_order?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_purchased_by_order_fkey"
            columns: ["purchased_by_order"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_until: string | null
          amount_cop: number
          balance_applied_cop: number
          bold_payment_id: string | null
          bold_payment_method: string | null
          buyer_email: string | null
          created_at: string
          currency: string
          delivered_assets: Json
          delivered_keys: Json | null
          gift_card_codes: Json
          id: string
          items: Json
          kind: string
          order_ref: string
          payment_link: string | null
          status: Database["public"]["Enums"]["order_status"]
          topup_amount_cop: number | null
          topup_bonus_cop: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_until?: string | null
          amount_cop: number
          balance_applied_cop?: number
          bold_payment_id?: string | null
          bold_payment_method?: string | null
          buyer_email?: string | null
          created_at?: string
          currency?: string
          delivered_assets?: Json
          delivered_keys?: Json | null
          gift_card_codes?: Json
          id?: string
          items?: Json
          kind?: string
          order_ref: string
          payment_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          topup_amount_cop?: number | null
          topup_bonus_cop?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_until?: string | null
          amount_cop?: number
          balance_applied_cop?: number
          bold_payment_id?: string | null
          bold_payment_method?: string | null
          buyer_email?: string | null
          created_at?: string
          currency?: string
          delivered_assets?: Json
          delivered_keys?: Json | null
          gift_card_codes?: Json
          id?: string
          items?: Json
          kind?: string
          order_ref?: string
          payment_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          topup_amount_cop?: number | null
          topup_bonus_cop?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_keys: {
        Row: {
          created_at: string
          delivered: boolean
          delivery_type: string
          file_name: string | null
          file_path: string | null
          id: string
          key_value: string
          product_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          delivery_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          key_value: string
          product_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          delivered?: boolean
          delivery_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          key_value?: string
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_keys_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          delivery_files: Json
          delivery_videos: Json
          discount_percent: number
          id: string
          name: string
          price_cop: number
          product_id: string
          requires_key: boolean
          sort_order: number
          stock_keys: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_files?: Json
          delivery_videos?: Json
          discount_percent?: number
          id?: string
          name: string
          price_cop: number
          product_id: string
          requires_key?: boolean
          sort_order?: number
          stock_keys?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_files?: Json
          delivery_videos?: Json
          discount_percent?: number
          id?: string
          name?: string
          price_cop?: number
          product_id?: string
          requires_key?: boolean
          sort_order?: number
          stock_keys?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          delivery_files: Json
          delivery_videos: Json
          description: string | null
          discount_percent: number
          email_body_html: string | null
          email_subject: string | null
          features: Json | null
          game: string | null
          id: string
          image_url: string | null
          name: string
          price_cop: number
          requires_key: boolean
          slug: string
          stock_keys: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          delivery_files?: Json
          delivery_videos?: Json
          description?: string | null
          discount_percent?: number
          email_body_html?: string | null
          email_subject?: string | null
          features?: Json | null
          game?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_cop: number
          requires_key?: boolean
          slug: string
          stock_keys?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          delivery_files?: Json
          delivery_videos?: Json
          description?: string | null
          discount_percent?: number
          email_body_html?: string | null
          email_subject?: string | null
          features?: Json | null
          game?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_cop?: number
          requires_key?: boolean
          slug?: string
          stock_keys?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          access_window_days: number
          currency: string
          id: number
          rate_usd_to_cop: number
          updated_at: string
        }
        Insert: {
          access_window_days?: number
          currency?: string
          id?: number
          rate_usd_to_cop?: number
          updated_at?: string
        }
        Update: {
          access_window_days?: number
          currency?: string
          id?: number
          rate_usd_to_cop?: number
          updated_at?: string
        }
        Relationships: []
      }
      topup_packages: {
        Row: {
          active: boolean
          amount_cop: number
          bonus_cop: number
          created_at: string
          id: string
          label: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_cop: number
          bonus_cop?: number
          created_at?: string
          id?: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_cop?: number
          bonus_cop?: number
          created_at?: string
          id?: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          balance_cop: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cop?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cop?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_gift_card: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status: "pending" | "approved" | "rejected" | "voided"
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
      app_role: ["admin", "user"],
      order_status: ["pending", "approved", "rejected", "voided"],
    },
  },
} as const
