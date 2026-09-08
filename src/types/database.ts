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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          jurisdiction_level: string | null
          jurisdiction_value: string | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          jurisdiction_level?: string | null
          jurisdiction_value?: string | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          jurisdiction_level?: string | null
          jurisdiction_value?: string | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_at: string | null
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          centre_id: string
          checked_in_at: string | null
          completed_at: string | null
          created_at: string | null
          crop_category: Database["public"]["Enums"]["crop_category"] | null
          expected_crop: string | null
          expected_quantity_kg: number | null
          farmer_id: string
          id: string
          notes: string | null
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          token_number: string
          updated_at: string | null
        }
        Insert: {
          booked_at?: string | null
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          centre_id: string
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          crop_category?: Database["public"]["Enums"]["crop_category"] | null
          expected_crop?: string | null
          expected_quantity_kg?: number | null
          farmer_id: string
          id?: string
          notes?: string | null
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          token_number: string
          updated_at?: string | null
        }
        Update: {
          booked_at?: string | null
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          centre_id?: string
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          crop_category?: Database["public"]["Enums"]["crop_category"] | null
          expected_crop?: string | null
          expected_quantity_kg?: number | null
          farmer_id?: string
          id?: string
          notes?: string | null
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          token_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      centres: {
        Row: {
          address: string
          code: string
          contact_phone: string | null
          created_at: string | null
          district: string
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          max_daily_capacity: number
          name: string
          operating_hours_end: string
          operating_hours_start: string
          pincode: string | null
          slot_duration_minutes: number
          state: string
          taluk: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          address: string
          code: string
          contact_phone?: string | null
          created_at?: string | null
          district: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_daily_capacity?: number
          name: string
          operating_hours_end?: string
          operating_hours_start?: string
          pincode?: string | null
          slot_duration_minutes?: number
          state?: string
          taluk?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          address?: string
          code?: string
          contact_phone?: string | null
          created_at?: string | null
          district?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_daily_capacity?: number
          name?: string
          operating_hours_end?: string
          operating_hours_start?: string
          pincode?: string | null
          slot_duration_minutes?: number
          state?: string
          taluk?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: []
      }
      farmers: {
        Row: {
          aadhaar_number_hash: string | null
          bank_account_number_encrypted: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string | null
          district: string
          id: string
          land_holding_acres: number | null
          pincode: string | null
          primary_crop: string | null
          profile_id: string
          state: string
          taluk: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          aadhaar_number_hash?: string | null
          bank_account_number_encrypted?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          district: string
          id?: string
          land_holding_acres?: number | null
          pincode?: string | null
          primary_crop?: string | null
          profile_id: string
          state?: string
          taluk?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          aadhaar_number_hash?: string | null
          bank_account_number_encrypted?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          district?: string
          id?: string
          land_holding_acres?: number | null
          pincode?: string | null
          primary_crop?: string | null
          profile_id?: string
          state?: string
          taluk?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          profile_id: string
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          profile_id: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          profile_id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          centre_id: string
          created_at: string | null
          designation: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          centre_id: string
          created_at?: string | null
          designation?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          centre_id?: string
          created_at?: string | null
          designation?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          failure_reason: string | null
          farmer_id: string
          id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          procurement_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          failure_reason?: string | null
          farmer_id: string
          id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          procurement_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          failure_reason?: string | null
          farmer_id?: string
          id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          procurement_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_procurement_id_fkey"
            columns: ["procurement_id"]
            isOneToOne: true
            referencedRelation: "procurements"
            referencedColumns: ["id"]
          },
        ]
      }
      procurements: {
        Row: {
          booking_id: string
          centre_id: string
          completed_at: string | null
          created_at: string | null
          crop_category: Database["public"]["Enums"]["crop_category"] | null
          crop_name: string
          foreign_matter_percentage: number | null
          gross_weight_kg: number | null
          id: string
          moisture_percentage: number | null
          msp_applicable: number | null
          net_weight_kg: number | null
          operator_id: string | null
          price_per_kg: number | null
          pricing_done_at: string | null
          quality_checked_at: string | null
          quality_grade: Database["public"]["Enums"]["quality_grade"] | null
          quality_notes: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["procurement_status"]
          tare_weight_kg: number | null
          total_amount: number | null
          updated_at: string | null
          weighing_done_at: string | null
        }
        Insert: {
          booking_id: string
          centre_id: string
          completed_at?: string | null
          created_at?: string | null
          crop_category?: Database["public"]["Enums"]["crop_category"] | null
          crop_name: string
          foreign_matter_percentage?: number | null
          gross_weight_kg?: number | null
          id?: string
          moisture_percentage?: number | null
          msp_applicable?: number | null
          net_weight_kg?: number | null
          operator_id?: string | null
          price_per_kg?: number | null
          pricing_done_at?: string | null
          quality_checked_at?: string | null
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          quality_notes?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          tare_weight_kg?: number | null
          total_amount?: number | null
          updated_at?: string | null
          weighing_done_at?: string | null
        }
        Update: {
          booking_id?: string
          centre_id?: string
          completed_at?: string | null
          created_at?: string | null
          crop_category?: Database["public"]["Enums"]["crop_category"] | null
          crop_name?: string
          foreign_matter_percentage?: number | null
          gross_weight_kg?: number | null
          id?: string
          moisture_percentage?: number | null
          msp_applicable?: number | null
          net_weight_kg?: number | null
          operator_id?: string | null
          price_per_kg?: number | null
          pricing_done_at?: string | null
          quality_checked_at?: string | null
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          quality_notes?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          tare_weight_kg?: number | null
          total_amount?: number | null
          updated_at?: string | null
          weighing_done_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurements_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurements_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurements_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          booking_id: string
          called_at: string | null
          centre_id: string
          completed_at: string | null
          created_at: string | null
          estimated_wait_minutes: number | null
          id: string
          position: number
          queue_date: string
          started_at: string | null
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          called_at?: string | null
          centre_id: string
          completed_at?: string | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          position: number
          queue_date: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          called_at?: string | null
          centre_id?: string
          completed_at?: string | null
          created_at?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          position?: number
          queue_date?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          centre_id: string
          created_at: string | null
          current_bookings: number
          date: string
          end_time: string
          id: string
          is_active: boolean | null
          max_bookings: number
          start_time: string
          updated_at: string | null
        }
        Insert: {
          centre_id: string
          created_at?: string | null
          current_bookings?: number
          date: string
          end_time: string
          id?: string
          is_active?: boolean | null
          max_bookings?: number
          start_time: string
          updated_at?: string | null
        }
        Update: {
          centre_id?: string
          created_at?: string | null
          current_bookings?: number
          date?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_bookings?: number
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_farmer_id: { Args: never; Returns: string }
      get_operator_centre_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      booking_status:
        | "PENDING"
        | "CONFIRMED"
        | "CHECKED_IN"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      crop_category:
        | "CEREAL"
        | "PULSE"
        | "OILSEED"
        | "SPICE"
        | "VEGETABLE"
        | "FRUIT"
        | "OTHER"
      notification_status: "PENDING" | "SENT" | "DELIVERED" | "FAILED"
      notification_type: "SMS" | "IN_APP" | "PUSH"
      payment_method: "BANK_TRANSFER" | "UPI" | "CASH" | "CHEQUE"
      payment_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
      procurement_status:
        | "PENDING_QUALITY"
        | "QUALITY_DONE"
        | "PENDING_WEIGHING"
        | "WEIGHING_DONE"
        | "PENDING_PRICING"
        | "PRICING_DONE"
        | "ACCEPTED"
        | "REJECTED"
        | "COMPLETED"
      quality_grade: "A" | "B" | "C" | "D" | "REJECTED"
      queue_status:
        | "WAITING"
        | "CALLED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "SKIPPED"
        | "CANCELLED"
      user_role: "FARMER" | "OPERATOR" | "ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "PENDING",
        "CONFIRMED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      crop_category: [
        "CEREAL",
        "PULSE",
        "OILSEED",
        "SPICE",
        "VEGETABLE",
        "FRUIT",
        "OTHER",
      ],
      notification_status: ["PENDING", "SENT", "DELIVERED", "FAILED"],
      notification_type: ["SMS", "IN_APP", "PUSH"],
      payment_method: ["BANK_TRANSFER", "UPI", "CASH", "CHEQUE"],
      payment_status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      procurement_status: [
        "PENDING_QUALITY",
        "QUALITY_DONE",
        "PENDING_WEIGHING",
        "WEIGHING_DONE",
        "PENDING_PRICING",
        "PRICING_DONE",
        "ACCEPTED",
        "REJECTED",
        "COMPLETED",
      ],
      quality_grade: ["A", "B", "C", "D", "REJECTED"],
      queue_status: [
        "WAITING",
        "CALLED",
        "IN_PROGRESS",
        "COMPLETED",
        "SKIPPED",
        "CANCELLED",
      ],
      user_role: ["FARMER", "OPERATOR", "ADMIN"],
    },
  },
} as const