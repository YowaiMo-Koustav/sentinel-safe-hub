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
      demo_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string
          payload: Json
          played_at: string | null
          scheduled_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label: string
          payload?: Json
          played_at?: string | null
          scheduled_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string
          payload?: Json
          played_at?: string | null
          scheduled_at?: string | null
        }
        Relationships: []
      }
      evacuation_paths: {
        Row: {
          created_at: string
          estimated_seconds: number | null
          from_zone: string
          id: string
          name: string
          status: Database["public"]["Enums"]["path_status"]
          steps: Json
          to_zone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_seconds?: number | null
          from_zone: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["path_status"]
          steps?: Json
          to_zone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_seconds?: number | null
          from_zone?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["path_status"]
          steps?: Json
          to_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          incident_id: string
          message: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          incident_id: string
          message?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          incident_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_updates: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          incident_id: string
          message: string
          new_status: Database["public"]["Enums"]["incident_status"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          incident_id: string
          message: string
          new_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          incident_id?: string
          message?: string
          new_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          created_at: string
          id: string
          note: string | null
          reporter_id: string
          reporter_name: string | null
          resolved_at: string | null
          room: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          source: Database["public"]["Enums"]["incident_source"]
          status: Database["public"]["Enums"]["incident_status"]
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
          zone: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reporter_id: string
          reporter_name?: string | null
          resolved_at?: string | null
          room?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          source?: Database["public"]["Enums"]["incident_source"]
          status?: Database["public"]["Enums"]["incident_status"]
          type: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          zone: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reporter_id?: string
          reporter_name?: string | null
          resolved_at?: string | null
          room?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          source?: Database["public"]["Enums"]["incident_source"]
          status?: Database["public"]["Enums"]["incident_status"]
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_status: {
        Row: {
          id: string
          last_heartbeat: string
          network_ok: boolean
          power_ok: boolean
          responders_available: number
          sensors_online: number
          sensors_total: number
          staff_on_duty: number
          updated_at: string
        }
        Insert: {
          id?: string
          last_heartbeat?: string
          network_ok?: boolean
          power_ok?: boolean
          responders_available?: number
          sensors_online?: number
          sensors_total?: number
          staff_on_duty?: number
          updated_at?: string
        }
        Update: {
          id?: string
          last_heartbeat?: string
          network_ok?: boolean
          power_ok?: boolean
          responders_available?: number
          sensors_online?: number
          sensors_total?: number
          staff_on_duty?: number
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      zones: {
        Row: {
          building: string | null
          capacity: number | null
          created_at: string
          evacuation_path_id: string | null
          floor: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["zone_status"]
          updated_at: string
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          created_at?: string
          evacuation_path_id?: string | null
          floor?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
        }
        Update: {
          building?: string | null
          capacity?: number | null
          created_at?: string
          evacuation_path_id?: string | null
          floor?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["zone_status"]
          updated_at?: string
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
      is_staff_or_above: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "guest" | "staff" | "responder" | "admin"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_source: "guest" | "staff" | "sensor"
      incident_status: "new" | "acknowledged" | "in_progress" | "resolved"
      incident_type:
        | "smoke_fire"
        | "crowd_surge"
        | "fall_injury"
        | "blocked_exit"
        | "power_failure"
        | "network_failure"
        | "suspicious_activity"
        | "other"
      path_status: "clear" | "partial" | "blocked"
      zone_status: "normal" | "caution" | "danger"
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
      app_role: ["guest", "staff", "responder", "admin"],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_source: ["guest", "staff", "sensor"],
      incident_status: ["new", "acknowledged", "in_progress", "resolved"],
      incident_type: [
        "smoke_fire",
        "crowd_surge",
        "fall_injury",
        "blocked_exit",
        "power_failure",
        "network_failure",
        "suspicious_activity",
        "other",
      ],
      path_status: ["clear", "partial", "blocked"],
      zone_status: ["normal", "caution", "danger"],
    },
  },
} as const
