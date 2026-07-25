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
      access_request: {
        Row: {
          action: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          module: string
          reason: string | null
          status: string
          ttl_minutes: number
          user_id: string
        }
        Insert: {
          action: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module: string
          reason?: string | null
          status?: string
          ttl_minutes?: number
          user_id: string
        }
        Update: {
          action?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module?: string
          reason?: string | null
          status?: string
          ttl_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          api_key_secret_name: string | null
          base_url: string | null
          beta_label: string
          created_at: string
          enabled: boolean
          id: number
          max_tokens: number
          model: string
          provider: string
          system_prompt: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key_secret_name?: string | null
          base_url?: string | null
          beta_label?: string
          created_at?: string
          enabled?: boolean
          id?: number
          max_tokens?: number
          model?: string
          provider?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key_secret_name?: string | null
          base_url?: string | null
          beta_label?: string
          created_at?: string
          enabled?: boolean
          id?: number
          max_tokens?: number
          model?: string
          provider?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_conversation: {
        Row: {
          created_at: string
          id: string
          tieu_de: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tieu_de?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tieu_de?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_message: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
          tokens: number | null
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tokens?: number | null
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_message_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversation"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_alert: {
        Row: {
          created_at: string
          detail: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          kind: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          kind: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          kind?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_cai_dat: {
        Row: {
          gia_tri: string | null
          khoa: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          gia_tri?: string | null
          khoa: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          gia_tri?: string | null
          khoa?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          don_vi_id: string | null
          entity: string | null
          entity_id: string | null
          he_thong_id: string | null
          id: string
          ip: unknown
          severity: string
          to_chuc_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          don_vi_id?: string | null
          entity?: string | null
          entity_id?: string | null
          he_thong_id?: string | null
          id?: string
          ip?: unknown
          severity?: string
          to_chuc_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          don_vi_id?: string | null
          entity?: string | null
          entity_id?: string | null
          he_thong_id?: string | null
          id?: string
          ip?: unknown
          severity?: string
          to_chuc_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_event_log: {
        Row: {
          created_at: string
          detail: Json | null
          event: string
          id: string
          ip: unknown
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: Json | null
          event: string
          id?: string
          ip?: unknown
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: Json | null
          event?: string
          id?: string
          ip?: unknown
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_lich_su: {
        Row: {
          created_at: string
          dich: string[]
          dong_bo: Json
          dung_luong: number
          file_path: string | null
          ghi_chu: string | null
          id: string
          loai: string
          so_bang: number
          so_dong: number
          tao_boi: string | null
          tao_boi_ten: string | null
          trang_thai: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dich?: string[]
          dong_bo?: Json
          dung_luong?: number
          file_path?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          so_bang?: number
          so_dong?: number
          tao_boi?: string | null
          tao_boi_ten?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dich?: string[]
          dong_bo?: Json
          dung_luong?: number
          file_path?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          so_bang?: number
          so_dong?: number
          tao_boi?: string | null
          tao_boi_ten?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Relationships: []
      }
      ban_giao: {
        Row: {
          chu_ky_url: string | null
          created_at: string
          da_chap_nhan: boolean
          don_vi_nhan: string | null
          file_bien_ban: string | null
          ghi_chu: string | null
          id: string
          loai_ban_giao: string | null
          ma_ban_giao: string
          ngay_nhan: string
          ngay_tra: string | null
          nguoi_giao: string | null
          nguoi_giao_id: string | null
          nguoi_nhan: string | null
          nguoi_nhan_id: string | null
          snapshot_don_vi: string | null
          snapshot_he_thong: string | null
          snapshot_ma_thiet_bi: string | null
          snapshot_ten_thiet_bi: string | null
          snapshot_vi_tri: string | null
          thiet_bi: string
          thiet_bi_id: string | null
          thoi_diem_chap_nhan: string | null
          tinh_trang_khi_nhan: string | null
          tinh_trang_khi_tra: string | null
          trang_thai: string | null
          updated_at: string
        }
        Insert: {
          chu_ky_url?: string | null
          created_at?: string
          da_chap_nhan?: boolean
          don_vi_nhan?: string | null
          file_bien_ban?: string | null
          ghi_chu?: string | null
          id?: string
          loai_ban_giao?: string | null
          ma_ban_giao: string
          ngay_nhan?: string
          ngay_tra?: string | null
          nguoi_giao?: string | null
          nguoi_giao_id?: string | null
          nguoi_nhan?: string | null
          nguoi_nhan_id?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thiet_bi: string
          thiet_bi_id?: string | null
          thoi_diem_chap_nhan?: string | null
          tinh_trang_khi_nhan?: string | null
          tinh_trang_khi_tra?: string | null
          trang_thai?: string | null
          updated_at?: string
        }
        Update: {
          chu_ky_url?: string | null
          created_at?: string
          da_chap_nhan?: boolean
          don_vi_nhan?: string | null
          file_bien_ban?: string | null
          ghi_chu?: string | null
          id?: string
          loai_ban_giao?: string | null
          ma_ban_giao?: string
          ngay_nhan?: string
          ngay_tra?: string | null
          nguoi_giao?: string | null
          nguoi_giao_id?: string | null
          nguoi_nhan?: string | null
          nguoi_nhan_id?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thiet_bi?: string
          thiet_bi_id?: string | null
          thoi_diem_chap_nhan?: string | null
          tinh_trang_khi_nhan?: string | null
          tinh_trang_khi_tra?: string | null
          trang_thai?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bang_cot_tuy_chinh: {
        Row: {
          bang_key: string
          cau_hinh: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bang_key: string
          cau_hinh?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bang_key?: string
          cau_hinh?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bao_cao_annotation: {
        Row: {
          cap_nhat_luc: string
          he_thong_id: string | null
          id: string
          loai: Database["public"]["Enums"]["bao_cao_annotation_loai"]
          mau: string | null
          mo_ta: string | null
          tao_boi: string | null
          tao_luc: string
          thoi_diem: string
          tieu_de: string
        }
        Insert: {
          cap_nhat_luc?: string
          he_thong_id?: string | null
          id?: string
          loai?: Database["public"]["Enums"]["bao_cao_annotation_loai"]
          mau?: string | null
          mo_ta?: string | null
          tao_boi?: string | null
          tao_luc?: string
          thoi_diem: string
          tieu_de: string
        }
        Update: {
          cap_nhat_luc?: string
          he_thong_id?: string | null
          id?: string
          loai?: Database["public"]["Enums"]["bao_cao_annotation_loai"]
          mau?: string | null
          mo_ta?: string | null
          tao_boi?: string | null
          tao_luc?: string
          thoi_diem?: string
          tieu_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "bao_cao_annotation_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_cao_annotation_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
        ]
      }
      bao_tri: {
        Row: {
          chi_phi: number | null
          created_at: string
          don_vi: string | null
          don_vi_thuc_hien: string | null
          file_bien_ban: string | null
          he_thong: string | null
          he_thong_id: string | null
          id: string
          ke_hoach: string | null
          ket_qua: string | null
          loai_bao_tri: string | null
          luu_tru: boolean
          ma_bao_tri: string
          mo_ta_cong_viec: string | null
          ngay_bat_dau: string
          ngay_hoan_thanh: string | null
          nguoi_thuc_hien: string[] | null
          snapshot_don_vi: string | null
          snapshot_he_thong: string | null
          snapshot_ma_thiet_bi: string | null
          snapshot_ten_thiet_bi: string | null
          snapshot_vi_tri: string | null
          thanh_phan_id: string | null
          thiet_bi: string
          thiet_bi_id: string | null
          trang_thai: string | null
          updated_at: string
        }
        Insert: {
          chi_phi?: number | null
          created_at?: string
          don_vi?: string | null
          don_vi_thuc_hien?: string | null
          file_bien_ban?: string | null
          he_thong?: string | null
          he_thong_id?: string | null
          id?: string
          ke_hoach?: string | null
          ket_qua?: string | null
          loai_bao_tri?: string | null
          luu_tru?: boolean
          ma_bao_tri: string
          mo_ta_cong_viec?: string | null
          ngay_bat_dau?: string
          ngay_hoan_thanh?: string | null
          nguoi_thuc_hien?: string[] | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thanh_phan_id?: string | null
          thiet_bi: string
          thiet_bi_id?: string | null
          trang_thai?: string | null
          updated_at?: string
        }
        Update: {
          chi_phi?: number | null
          created_at?: string
          don_vi?: string | null
          don_vi_thuc_hien?: string | null
          file_bien_ban?: string | null
          he_thong?: string | null
          he_thong_id?: string | null
          id?: string
          ke_hoach?: string | null
          ket_qua?: string | null
          loai_bao_tri?: string | null
          luu_tru?: boolean
          ma_bao_tri?: string
          mo_ta_cong_viec?: string | null
          ngay_bat_dau?: string
          ngay_hoan_thanh?: string | null
          nguoi_thuc_hien?: string[] | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thanh_phan_id?: string | null
          thiet_bi?: string
          thiet_bi_id?: string | null
          trang_thai?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bao_tri_chinh_sach: {
        Row: {
          active: boolean
          advance_days: number
          canh_bao_truoc_ngay: number
          chu_ky_gia_tri: number | null
          chu_ky_gio_chay: number | null
          chu_ky_loai: string
          chu_ky_ngay: number | null
          created_at: string
          created_by: string | null
          he_thong_id: string | null
          id: string
          lan_gan_nhat_at: string | null
          lan_gan_nhat_metric: number | null
          loai_thiet_bi_id: string | null
          metric_field: string | null
          mo_ta: string | null
          model_id: string | null
          nguoi_phu_trach_id: string | null
          noi_dung: string | null
          priority: number
          ten: string
          thiet_bi_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          advance_days?: number
          canh_bao_truoc_ngay?: number
          chu_ky_gia_tri?: number | null
          chu_ky_gio_chay?: number | null
          chu_ky_loai?: string
          chu_ky_ngay?: number | null
          created_at?: string
          created_by?: string | null
          he_thong_id?: string | null
          id?: string
          lan_gan_nhat_at?: string | null
          lan_gan_nhat_metric?: number | null
          loai_thiet_bi_id?: string | null
          metric_field?: string | null
          mo_ta?: string | null
          model_id?: string | null
          nguoi_phu_trach_id?: string | null
          noi_dung?: string | null
          priority?: number
          ten: string
          thiet_bi_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          advance_days?: number
          canh_bao_truoc_ngay?: number
          chu_ky_gia_tri?: number | null
          chu_ky_gio_chay?: number | null
          chu_ky_loai?: string
          chu_ky_ngay?: number | null
          created_at?: string
          created_by?: string | null
          he_thong_id?: string | null
          id?: string
          lan_gan_nhat_at?: string | null
          lan_gan_nhat_metric?: number | null
          loai_thiet_bi_id?: string | null
          metric_field?: string | null
          mo_ta?: string | null
          model_id?: string | null
          nguoi_phu_trach_id?: string | null
          noi_dung?: string | null
          priority?: number
          ten?: string
          thiet_bi_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bao_tri_chinh_sach_loai_thiet_bi_id_fkey"
            columns: ["loai_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bao_tri_chinh_sach_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      canh_bao_het_han_log: {
        Row: {
          created_at: string
          id: string
          khoa: string
          loai: string
          ngay_het_han: string
          nguong: number
          so_nguoi_nhan: number
          thiet_bi_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          khoa: string
          loai: string
          ngay_het_han: string
          nguong: number
          so_nguoi_nhan?: number
          thiet_bi_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          khoa?: string
          loai?: string
          ngay_het_han?: string
          nguong?: number
          so_nguoi_nhan?: number
          thiet_bi_id?: string | null
        }
        Relationships: []
      }
      cay_node_edit: {
        Row: {
          created_at: string
          created_by: string | null
          don_vi_ma: string | null
          du_lieu: Json
          id: string
          kind: string
          ma: string
          ten: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_vi_ma?: string | null
          du_lieu?: Json
          id?: string
          kind: string
          ma: string
          ten?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_vi_ma?: string | null
          du_lieu?: Json
          id?: string
          kind?: string
          ma?: string
          ten?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cay_thay_doi: {
        Row: {
          created_at: string
          da_ap_dung: boolean
          da_hoan_tac: boolean
          duyet_luc: string | null
          he_thong_id: string | null
          id: string
          loai: string
          mo_ta: string | null
          nguoi_duyet: string | null
          nguoi_tao: string | null
          payload: Json
          snapshot_cu: Json
          trang_thai: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          da_ap_dung?: boolean
          da_hoan_tac?: boolean
          duyet_luc?: string | null
          he_thong_id?: string | null
          id?: string
          loai: string
          mo_ta?: string | null
          nguoi_duyet?: string | null
          nguoi_tao?: string | null
          payload?: Json
          snapshot_cu?: Json
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          da_ap_dung?: boolean
          da_hoan_tac?: boolean
          duyet_luc?: string | null
          he_thong_id?: string | null
          id?: string
          loai?: string
          mo_ta?: string | null
          nguoi_duyet?: string | null
          nguoi_tao?: string | null
          payload?: Json
          snapshot_cu?: Json
          trang_thai?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_request: {
        Row: {
          applied_audit_id: string | null
          created_at: string
          error_message: string | null
          ghi_chu: string | null
          id: string
          loai: Database["public"]["Enums"]["change_request_loai"]
          ly_do: string | null
          nguoi_tao: string
          payload: Json
          resolved_at: string | null
          resolved_by: string | null
          trang_thai: Database["public"]["Enums"]["change_request_status"]
          updated_at: string
        }
        Insert: {
          applied_audit_id?: string | null
          created_at?: string
          error_message?: string | null
          ghi_chu?: string | null
          id?: string
          loai: Database["public"]["Enums"]["change_request_loai"]
          ly_do?: string | null
          nguoi_tao: string
          payload: Json
          resolved_at?: string | null
          resolved_by?: string | null
          trang_thai?: Database["public"]["Enums"]["change_request_status"]
          updated_at?: string
        }
        Update: {
          applied_audit_id?: string | null
          created_at?: string
          error_message?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: Database["public"]["Enums"]["change_request_loai"]
          ly_do?: string | null
          nguoi_tao?: string
          payload?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          trang_thai?: Database["public"]["Enums"]["change_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      chung_chi_thiet_bi: {
        Row: {
          created_at: string
          created_by: string | null
          ghi_chu: string | null
          id: string
          loai: string
          ngay_bat_dau: string | null
          ngay_het_han: string | null
          so_giay_chung_nhan: string
          thiet_bi_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ghi_chu?: string | null
          id?: string
          loai: string
          ngay_bat_dau?: string | null
          ngay_het_han?: string | null
          so_giay_chung_nhan: string
          thiet_bi_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          ngay_bat_dau?: string | null
          ngay_het_han?: string | null
          so_giay_chung_nhan?: string
          thiet_bi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chung_chi_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "chung_chi_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chung_chi_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      cong_viec_bao_tri: {
        Row: {
          bao_tri_id: string | null
          bat_buoc: boolean
          can_phe_duyet: boolean
          chinh_sach_id: string | null
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          he_thong_id: string | null
          id: string
          ke_hoach_rollback: string | null
          loai: string
          luu_tru: boolean
          ma_cong_viec: string | null
          mo_ta: string | null
          ngay_bat_dau: string | null
          ngay_den_han: string | null
          ngay_hoan_thanh: string | null
          nguoi_phe_duyet: string | null
          nguoi_phu_trach: string | null
          phe_duyet_at: string | null
          su_co_id: string | null
          thiet_bi_id: string | null
          trang_thai: string
          trang_thai_phe_duyet: string
          updated_at: string
          uu_tien: string
          van_de_id: string | null
        }
        Insert: {
          bao_tri_id?: string | null
          bat_buoc?: boolean
          can_phe_duyet?: boolean
          chinh_sach_id?: string | null
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          he_thong_id?: string | null
          id?: string
          ke_hoach_rollback?: string | null
          loai?: string
          luu_tru?: boolean
          ma_cong_viec?: string | null
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_den_han?: string | null
          ngay_hoan_thanh?: string | null
          nguoi_phe_duyet?: string | null
          nguoi_phu_trach?: string | null
          phe_duyet_at?: string | null
          su_co_id?: string | null
          thiet_bi_id?: string | null
          trang_thai?: string
          trang_thai_phe_duyet?: string
          updated_at?: string
          uu_tien?: string
          van_de_id?: string | null
        }
        Update: {
          bao_tri_id?: string | null
          bat_buoc?: boolean
          can_phe_duyet?: boolean
          chinh_sach_id?: string | null
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          he_thong_id?: string | null
          id?: string
          ke_hoach_rollback?: string | null
          loai?: string
          luu_tru?: boolean
          ma_cong_viec?: string | null
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_den_han?: string | null
          ngay_hoan_thanh?: string | null
          nguoi_phe_duyet?: string | null
          nguoi_phu_trach?: string | null
          phe_duyet_at?: string | null
          su_co_id?: string | null
          thiet_bi_id?: string | null
          trang_thai?: string
          trang_thai_phe_duyet?: string
          updated_at?: string
          uu_tien?: string
          van_de_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cong_viec_bao_tri_bao_tri_id_fkey"
            columns: ["bao_tri_id"]
            isOneToOne: false
            referencedRelation: "bao_tri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_chinh_sach_id_fkey"
            columns: ["chinh_sach_id"]
            isOneToOne: false
            referencedRelation: "bao_tri_chinh_sach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_su_co_id_fkey"
            columns: ["su_co_id"]
            isOneToOne: false
            referencedRelation: "su_co"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_van_de_id_fkey"
            columns: ["van_de_id"]
            isOneToOne: false
            referencedRelation: "v_van_de"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cong_viec_bao_tri_van_de_id_fkey"
            columns: ["van_de_id"]
            isOneToOne: false
            referencedRelation: "van_de"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participant: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participant_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          last_message_at: string
          ten: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          last_message_at?: string
          ten?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          last_message_at?: string
          ten?: string | null
        }
        Relationships: []
      }
      dinh_nghia_truong: {
        Row: {
          ap_dung_cho: string
          bat_buoc: boolean
          created_at: string
          created_by: string | null
          id: string
          key: string
          kich_hoat: boolean
          loai: string
          lua_chon: Json | null
          max_so: number | null
          min_so: number | null
          mo_ta: string | null
          nhan: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          ap_dung_cho: string
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          kich_hoat?: boolean
          loai: string
          lua_chon?: Json | null
          max_so?: number | null
          min_so?: number | null
          mo_ta?: string | null
          nhan: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          ap_dung_cho?: string
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          kich_hoat?: boolean
          loai?: string
          lua_chon?: Json | null
          max_so?: number | null
          min_so?: number | null
          mo_ta?: string | null
          nhan?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: []
      }
      dm_dac_tinh: {
        Row: {
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          mau: string | null
          merged_into: string | null
          mo_ta: string | null
          nhom: string
          ten: string
          thu_tu: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          mau?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          nhom?: string
          ten: string
          thu_tu?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          mau?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          nhom?: string
          ten?: string
          thu_tu?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_dac_tinh_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_dac_tinh"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_danh_gia_nien_han: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_danh_gia_nien_han_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_danh_gia_nien_han"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_don_vi: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          parent_id: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          parent_id?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          parent_id?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_don_vi_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_don_vi_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_he_thong: {
        Row: {
          active: boolean
          attrs: Json
          created_at: string
          deactivated_at: string | null
          dia_diem_dat_gp: string | null
          don_vi_id: string | null
          giay_phep_khai_thac: string | null
          gp_cu_bai_bo: string | null
          gp_han: string | null
          gp_ngay_cap: string | null
          gp_so: string | null
          id: string
          kieu_thiet_bi_gp: string | null
          ma: string
          ma_dia_chi_kt_gp: string | null
          ma_tai_san_bravo: string | null
          merged_into: string | null
          mo_ta: string | null
          muc_dich_gp: string | null
          nam_sx_theo_gp: string | null
          nhom_he_thong_id: string | null
          noi_san_xuat_gp: string | null
          pham_vi_hoat_dong_gp: string | null
          pham_vi_quan_ly: string
          phan_loai_id: string | null
          so_san_xuat_gp: string | null
          ten: string
          ten_he_thong_theo_gp: string | null
          thanh_phan_theo_gp: string | null
          thoi_gian_hoat_dong_gp: string | null
          thu_tu: number
          tinh_nang_ky_thuat: string | null
          to_chuc_id: string | null
          to_chuc_so_huu: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          attrs?: Json
          created_at?: string
          deactivated_at?: string | null
          dia_diem_dat_gp?: string | null
          don_vi_id?: string | null
          giay_phep_khai_thac?: string | null
          gp_cu_bai_bo?: string | null
          gp_han?: string | null
          gp_ngay_cap?: string | null
          gp_so?: string | null
          id?: string
          kieu_thiet_bi_gp?: string | null
          ma: string
          ma_dia_chi_kt_gp?: string | null
          ma_tai_san_bravo?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          muc_dich_gp?: string | null
          nam_sx_theo_gp?: string | null
          nhom_he_thong_id?: string | null
          noi_san_xuat_gp?: string | null
          pham_vi_hoat_dong_gp?: string | null
          pham_vi_quan_ly?: string
          phan_loai_id?: string | null
          so_san_xuat_gp?: string | null
          ten: string
          ten_he_thong_theo_gp?: string | null
          thanh_phan_theo_gp?: string | null
          thoi_gian_hoat_dong_gp?: string | null
          thu_tu?: number
          tinh_nang_ky_thuat?: string | null
          to_chuc_id?: string | null
          to_chuc_so_huu?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          attrs?: Json
          created_at?: string
          deactivated_at?: string | null
          dia_diem_dat_gp?: string | null
          don_vi_id?: string | null
          giay_phep_khai_thac?: string | null
          gp_cu_bai_bo?: string | null
          gp_han?: string | null
          gp_ngay_cap?: string | null
          gp_so?: string | null
          id?: string
          kieu_thiet_bi_gp?: string | null
          ma?: string
          ma_dia_chi_kt_gp?: string | null
          ma_tai_san_bravo?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          muc_dich_gp?: string | null
          nam_sx_theo_gp?: string | null
          nhom_he_thong_id?: string | null
          noi_san_xuat_gp?: string | null
          pham_vi_hoat_dong_gp?: string | null
          pham_vi_quan_ly?: string
          phan_loai_id?: string | null
          so_san_xuat_gp?: string | null
          ten?: string
          ten_he_thong_theo_gp?: string | null
          thanh_phan_theo_gp?: string | null
          thoi_gian_hoat_dong_gp?: string | null
          thu_tu?: number
          tinh_nang_ky_thuat?: string | null
          to_chuc_id?: string | null
          to_chuc_so_huu?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_he_thong_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_nhom_he_thong_id_fkey"
            columns: ["nhom_he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_nhom_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_phan_loai_id_fkey"
            columns: ["phan_loai_id"]
            isOneToOne: false
            referencedRelation: "dm_phan_loai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_to_chuc_id_fkey"
            columns: ["to_chuc_id"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_loai_giay_phep: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_loai_giay_phep_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_loai_giay_phep"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_loai_lien_ket: {
        Row: {
          active: boolean
          co_huong: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          kieu_net: string
          lan_truyen_tac_dong: boolean
          ma: string
          mau_sac: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          co_huong?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          kieu_net?: string
          lan_truyen_tac_dong?: boolean
          ma: string
          mau_sac?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          co_huong?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          kieu_net?: string
          lan_truyen_tac_dong?: boolean
          ma?: string
          mau_sac?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_loai_lien_ket_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_loai_lien_ket"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_loai_thiet_bi: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          mau: string | null
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          mau?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          mau?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_loai_thiet_bi_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_model: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          field_set_id: string | null
          hinh_anh: string | null
          id: string
          loai_thiet_bi_id: string | null
          ma: string | null
          merged_into: string | null
          mo_ta: string | null
          nha_san_xuat_id: string | null
          p_n: string | null
          so_model: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          field_set_id?: string | null
          hinh_anh?: string | null
          id?: string
          loai_thiet_bi_id?: string | null
          ma?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          nha_san_xuat_id?: string | null
          p_n?: string | null
          so_model?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          field_set_id?: string | null
          hinh_anh?: string | null
          id?: string
          loai_thiet_bi_id?: string | null
          ma?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          nha_san_xuat_id?: string | null
          p_n?: string | null
          so_model?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_model_field_set_id_fkey"
            columns: ["field_set_id"]
            isOneToOne: false
            referencedRelation: "field_set"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_model_loai_thiet_bi_id_fkey"
            columns: ["loai_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_model_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_model_nha_san_xuat_id_fkey"
            columns: ["nha_san_xuat_id"]
            isOneToOne: false
            referencedRelation: "dm_nha_san_xuat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_model_nha_san_xuat_id_fkey"
            columns: ["nha_san_xuat_id"]
            isOneToOne: false
            referencedRelation: "v_nsx_stats"
            referencedColumns: ["nha_san_xuat_id"]
          },
        ]
      }
      dm_model_dac_tinh: {
        Row: {
          created_at: string
          dac_tinh_id: string
          model_id: string
        }
        Insert: {
          created_at?: string
          dac_tinh_id: string
          model_id: string
        }
        Update: {
          created_at?: string
          dac_tinh_id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_model_dac_tinh_dac_tinh_id_fkey"
            columns: ["dac_tinh_id"]
            isOneToOne: false
            referencedRelation: "dm_dac_tinh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_model_dac_tinh_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "dm_model"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_nha_cung_cap: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_nha_cung_cap_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_nha_cung_cap"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_nha_san_xuat: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          ghi_chu: string | null
          id: string
          logo: string | null
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          trang_web: string | null
          updated_at: string
          xuat_xu: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          ghi_chu?: string | null
          id?: string
          logo?: string | null
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          trang_web?: string | null
          updated_at?: string
          xuat_xu?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          ghi_chu?: string | null
          id?: string
          logo?: string | null
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          trang_web?: string | null
          updated_at?: string
          xuat_xu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_nha_san_xuat_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_nha_san_xuat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_nha_san_xuat_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "v_nsx_stats"
            referencedColumns: ["nha_san_xuat_id"]
          },
        ]
      }
      dm_nhom_he_thong: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          phan_loai_id: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          phan_loai_id?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          phan_loai_id?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_nhom_he_thong_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_nhom_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_nhom_he_thong_phan_loai_id_fkey"
            columns: ["phan_loai_id"]
            isOneToOne: false
            referencedRelation: "dm_phan_loai"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_noi_cap: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_noi_cap_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_noi_cap"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_phan_loai: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string | null
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string | null
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_phan_loai_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_phan_loai"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_to_chuc: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          ghi_chu: string | null
          id: string
          loai: string
          ma: string
          mau_sac: string | null
          merged_into: string | null
          ten: string
          thu_tu: number
          to_chuc_cha_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          ghi_chu?: string | null
          id?: string
          loai: string
          ma: string
          mau_sac?: string | null
          merged_into?: string | null
          ten: string
          thu_tu?: number
          to_chuc_cha_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          ghi_chu?: string | null
          id?: string
          loai?: string
          ma?: string
          mau_sac?: string | null
          merged_into?: string | null
          ten?: string
          thu_tu?: number
          to_chuc_cha_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_to_chuc_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_to_chuc_to_chuc_cha_id_fkey"
            columns: ["to_chuc_cha_id"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_trang_thai_thiet_bi: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          la_ngung_khai_thac: boolean
          ma: string
          merged_into: string | null
          mo_ta: string | null
          ten: string
          thu_tu: number
          updated_at: string
          yeu_cau_gan_slot: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          la_ngung_khai_thac?: boolean
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
          yeu_cau_gan_slot?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          la_ngung_khai_thac?: boolean
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
          yeu_cau_gan_slot?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dm_trang_thai_thiet_bi_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_trang_thai_thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_vi_tri: {
        Row: {
          active: boolean
          created_at: string
          deactivated_at: string | null
          id: string
          ma: string
          merged_into: string | null
          mo_ta: string | null
          parent_id: string | null
          ten: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma: string
          merged_into?: string | null
          mo_ta?: string | null
          parent_id?: string | null
          ten: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deactivated_at?: string | null
          id?: string
          ma?: string
          merged_into?: string | null
          mo_ta?: string | null
          parent_id?: string | null
          ten?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_vi_tri_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "dm_vi_tri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_vi_tri_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dm_vi_tri"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_bao_duong: {
        Row: {
          created_at: string
          den_ngay: string | null
          id: string
          ky: number
          mo_ta: string | null
          nam: number
          nguoi_tao: string | null
          ten: string
          trang_thai: Database["public"]["Enums"]["dot_bao_duong_trang_thai"]
          tu_ngay: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          den_ngay?: string | null
          id?: string
          ky: number
          mo_ta?: string | null
          nam: number
          nguoi_tao?: string | null
          ten: string
          trang_thai?: Database["public"]["Enums"]["dot_bao_duong_trang_thai"]
          tu_ngay?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          den_ngay?: string | null
          id?: string
          ky?: number
          mo_ta?: string | null
          nam?: number
          nguoi_tao?: string | null
          ten?: string
          trang_thai?: Database["public"]["Enums"]["dot_bao_duong_trang_thai"]
          tu_ngay?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dot_bao_duong_bien_ban: {
        Row: {
          created_at: string
          form_submission_id: string
          hang_muc_id: string
          id: string
        }
        Insert: {
          created_at?: string
          form_submission_id: string
          hang_muc_id: string
          id?: string
        }
        Update: {
          created_at?: string
          form_submission_id?: string
          hang_muc_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dot_bao_duong_bien_ban_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_bien_ban_hang_muc_id_fkey"
            columns: ["hang_muc_id"]
            isOneToOne: false
            referencedRelation: "dot_bao_duong_hang_muc"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_bao_duong_han: {
        Row: {
          created_at: string
          don_vi_id: string
          dot_id: string
          han_ngay: string
          id: string
          mo_ta: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          don_vi_id: string
          dot_id: string
          han_ngay: string
          id?: string
          mo_ta?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          don_vi_id?: string
          dot_id?: string
          han_ngay?: string
          id?: string
          mo_ta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dot_bao_duong_han_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_han_dot_id_fkey"
            columns: ["dot_id"]
            isOneToOne: false
            referencedRelation: "dot_bao_duong"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_bao_duong_hang_muc: {
        Row: {
          approval_note: string | null
          approved_at: string | null
          approved_by: string | null
          bat_buoc: boolean
          created_at: string
          don_vi_id: string
          dot_id: string
          duyet_trang_thai: string
          ghi_chu_kt: string | null
          han_hoan_thanh: string | null
          he_thong_id: string
          id: string
          ket_qua:
            | Database["public"]["Enums"]["dot_bao_duong_hm_ket_qua"]
            | null
          kien_nghi: string | null
          ngay_hoan_thanh: string | null
          nguoi_thuc_hien: string | null
          nguon: Database["public"]["Enums"]["dot_bao_duong_hm_nguon"]
          submitted_at: string | null
          submitted_by: string | null
          ton_tai: string | null
          trang_thai: Database["public"]["Enums"]["dot_bao_duong_hm_trang_thai"]
          updated_at: string
        }
        Insert: {
          approval_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bat_buoc?: boolean
          created_at?: string
          don_vi_id: string
          dot_id: string
          duyet_trang_thai?: string
          ghi_chu_kt?: string | null
          han_hoan_thanh?: string | null
          he_thong_id: string
          id?: string
          ket_qua?:
            | Database["public"]["Enums"]["dot_bao_duong_hm_ket_qua"]
            | null
          kien_nghi?: string | null
          ngay_hoan_thanh?: string | null
          nguoi_thuc_hien?: string | null
          nguon?: Database["public"]["Enums"]["dot_bao_duong_hm_nguon"]
          submitted_at?: string | null
          submitted_by?: string | null
          ton_tai?: string | null
          trang_thai?: Database["public"]["Enums"]["dot_bao_duong_hm_trang_thai"]
          updated_at?: string
        }
        Update: {
          approval_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bat_buoc?: boolean
          created_at?: string
          don_vi_id?: string
          dot_id?: string
          duyet_trang_thai?: string
          ghi_chu_kt?: string | null
          han_hoan_thanh?: string | null
          he_thong_id?: string
          id?: string
          ket_qua?:
            | Database["public"]["Enums"]["dot_bao_duong_hm_ket_qua"]
            | null
          kien_nghi?: string | null
          ngay_hoan_thanh?: string | null
          nguoi_thuc_hien?: string | null
          nguon?: Database["public"]["Enums"]["dot_bao_duong_hm_nguon"]
          submitted_at?: string | null
          submitted_by?: string | null
          ton_tai?: string | null
          trang_thai?: Database["public"]["Enums"]["dot_bao_duong_hm_trang_thai"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dot_bao_duong_hang_muc_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_hang_muc_dot_id_fkey"
            columns: ["dot_id"]
            isOneToOne: false
            referencedRelation: "dot_bao_duong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_hang_muc_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_hang_muc_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_bao_duong_su_co: {
        Row: {
          created_at: string
          ghi_chu: string | null
          hang_muc_id: string
          hong_hoc_id: string | null
          id: string
          su_co_id: string | null
        }
        Insert: {
          created_at?: string
          ghi_chu?: string | null
          hang_muc_id: string
          hong_hoc_id?: string | null
          id?: string
          su_co_id?: string | null
        }
        Update: {
          created_at?: string
          ghi_chu?: string | null
          hang_muc_id?: string
          hong_hoc_id?: string | null
          id?: string
          su_co_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dot_bao_duong_su_co_hang_muc_id_fkey"
            columns: ["hang_muc_id"]
            isOneToOne: false
            referencedRelation: "dot_bao_duong_hang_muc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_su_co_hong_hoc_id_fkey"
            columns: ["hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dot_bao_duong_su_co_su_co_id_fkey"
            columns: ["su_co_id"]
            isOneToOne: false
            referencedRelation: "su_co"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_bao_duong_tep: {
        Row: {
          created_at: string
          duong_dan: string
          hang_muc_id: string
          id: string
          loai: string | null
          nguoi_up: string | null
          ten_goc: string | null
        }
        Insert: {
          created_at?: string
          duong_dan: string
          hang_muc_id: string
          id?: string
          loai?: string | null
          nguoi_up?: string | null
          ten_goc?: string | null
        }
        Update: {
          created_at?: string
          duong_dan?: string
          hang_muc_id?: string
          id?: string
          loai?: string | null
          nguoi_up?: string | null
          ten_goc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dot_bao_duong_tep_hang_muc_id_fkey"
            columns: ["hang_muc_id"]
            isOneToOne: false
            referencedRelation: "dot_bao_duong_hang_muc"
            referencedColumns: ["id"]
          },
        ]
      }
      du_an: {
        Row: {
          attrs: Json
          created_at: string
          don_vi_id: string | null
          id: string
          ma: string | null
          mo_ta: string | null
          ngay_bat_dau: string | null
          ngay_ket_thuc_du_kien: string | null
          nguoi_tao_id: string
          quan_ly_id: string
          ten: string
          tien_do: number
          trang_thai: Database["public"]["Enums"]["du_an_trang_thai"]
          updated_at: string
        }
        Insert: {
          attrs?: Json
          created_at?: string
          don_vi_id?: string | null
          id?: string
          ma?: string | null
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_ket_thuc_du_kien?: string | null
          nguoi_tao_id: string
          quan_ly_id: string
          ten: string
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["du_an_trang_thai"]
          updated_at?: string
        }
        Update: {
          attrs?: Json
          created_at?: string
          don_vi_id?: string | null
          id?: string
          ma?: string | null
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_ket_thuc_du_kien?: string | null
          nguoi_tao_id?: string
          quan_ly_id?: string
          ten?: string
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["du_an_trang_thai"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "du_an_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      du_an_cong_viec: {
        Row: {
          created_at: string
          created_by: string | null
          du_an_id: string
          id: string
          ket_qua: string | null
          mo_ta: string | null
          moc_id: string
          ngay_bat_dau: string | null
          ngay_hoan_thanh_thuc_te: string | null
          ngay_ket_thuc_du_kien: string | null
          nguoi_xu_ly_chinh: string | null
          ten: string
          tien_do: number
          trang_thai: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          du_an_id: string
          id?: string
          ket_qua?: string | null
          mo_ta?: string | null
          moc_id: string
          ngay_bat_dau?: string | null
          ngay_hoan_thanh_thuc_te?: string | null
          ngay_ket_thuc_du_kien?: string | null
          nguoi_xu_ly_chinh?: string | null
          ten: string
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          du_an_id?: string
          id?: string
          ket_qua?: string | null
          mo_ta?: string | null
          moc_id?: string
          ngay_bat_dau?: string | null
          ngay_hoan_thanh_thuc_te?: string | null
          ngay_ket_thuc_du_kien?: string | null
          nguoi_xu_ly_chinh?: string | null
          ten?: string
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "du_an_cong_viec_du_an_id_fkey"
            columns: ["du_an_id"]
            isOneToOne: false
            referencedRelation: "du_an"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "du_an_cong_viec_moc_id_fkey"
            columns: ["moc_id"]
            isOneToOne: false
            referencedRelation: "du_an_moc"
            referencedColumns: ["id"]
          },
        ]
      }
      du_an_cong_viec_phoi_hop: {
        Row: {
          added_at: string
          added_by: string | null
          cong_viec_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          cong_viec_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          cong_viec_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "du_an_cong_viec_phoi_hop_cong_viec_id_fkey"
            columns: ["cong_viec_id"]
            isOneToOne: false
            referencedRelation: "du_an_cong_viec"
            referencedColumns: ["id"]
          },
        ]
      }
      du_an_moc: {
        Row: {
          created_at: string
          created_by: string | null
          du_an_id: string
          id: string
          mo_ta: string | null
          ngay_bat_dau: string | null
          ngay_ket_thuc_du_kien: string | null
          ten: string
          thu_tu: number
          tien_do: number
          trang_thai: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          du_an_id: string
          id?: string
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_ket_thuc_du_kien?: string | null
          ten: string
          thu_tu?: number
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          du_an_id?: string
          id?: string
          mo_ta?: string | null
          ngay_bat_dau?: string | null
          ngay_ket_thuc_du_kien?: string | null
          ten?: string
          thu_tu?: number
          tien_do?: number
          trang_thai?: Database["public"]["Enums"]["cong_viec_trang_thai"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "du_an_moc_du_an_id_fkey"
            columns: ["du_an_id"]
            isOneToOne: false
            referencedRelation: "du_an"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          feature: string
          id: string
          params: Json | null
          path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          feature: string
          id?: string
          params?: Json | null
          path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          feature?: string
          id?: string
          params?: Json | null
          path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      field_set: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mo_ta: string | null
          ten: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mo_ta?: string | null
          ten: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mo_ta?: string | null
          ten?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_set_item: {
        Row: {
          created_at: string
          field_key: string
          field_set_id: string
          id: string
          thu_tu: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_key: string
          field_set_id: string
          id?: string
          thu_tu?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_key?: string
          field_set_id?: string
          id?: string
          thu_tu?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_set_item_field_set_id_fkey"
            columns: ["field_set_id"]
            isOneToOne: false
            referencedRelation: "field_set"
            referencedColumns: ["id"]
          },
        ]
      }
      form_check_item: {
        Row: {
          bat_buoc: boolean
          created_at: string
          don_vi: string | null
          huong_dan: string | null
          id: string
          item_code: string
          position: number
          result_kind: Database["public"]["Enums"]["form_result_kind"]
          section_id: string
          template_id: string
          ten: string
          tieu_chuan: string | null
          tuy_chon: Json | null
          updated_at: string
        }
        Insert: {
          bat_buoc?: boolean
          created_at?: string
          don_vi?: string | null
          huong_dan?: string | null
          id?: string
          item_code: string
          position?: number
          result_kind?: Database["public"]["Enums"]["form_result_kind"]
          section_id: string
          template_id: string
          ten: string
          tieu_chuan?: string | null
          tuy_chon?: Json | null
          updated_at?: string
        }
        Update: {
          bat_buoc?: boolean
          created_at?: string
          don_vi?: string | null
          huong_dan?: string | null
          id?: string
          item_code?: string
          position?: number
          result_kind?: Database["public"]["Enums"]["form_result_kind"]
          section_id?: string
          template_id?: string
          ten?: string
          tieu_chuan?: string | null
          tuy_chon?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_check_item_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "form_section"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_check_item_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field: {
        Row: {
          col_span: number
          columns: Json | null
          constraint_formula: string | null
          constraint_message: string | null
          created_at: string
          default_value: Json | null
          formula: string | null
          help_text: string | null
          id: string
          key: string
          kind: Database["public"]["Enums"]["form_field_kind"]
          label: string
          max_value: number | null
          min_value: number | null
          nhom: string | null
          options: Json | null
          placeholder: string | null
          position: number
          ratings: Json | null
          required: boolean
          required_if: Json | null
          template_id: string
          tieu_chuan: string | null
          unit: string | null
          updated_at: string
          visible_if: Json | null
        }
        Insert: {
          col_span?: number
          columns?: Json | null
          constraint_formula?: string | null
          constraint_message?: string | null
          created_at?: string
          default_value?: Json | null
          formula?: string | null
          help_text?: string | null
          id?: string
          key: string
          kind?: Database["public"]["Enums"]["form_field_kind"]
          label: string
          max_value?: number | null
          min_value?: number | null
          nhom?: string | null
          options?: Json | null
          placeholder?: string | null
          position?: number
          ratings?: Json | null
          required?: boolean
          required_if?: Json | null
          template_id: string
          tieu_chuan?: string | null
          unit?: string | null
          updated_at?: string
          visible_if?: Json | null
        }
        Update: {
          col_span?: number
          columns?: Json | null
          constraint_formula?: string | null
          constraint_message?: string | null
          created_at?: string
          default_value?: Json | null
          formula?: string | null
          help_text?: string | null
          id?: string
          key?: string
          kind?: Database["public"]["Enums"]["form_field_kind"]
          label?: string
          max_value?: number | null
          min_value?: number | null
          nhom?: string | null
          options?: Json | null
          placeholder?: string | null
          position?: number
          ratings?: Json | null
          required?: boolean
          required_if?: Json | null
          template_id?: string
          tieu_chuan?: string | null
          unit?: string | null
          updated_at?: string
          visible_if?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
        ]
      }
      form_section: {
        Row: {
          col_layout: number
          created_at: string
          id: string
          ma_section: string
          mo_ta: string | null
          position: number
          repeatable: boolean
          template_id: string
          ten: string
          updated_at: string
          visible_if: Json | null
        }
        Insert: {
          col_layout?: number
          created_at?: string
          id?: string
          ma_section: string
          mo_ta?: string | null
          position?: number
          repeatable?: boolean
          template_id: string
          ten: string
          updated_at?: string
          visible_if?: Json | null
        }
        Update: {
          col_layout?: number
          created_at?: string
          id?: string
          ma_section?: string
          mo_ta?: string | null
          position?: number
          repeatable?: boolean
          template_id?: string
          ten?: string
          updated_at?: string
          visible_if?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_section_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
        ]
      }
      form_sign_otp: {
        Row: {
          attempts: number
          channel: string
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          note: string | null
          signer_role: string
          submission_id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: string
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          note?: string | null
          signer_role?: string
          submission_id: string
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          note?: string | null
          signer_role?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_sign_otp_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submission"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission: {
        Row: {
          content_hash: string | null
          created_at: string
          created_by: string | null
          data: Json
          don_vi_id: string | null
          he_thong_id: string | null
          id: string
          ky_bao_cao: string | null
          pdf_path: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_text: string | null
          search_tsv: unknown
          signatures: Json
          signed_at: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["form_submission_status"]
          submitted_at: string | null
          template_code: string
          template_id: string
          template_snapshot: Json | null
          template_version: number
          template_version_id: string | null
          thiet_bi_id: string | null
          tieu_de: string | null
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          don_vi_id?: string | null
          he_thong_id?: string | null
          id?: string
          ky_bao_cao?: string | null
          pdf_path?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_text?: string | null
          search_tsv?: unknown
          signatures?: Json
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["form_submission_status"]
          submitted_at?: string | null
          template_code: string
          template_id: string
          template_snapshot?: Json | null
          template_version?: number
          template_version_id?: string | null
          thiet_bi_id?: string | null
          tieu_de?: string | null
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          don_vi_id?: string | null
          he_thong_id?: string | null
          id?: string
          ky_bao_cao?: string | null
          pdf_path?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_text?: string | null
          search_tsv?: unknown
          signatures?: Json
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["form_submission_status"]
          submitted_at?: string | null
          template_code?: string
          template_id?: string
          template_snapshot?: Json | null
          template_version?: number
          template_version_id?: string | null
          thiet_bi_id?: string | null
          tieu_de?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "form_template_version"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      form_submission_item_result: {
        Row: {
          created_at: string
          don_vi: string | null
          ghi_chu: string | null
          gia_tri_so: number | null
          gia_tri_text: string | null
          hanh_dong: string | null
          id: string
          item_code: string
          ket_qua: Database["public"]["Enums"]["form_ket_qua"] | null
          position: number
          result_kind: Database["public"]["Enums"]["form_result_kind"]
          section_code: string
          section_ten: string | null
          submission_id: string
          ten: string
          tieu_chuan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          don_vi?: string | null
          ghi_chu?: string | null
          gia_tri_so?: number | null
          gia_tri_text?: string | null
          hanh_dong?: string | null
          id?: string
          item_code: string
          ket_qua?: Database["public"]["Enums"]["form_ket_qua"] | null
          position?: number
          result_kind: Database["public"]["Enums"]["form_result_kind"]
          section_code: string
          section_ten?: string | null
          submission_id: string
          ten: string
          tieu_chuan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          don_vi?: string | null
          ghi_chu?: string | null
          gia_tri_so?: number | null
          gia_tri_text?: string | null
          hanh_dong?: string | null
          id?: string
          item_code?: string
          ket_qua?: Database["public"]["Enums"]["form_ket_qua"] | null
          position?: number
          result_kind?: Database["public"]["Enums"]["form_result_kind"]
          section_code?: string
          section_ten?: string | null
          submission_id?: string
          ten?: string
          tieu_chuan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_item_result_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submission"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_signature: {
        Row: {
          alg: string
          content_hash: string
          created_at: string
          id: string
          key_id: string
          note: string | null
          signature_b64: string
          signed_at: string
          signer_name: string | null
          signer_role: string
          signer_user_id: string
          submission_id: string
        }
        Insert: {
          alg?: string
          content_hash: string
          created_at?: string
          id?: string
          key_id: string
          note?: string | null
          signature_b64: string
          signed_at?: string
          signer_name?: string | null
          signer_role: string
          signer_user_id: string
          submission_id: string
        }
        Update: {
          alg?: string
          content_hash?: string
          created_at?: string
          id?: string
          key_id?: string
          note?: string | null
          signature_b64?: string
          signed_at?: string
          signer_name?: string | null
          signer_role?: string
          signer_user_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_signature_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "system_signing_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_signature_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submission"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_thiet_bi: {
        Row: {
          created_at: string
          note: string | null
          submission_id: string
          thiet_bi_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          submission_id: string
          thiet_bi_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          submission_id?: string
          thiet_bi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_thiet_bi_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submission_thiet_bi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      form_template: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          mo_ta: string | null
          nhom: string
          require_signature: boolean
          ten: string
          thiet_bi_mode: Database["public"]["Enums"]["form_thiet_bi_mode"]
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          mo_ta?: string | null
          nhom?: string
          require_signature?: boolean
          ten: string
          thiet_bi_mode?: Database["public"]["Enums"]["form_thiet_bi_mode"]
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mo_ta?: string | null
          nhom?: string
          require_signature?: boolean
          ten?: string
          thiet_bi_mode?: Database["public"]["Enums"]["form_thiet_bi_mode"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      form_template_he_thong: {
        Row: {
          created_at: string
          he_thong_id: string
          id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          he_thong_id: string
          id?: string
          template_id: string
        }
        Update: {
          created_at?: string
          he_thong_id?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_template_he_thong_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_template_he_thong_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_template_he_thong_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
        ]
      }
      form_template_include: {
        Row: {
          child_version_id: string
          created_at: string
          created_by: string | null
          id: string
          parent_version_id: string
          position: number
          section_code: string | null
        }
        Insert: {
          child_version_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_version_id: string
          position?: number
          section_code?: string | null
        }
        Update: {
          child_version_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_version_id?: string
          position?: number
          section_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_template_include_child_version_id_fkey"
            columns: ["child_version_id"]
            isOneToOne: false
            referencedRelation: "form_template_version"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_template_include_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "form_template_version"
            referencedColumns: ["id"]
          },
        ]
      }
      form_template_version: {
        Row: {
          compiled_schema: Json
          created_at: string
          created_by: string | null
          id: string
          status: Database["public"]["Enums"]["form_template_version_status"]
          template_id: string
          updated_at: string
          version: number
        }
        Insert: {
          compiled_schema?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["form_template_version_status"]
          template_id: string
          updated_at?: string
          version: number
        }
        Update: {
          compiled_schema?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["form_template_version_status"]
          template_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_template_version_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_template"
            referencedColumns: ["id"]
          },
        ]
      }
      gan_chuc_nang: {
        Row: {
          created_at: string
          created_by: string | null
          den_ngay: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          hong_hoc_id: string | null
          id: string
          ly_do: string
          nguoi_thuc_hien: string | null
          thanh_phan_id: string
          thiet_bi_id: string
          tu_ngay: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          den_ngay?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          hong_hoc_id?: string | null
          id?: string
          ly_do?: string
          nguoi_thuc_hien?: string | null
          thanh_phan_id: string
          thiet_bi_id: string
          tu_ngay?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          den_ngay?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          hong_hoc_id?: string | null
          id?: string
          ly_do?: string
          nguoi_thuc_hien?: string | null
          thanh_phan_id?: string
          thiet_bi_id?: string
          tu_ngay?: string
        }
        Relationships: [
          {
            foreignKeyName: "gan_chuc_nang_hong_hoc_id_fkey"
            columns: ["hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thanh_phan_id_fkey"
            columns: ["thanh_phan_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      gan_linh_kien: {
        Row: {
          created_at: string
          created_by: string | null
          den_ngay: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          hong_hoc_id: string | null
          id: string
          khe_id: string
          linh_kien_id: string
          ly_do: string
          nguoi_thuc_hien: string | null
          tu_ngay: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          den_ngay?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          hong_hoc_id?: string | null
          id?: string
          khe_id: string
          linh_kien_id: string
          ly_do?: string
          nguoi_thuc_hien?: string | null
          tu_ngay?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          den_ngay?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          hong_hoc_id?: string | null
          id?: string
          khe_id?: string
          linh_kien_id?: string
          ly_do?: string
          nguoi_thuc_hien?: string | null
          tu_ngay?: string
        }
        Relationships: [
          {
            foreignKeyName: "gan_linh_kien_hong_hoc_id_fkey"
            columns: ["hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_khe_id_fkey"
            columns: ["khe_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi_khe_linh_kien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      giay_phep: {
        Row: {
          created_at: string
          created_by: string | null
          file_giay_phep: string | null
          ghi_chu: string | null
          id: string
          loai_giay_phep_id: string | null
          ma_giay_phep: string
          ngay_cap: string | null
          ngay_het_han: string | null
          noi_cap_id: string | null
          search_text: string | null
          search_tsv: unknown
          so_giay_phep: string | null
          thiet_bi_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_giay_phep?: string | null
          ghi_chu?: string | null
          id?: string
          loai_giay_phep_id?: string | null
          ma_giay_phep: string
          ngay_cap?: string | null
          ngay_het_han?: string | null
          noi_cap_id?: string | null
          search_text?: string | null
          search_tsv?: unknown
          so_giay_phep?: string | null
          thiet_bi_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_giay_phep?: string | null
          ghi_chu?: string | null
          id?: string
          loai_giay_phep_id?: string | null
          ma_giay_phep?: string
          ngay_cap?: string | null
          ngay_het_han?: string | null
          noi_cap_id?: string | null
          search_text?: string | null
          search_tsv?: unknown
          so_giay_phep?: string | null
          thiet_bi_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "giay_phep_loai_giay_phep_id_fkey"
            columns: ["loai_giay_phep_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_giay_phep"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giay_phep_noi_cap_id_fkey"
            columns: ["noi_cap_id"]
            isOneToOne: false
            referencedRelation: "dm_noi_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giay_phep_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "giay_phep_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giay_phep_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      giay_phep_khai_thac: {
        Row: {
          attrs: Json
          created_at: string
          created_by: string | null
          dia_diem: string | null
          don_vi: string | null
          file_gpkt: string | null
          gp_cu: string | null
          gp_han: string | null
          gp_ngay: string | null
          gp_so: string | null
          he_thong_csdl: string | null
          he_thong_folder: string | null
          he_thong_id: string | null
          id: string
          kieu_thiet_bi: string | null
          luu_tru: boolean
          ma_dia_chi: string | null
          muc_dich: string | null
          nam_sx_gp: string | null
          noi_san_xuat: string | null
          pham_vi: string | null
          so_san_xuat: string | null
          ten_he_thong_theo_gp: string | null
          thanh_phan_theo_gp: string | null
          thoi_gian: string | null
          tram: string | null
          trang_thai_doi_chieu: string | null
          updated_at: string
        }
        Insert: {
          attrs?: Json
          created_at?: string
          created_by?: string | null
          dia_diem?: string | null
          don_vi?: string | null
          file_gpkt?: string | null
          gp_cu?: string | null
          gp_han?: string | null
          gp_ngay?: string | null
          gp_so?: string | null
          he_thong_csdl?: string | null
          he_thong_folder?: string | null
          he_thong_id?: string | null
          id?: string
          kieu_thiet_bi?: string | null
          luu_tru?: boolean
          ma_dia_chi?: string | null
          muc_dich?: string | null
          nam_sx_gp?: string | null
          noi_san_xuat?: string | null
          pham_vi?: string | null
          so_san_xuat?: string | null
          ten_he_thong_theo_gp?: string | null
          thanh_phan_theo_gp?: string | null
          thoi_gian?: string | null
          tram?: string | null
          trang_thai_doi_chieu?: string | null
          updated_at?: string
        }
        Update: {
          attrs?: Json
          created_at?: string
          created_by?: string | null
          dia_diem?: string | null
          don_vi?: string | null
          file_gpkt?: string | null
          gp_cu?: string | null
          gp_han?: string | null
          gp_ngay?: string | null
          gp_so?: string | null
          he_thong_csdl?: string | null
          he_thong_folder?: string | null
          he_thong_id?: string | null
          id?: string
          kieu_thiet_bi?: string | null
          luu_tru?: boolean
          ma_dia_chi?: string | null
          muc_dich?: string | null
          nam_sx_gp?: string | null
          noi_san_xuat?: string | null
          pham_vi?: string | null
          so_san_xuat?: string | null
          ten_he_thong_theo_gp?: string | null
          thanh_phan_theo_gp?: string | null
          thoi_gian?: string | null
          tram?: string | null
          trang_thai_doi_chieu?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "giay_phep_khai_thac_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giay_phep_khai_thac_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
        ]
      }
      he_thong_thanh_phan: {
        Row: {
          bat_buoc: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          don_vi_id_snapshot: string
          he_thong_id: string
          hieu_luc_den: string | null
          hieu_luc_tu: string | null
          id: string
          loai_thiet_bi_yeu_cau: string | null
          ma_thanh_phan: string
          mo_ta: string | null
          ten: string
          thanh_phan_cha: string | null
          thu_tu: number | null
          trang_thai: string
          trang_thai_id: string | null
          updated_at: string
          vi_tri_id: string | null
        }
        Insert: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          don_vi_id_snapshot: string
          he_thong_id: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          id?: string
          loai_thiet_bi_yeu_cau?: string | null
          ma_thanh_phan: string
          mo_ta?: string | null
          ten: string
          thanh_phan_cha?: string | null
          thu_tu?: number | null
          trang_thai?: string
          trang_thai_id?: string | null
          updated_at?: string
          vi_tri_id?: string | null
        }
        Update: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          don_vi_id_snapshot?: string
          he_thong_id?: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          id?: string
          loai_thiet_bi_yeu_cau?: string | null
          ma_thanh_phan?: string
          mo_ta?: string | null
          ten?: string
          thanh_phan_cha?: string | null
          thu_tu?: number | null
          trang_thai?: string
          trang_thai_id?: string | null
          updated_at?: string
          vi_tri_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_loai_thiet_bi_yeu_cau_fkey"
            columns: ["loai_thiet_bi_yeu_cau"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_thanh_phan_cha_fkey"
            columns: ["thanh_phan_cha"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_trang_thai_id_fkey"
            columns: ["trang_thai_id"]
            isOneToOne: false
            referencedRelation: "dm_trang_thai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_vi_tri_id_fkey"
            columns: ["vi_tri_id"]
            isOneToOne: false
            referencedRelation: "dm_vi_tri"
            referencedColumns: ["id"]
          },
        ]
      }
      he_thong_truong: {
        Row: {
          bat_buoc: boolean
          created_at: string
          created_by: string | null
          field_key: string
          he_thong_id: string
          help_text: string | null
          id: string
          kieu: string
          nhan: string
          nhom_field: string | null
          thu_tu: number
          tuy_chon: Json
          updated_at: string
        }
        Insert: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          field_key: string
          he_thong_id: string
          help_text?: string | null
          id?: string
          kieu?: string
          nhan: string
          nhom_field?: string | null
          thu_tu?: number
          tuy_chon?: Json
          updated_at?: string
        }
        Update: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          field_key?: string
          he_thong_id?: string
          help_text?: string | null
          id?: string
          kieu?: string
          nhan?: string
          nhom_field?: string | null
          thu_tu?: number
          tuy_chon?: Json
          updated_at?: string
        }
        Relationships: []
      }
      hong_hoc: {
        Row: {
          at_bao_cao: string | null
          at_bat_dau_xu_ly: string | null
          at_hoan_thanh: string | null
          at_huy: string | null
          at_nghiem_thu: string | null
          at_tiep_nhan: string | null
          bo_phan_hong: string | null
          chi_phi: number | null
          created_at: string
          don_vi_thuc_hien: string | null
          file_dinh_kem: string | null
          he_thong_id: string | null
          id: string
          ket_qua: string | null
          ma_hong_hoc: string
          mo_ta_hong_hoc: string | null
          ngay_hoan_thanh: string | null
          ngay_hong: string
          nguoi_bao_cao_id: string | null
          nguoi_nghiem_thu_id: string | null
          nguoi_thuc_hien: string[] | null
          nguoi_tiep_nhan_id: string | null
          nguoi_xu_ly_chinh_id: string | null
          phuong_an: string | null
          snapshot_don_vi: string | null
          snapshot_he_thong: string | null
          snapshot_ma_thiet_bi: string | null
          snapshot_ten_thiet_bi: string | null
          snapshot_vi_tri: string | null
          su_co: string | null
          thanh_phan_id: string | null
          thiet_bi_hong: string
          thiet_bi_hong_id: string | null
          thiet_bi_thay_the: string | null
          thiet_bi_thay_the_id: string | null
          tong_thoi_gian_cho_vat_tu_phut: number
          trang_thai: string | null
          trang_thai_moi: string | null
          updated_at: string
          vat_tu_su_dung: string[] | null
        }
        Insert: {
          at_bao_cao?: string | null
          at_bat_dau_xu_ly?: string | null
          at_hoan_thanh?: string | null
          at_huy?: string | null
          at_nghiem_thu?: string | null
          at_tiep_nhan?: string | null
          bo_phan_hong?: string | null
          chi_phi?: number | null
          created_at?: string
          don_vi_thuc_hien?: string | null
          file_dinh_kem?: string | null
          he_thong_id?: string | null
          id?: string
          ket_qua?: string | null
          ma_hong_hoc: string
          mo_ta_hong_hoc?: string | null
          ngay_hoan_thanh?: string | null
          ngay_hong?: string
          nguoi_bao_cao_id?: string | null
          nguoi_nghiem_thu_id?: string | null
          nguoi_thuc_hien?: string[] | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_xu_ly_chinh_id?: string | null
          phuong_an?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          su_co?: string | null
          thanh_phan_id?: string | null
          thiet_bi_hong: string
          thiet_bi_hong_id?: string | null
          thiet_bi_thay_the?: string | null
          thiet_bi_thay_the_id?: string | null
          tong_thoi_gian_cho_vat_tu_phut?: number
          trang_thai?: string | null
          trang_thai_moi?: string | null
          updated_at?: string
          vat_tu_su_dung?: string[] | null
        }
        Update: {
          at_bao_cao?: string | null
          at_bat_dau_xu_ly?: string | null
          at_hoan_thanh?: string | null
          at_huy?: string | null
          at_nghiem_thu?: string | null
          at_tiep_nhan?: string | null
          bo_phan_hong?: string | null
          chi_phi?: number | null
          created_at?: string
          don_vi_thuc_hien?: string | null
          file_dinh_kem?: string | null
          he_thong_id?: string | null
          id?: string
          ket_qua?: string | null
          ma_hong_hoc?: string
          mo_ta_hong_hoc?: string | null
          ngay_hoan_thanh?: string | null
          ngay_hong?: string
          nguoi_bao_cao_id?: string | null
          nguoi_nghiem_thu_id?: string | null
          nguoi_thuc_hien?: string[] | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_xu_ly_chinh_id?: string | null
          phuong_an?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          su_co?: string | null
          thanh_phan_id?: string | null
          thiet_bi_hong?: string
          thiet_bi_hong_id?: string | null
          thiet_bi_thay_the?: string | null
          thiet_bi_thay_the_id?: string | null
          tong_thoi_gian_cho_vat_tu_phut?: number
          trang_thai?: string | null
          trang_thai_moi?: string | null
          updated_at?: string
          vat_tu_su_dung?: string[] | null
        }
        Relationships: []
      }
      import_alias: {
        Row: {
          alias: string
          alias_norm: string
          canonical_id: string
          canonical_key: string | null
          confirmed_at: string
          confirmed_by: string
          created_at: string
          entity: string
          id: string
          scope: string | null
          source: string
          updated_at: string
        }
        Insert: {
          alias: string
          alias_norm: string
          canonical_id: string
          canonical_key?: string | null
          confirmed_at?: string
          confirmed_by?: string
          created_at?: string
          entity: string
          id?: string
          scope?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_norm?: string
          canonical_id?: string
          canonical_key?: string | null
          confirmed_at?: string
          confirmed_by?: string
          created_at?: string
          entity?: string
          id?: string
          scope?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_batch: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string
          file_hash: string
          file_name: string
          file_size: number | null
          id: string
          rolled_back_at: string | null
          schema_version: string | null
          scope: string | null
          source: string
          status: string
          summary: Json
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          file_hash: string
          file_name: string
          file_size?: number | null
          id?: string
          rolled_back_at?: string | null
          schema_version?: string | null
          scope?: string | null
          source?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string
          file_hash?: string
          file_name?: string
          file_size?: number | null
          id?: string
          rolled_back_at?: string | null
          schema_version?: string | null
          scope?: string | null
          source?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      import_item: {
        Row: {
          action: string | null
          after_snapshot: Json | null
          applied_at: string | null
          batch_id: string
          before_snapshot: Json | null
          cat_table: string | null
          created_at: string
          entity: string
          id: string
          messages: Json
          normalized_row: Json | null
          raw_row: Json
          rolled_back_at: string | null
          row_index: number
          sheet: string | null
          status: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action?: string | null
          after_snapshot?: Json | null
          applied_at?: string | null
          batch_id: string
          before_snapshot?: Json | null
          cat_table?: string | null
          created_at?: string
          entity: string
          id?: string
          messages?: Json
          normalized_row?: Json | null
          raw_row?: Json
          rolled_back_at?: string | null
          row_index: number
          sheet?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string | null
          after_snapshot?: Json | null
          applied_at?: string | null
          batch_id?: string
          before_snapshot?: Json | null
          cat_table?: string | null
          created_at?: string
          entity?: string
          id?: string
          messages?: Json
          normalized_row?: Json | null
          raw_row?: Json
          rolled_back_at?: string | null
          row_index?: number
          sheet?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_item_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batch"
            referencedColumns: ["id"]
          },
        ]
      }
      kho: {
        Row: {
          created_at: string
          created_by: string | null
          don_vi_id: string | null
          ghi_chu: string | null
          id: string
          kich_hoat: boolean
          ma_kho: string | null
          ten: string
          updated_at: string
          vi_tri_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          ghi_chu?: string | null
          id?: string
          kich_hoat?: boolean
          ma_kho?: string | null
          ten: string
          updated_at?: string
          vi_tri_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          ghi_chu?: string | null
          id?: string
          kich_hoat?: boolean
          ma_kho?: string | null
          ten?: string
          updated_at?: string
          vi_tri_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kho_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_vi_tri_id_fkey"
            columns: ["vi_tri_id"]
            isOneToOne: false
            referencedRelation: "dm_vi_tri"
            referencedColumns: ["id"]
          },
        ]
      }
      kho_giao_dich: {
        Row: {
          created_at: string
          don_gia: number
          don_vi_id: string | null
          ghi_chu: string | null
          hieu_ung: number | null
          id: string
          kho_id: string
          lien_ket_cong_viec_id: string | null
          lien_ket_hong_hoc_id: string | null
          lien_ket_su_co_id: string | null
          loai: string
          ngay: string
          nguoi_thuc_hien: string | null
          nhom_ct: string | null
          so_ct: string | null
          so_luong: number
          vat_tu_id: string
        }
        Insert: {
          created_at?: string
          don_gia?: number
          don_vi_id?: string | null
          ghi_chu?: string | null
          hieu_ung?: number | null
          id?: string
          kho_id: string
          lien_ket_cong_viec_id?: string | null
          lien_ket_hong_hoc_id?: string | null
          lien_ket_su_co_id?: string | null
          loai: string
          ngay?: string
          nguoi_thuc_hien?: string | null
          nhom_ct?: string | null
          so_ct?: string | null
          so_luong: number
          vat_tu_id: string
        }
        Update: {
          created_at?: string
          don_gia?: number
          don_vi_id?: string | null
          ghi_chu?: string | null
          hieu_ung?: number | null
          id?: string
          kho_id?: string
          lien_ket_cong_viec_id?: string | null
          lien_ket_hong_hoc_id?: string | null
          lien_ket_su_co_id?: string | null
          loai?: string
          ngay?: string
          nguoi_thuc_hien?: string | null
          nhom_ct?: string | null
          so_ct?: string | null
          so_luong?: number
          vat_tu_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kho_giao_dich_kho_id_fkey"
            columns: ["kho_id"]
            isOneToOne: false
            referencedRelation: "kho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_giao_dich_lien_ket_cong_viec_id_fkey"
            columns: ["lien_ket_cong_viec_id"]
            isOneToOne: false
            referencedRelation: "cong_viec_bao_tri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_giao_dich_lien_ket_hong_hoc_id_fkey"
            columns: ["lien_ket_hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_giao_dich_lien_ket_su_co_id_fkey"
            columns: ["lien_ket_su_co_id"]
            isOneToOne: false
            referencedRelation: "su_co"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_giao_dich_vat_tu_id_fkey"
            columns: ["vat_tu_id"]
            isOneToOne: false
            referencedRelation: "v_ton_kho_canh_bao"
            referencedColumns: ["vat_tu_id"]
          },
          {
            foreignKeyName: "kho_giao_dich_vat_tu_id_fkey"
            columns: ["vat_tu_id"]
            isOneToOne: false
            referencedRelation: "vat_tu"
            referencedColumns: ["id"]
          },
        ]
      }
      kiem_ke: {
        Row: {
          anh_url: string | null
          created_at: string
          created_by: string | null
          ghi_chu: string | null
          id: string
          nguoi_kiem: string | null
          thiet_bi_id: string
          thoi_diem: string
          tinh_trang: string
          vi_tri_gps: string | null
        }
        Insert: {
          anh_url?: string | null
          created_at?: string
          created_by?: string | null
          ghi_chu?: string | null
          id?: string
          nguoi_kiem?: string | null
          thiet_bi_id: string
          thoi_diem?: string
          tinh_trang: string
          vi_tri_gps?: string | null
        }
        Update: {
          anh_url?: string | null
          created_at?: string
          created_by?: string | null
          ghi_chu?: string | null
          id?: string
          nguoi_kiem?: string | null
          thiet_bi_id?: string
          thoi_diem?: string
          tinh_trang?: string
          vi_tri_gps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kiem_ke_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "kiem_ke_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiem_ke_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      lien_ket_he_thong: {
        Row: {
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          giao_dien_dich: string | null
          giao_dien_nguon: string | null
          giao_thuc: string | null
          he_thong_dich_id: string
          he_thong_nguon_id: string
          hieu_luc_den: string | null
          hieu_luc_tu: string | null
          huong: string
          id: string
          loai_lien_ket_id: string
          lop: string
          mo_ta_tin_hieu: string | null
          trang_thai: string
          updated_at: string
          vai_tro_du_phong: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          giao_dien_dich?: string | null
          giao_dien_nguon?: string | null
          giao_thuc?: string | null
          he_thong_dich_id: string
          he_thong_nguon_id: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          huong?: string
          id?: string
          loai_lien_ket_id: string
          lop?: string
          mo_ta_tin_hieu?: string | null
          trang_thai?: string
          updated_at?: string
          vai_tro_du_phong?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          giao_dien_dich?: string | null
          giao_dien_nguon?: string | null
          giao_thuc?: string | null
          he_thong_dich_id?: string
          he_thong_nguon_id?: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          huong?: string
          id?: string
          loai_lien_ket_id?: string
          lop?: string
          mo_ta_tin_hieu?: string | null
          trang_thai?: string
          updated_at?: string
          vai_tro_du_phong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_dich_id_fkey"
            columns: ["he_thong_dich_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_dich_id_fkey"
            columns: ["he_thong_dich_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_nguon_id_fkey"
            columns: ["he_thong_nguon_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_nguon_id_fkey"
            columns: ["he_thong_nguon_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_loai_lien_ket_id_fkey"
            columns: ["loai_lien_ket_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_lien_ket"
            referencedColumns: ["id"]
          },
        ]
      }
      lien_ket_khe: {
        Row: {
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          giao_dien_dich: string | null
          giao_dien_nguon: string | null
          giao_thuc: string | null
          hieu_luc_den: string | null
          hieu_luc_tu: string
          id: string
          khe_dich_id: string
          khe_nguon_id: string
          loai_lien_ket_id: string
          mo_ta: string | null
          trang_thai: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          giao_dien_dich?: string | null
          giao_dien_nguon?: string | null
          giao_thuc?: string | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string
          id?: string
          khe_dich_id: string
          khe_nguon_id: string
          loai_lien_ket_id: string
          mo_ta?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          ghi_chu?: string | null
          giao_dien_dich?: string | null
          giao_dien_nguon?: string | null
          giao_thuc?: string | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string
          id?: string
          khe_dich_id?: string
          khe_nguon_id?: string
          loai_lien_ket_id?: string
          mo_ta?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lien_ket_khe_khe_dich_id_fkey"
            columns: ["khe_dich_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_khe_khe_nguon_id_fkey"
            columns: ["khe_nguon_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_khe_loai_lien_ket_id_fkey"
            columns: ["loai_lien_ket_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_lien_ket"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          file_mime: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          noi_dung: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          file_mime?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          noi_dung?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          file_mime?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          noi_dung?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_tai_lieu: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          kich_thuoc: number | null
          loai_tai_lieu: string
          mime_type: string | null
          mo_ta: string | null
          model_id: string
          thu_tu: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket?: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          kich_thuoc?: number | null
          loai_tai_lieu?: string
          mime_type?: string | null
          mo_ta?: string | null
          model_id: string
          thu_tu?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          kich_thuoc?: number | null
          loai_tai_lieu?: string
          mime_type?: string | null
          mo_ta?: string | null
          model_id?: string
          thu_tu?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_tai_lieu_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "dm_model"
            referencedColumns: ["id"]
          },
        ]
      }
      nhan_vien: {
        Row: {
          chuc_vu: string | null
          created_at: string
          dien_thoai: string | null
          don_vi: string | null
          email: string | null
          ho_ten: string
          hoat_dong: boolean
          id: string
          ma_nhan_vien: string
          updated_at: string
        }
        Insert: {
          chuc_vu?: string | null
          created_at?: string
          dien_thoai?: string | null
          don_vi?: string | null
          email?: string | null
          ho_ten: string
          hoat_dong?: boolean
          id?: string
          ma_nhan_vien: string
          updated_at?: string
        }
        Update: {
          chuc_vu?: string | null
          created_at?: string
          dien_thoai?: string | null
          don_vi?: string | null
          email?: string | null
          ho_ten?: string
          hoat_dong?: boolean
          id?: string
          ma_nhan_vien?: string
          updated_at?: string
        }
        Relationships: []
      }
      node_note: {
        Row: {
          created_at: string
          id: string
          node_id: string
          node_type: Database["public"]["Enums"]["node_note_type"]
          noi_dung: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          node_id: string
          node_type: Database["public"]["Enums"]["node_note_type"]
          noi_dung?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          node_id?: string
          node_type?: Database["public"]["Enums"]["node_note_type"]
          noi_dung?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          loai: Database["public"]["Enums"]["notification_loai"]
          noi_dung: string | null
          read_at: string | null
          ref_id: string | null
          ref_type: string | null
          tieu_de: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          loai: Database["public"]["Enums"]["notification_loai"]
          noi_dung?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tieu_de: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          loai?: Database["public"]["Enums"]["notification_loai"]
          noi_dung?: string | null
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          tieu_de?: string
          user_id?: string
        }
        Relationships: []
      }
      pm_cong_viec: {
        Row: {
          bao_tri_id: string | null
          bo_qua_ly_do: string | null
          chinh_sach_id: string
          created_at: string
          doi_tuong_id: string
          doi_tuong_type: string
          don_vi_id: string | null
          estimated: boolean
          ghi_chu: string | null
          han: string
          hoan_thanh_at: string | null
          id: string
          ky_hieu_han: string
          nguoi_phu_trach_id: string | null
          trang_thai: string
          updated_at: string
        }
        Insert: {
          bao_tri_id?: string | null
          bo_qua_ly_do?: string | null
          chinh_sach_id: string
          created_at?: string
          doi_tuong_id: string
          doi_tuong_type: string
          don_vi_id?: string | null
          estimated?: boolean
          ghi_chu?: string | null
          han: string
          hoan_thanh_at?: string | null
          id?: string
          ky_hieu_han: string
          nguoi_phu_trach_id?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          bao_tri_id?: string | null
          bo_qua_ly_do?: string | null
          chinh_sach_id?: string
          created_at?: string
          doi_tuong_id?: string
          doi_tuong_type?: string
          don_vi_id?: string | null
          estimated?: boolean
          ghi_chu?: string | null
          han?: string
          hoan_thanh_at?: string | null
          id?: string
          ky_hieu_han?: string
          nguoi_phu_trach_id?: string | null
          trang_thai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_cong_viec_bao_tri_id_fkey"
            columns: ["bao_tri_id"]
            isOneToOne: false
            referencedRelation: "bao_tri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_cong_viec_chinh_sach_id_fkey"
            columns: ["chinh_sach_id"]
            isOneToOne: false
            referencedRelation: "bao_tri_chinh_sach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_cong_viec_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_cong_viec_nguoi_phu_trach_id_fkey"
            columns: ["nguoi_phu_trach_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          don_vi: Database["public"]["Enums"]["don_vi_code"] | null
          email: string
          ho_ten: string | null
          id: string
          tour_hoan_thanh: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          don_vi?: Database["public"]["Enums"]["don_vi_code"] | null
          email: string
          ho_ten?: string | null
          id: string
          tour_hoan_thanh?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          don_vi?: Database["public"]["Enums"]["don_vi_code"] | null
          email?: string
          ho_ten?: string | null
          id?: string
          tour_hoan_thanh?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      role_permission: {
        Row: {
          action: string
          allowed: boolean
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action: string
          allowed?: boolean
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action?: string
          allowed?: boolean
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      search_index: {
        Row: {
          id: string
          loai: string
          ma: string | null
          noi_dung: string | null
          route: string
          tieu_de: string
          tsv: unknown
          updated_at: string
        }
        Insert: {
          id: string
          loai: string
          ma?: string | null
          noi_dung?: string | null
          route: string
          tieu_de: string
          tsv?: unknown
          updated_at?: string
        }
        Update: {
          id?: string
          loai?: string
          ma?: string | null
          noi_dung?: string | null
          route?: string
          tieu_de?: string
          tsv?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      so_do_he_thong: {
        Row: {
          created_at: string
          created_by: string
          don_vi_id: string | null
          don_vi_ma: string | null
          du_lieu: Json
          he_thong_ma: string | null
          he_thong_ten: string | null
          id: string
          mo_ta: string | null
          ten: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          don_vi_id?: string | null
          don_vi_ma?: string | null
          du_lieu?: Json
          he_thong_ma?: string | null
          he_thong_ten?: string | null
          id?: string
          mo_ta?: string | null
          ten: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          don_vi_id?: string | null
          don_vi_ma?: string | null
          du_lieu?: Json
          he_thong_ma?: string | null
          he_thong_ten?: string | null
          id?: string
          mo_ta?: string | null
          ten?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_do_he_thong_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      so_do_tep_dinh_kem: {
        Row: {
          created_at: string
          created_by: string
          duong_dan: string
          id: string
          kich_thuoc: number | null
          loai: string | null
          so_do_id: string
          ten_tep: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duong_dan: string
          id?: string
          kich_thuoc?: number | null
          loai?: string | null
          so_do_id: string
          ten_tep: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duong_dan?: string
          id?: string
          kich_thuoc?: number | null
          loai?: string | null
          so_do_id?: string
          ten_tep?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_do_tep_dinh_kem_so_do_id_fkey"
            columns: ["so_do_id"]
            isOneToOne: false
            referencedRelation: "so_do_he_thong"
            referencedColumns: ["id"]
          },
        ]
      }
      so_do_thu_vien_hinh: {
        Row: {
          created_at: string
          created_by: string
          duong_dan: string
          id: string
          nhom: string | null
          ten: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          duong_dan: string
          id?: string
          nhom?: string | null
          ten: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duong_dan?: string
          id?: string
          nhom?: string | null
          ten?: string
        }
        Relationships: []
      }
      su_co: {
        Row: {
          anh_huong_dhb: string | null
          at_bao_cao: string | null
          at_bat_dau_xu_ly: string | null
          at_hoan_thanh: string | null
          at_huy: string | null
          at_nghiem_thu: string | null
          at_tiep_nhan: string | null
          bao_cao_ban_dau: Json | null
          bien_phap_xu_ly: string | null
          created_at: string
          don_vi: string | null
          file_dinh_kem: string | null
          he_thong: string | null
          he_thong_id: string | null
          hien_tuong: string | null
          id: string
          lien_ket_hong_hoc: string | null
          luu_tru: boolean
          ma_nhom_bc: string | null
          ma_su_co: string
          muc_do: string | null
          ngay_phat_hien: string
          nguoi_bao_cao: string | null
          nguoi_bao_cao_id: string | null
          nguoi_nghiem_thu_id: string | null
          nguoi_tiep_nhan_id: string | null
          nguoi_xu_ly: string[] | null
          nguoi_xu_ly_chinh_id: string | null
          nguyen_nhan: string | null
          snapshot_don_vi: string | null
          snapshot_he_thong: string | null
          snapshot_ma_thiet_bi: string | null
          snapshot_ten_thiet_bi: string | null
          snapshot_vi_tri: string | null
          thanh_phan_id: string | null
          thiet_bi: string
          thiet_bi_id: string | null
          thoi_diem_khac_phuc: string | null
          thoi_gian_gian_doan: number | null
          tong_thoi_gian_cho_vat_tu_phut: number
          trang_thai: string | null
          trang_thai_moi: string | null
          updated_at: string
          van_de_id: string | null
        }
        Insert: {
          anh_huong_dhb?: string | null
          at_bao_cao?: string | null
          at_bat_dau_xu_ly?: string | null
          at_hoan_thanh?: string | null
          at_huy?: string | null
          at_nghiem_thu?: string | null
          at_tiep_nhan?: string | null
          bao_cao_ban_dau?: Json | null
          bien_phap_xu_ly?: string | null
          created_at?: string
          don_vi?: string | null
          file_dinh_kem?: string | null
          he_thong?: string | null
          he_thong_id?: string | null
          hien_tuong?: string | null
          id?: string
          lien_ket_hong_hoc?: string | null
          luu_tru?: boolean
          ma_nhom_bc?: string | null
          ma_su_co: string
          muc_do?: string | null
          ngay_phat_hien?: string
          nguoi_bao_cao?: string | null
          nguoi_bao_cao_id?: string | null
          nguoi_nghiem_thu_id?: string | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_xu_ly?: string[] | null
          nguoi_xu_ly_chinh_id?: string | null
          nguyen_nhan?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thanh_phan_id?: string | null
          thiet_bi: string
          thiet_bi_id?: string | null
          thoi_diem_khac_phuc?: string | null
          thoi_gian_gian_doan?: number | null
          tong_thoi_gian_cho_vat_tu_phut?: number
          trang_thai?: string | null
          trang_thai_moi?: string | null
          updated_at?: string
          van_de_id?: string | null
        }
        Update: {
          anh_huong_dhb?: string | null
          at_bao_cao?: string | null
          at_bat_dau_xu_ly?: string | null
          at_hoan_thanh?: string | null
          at_huy?: string | null
          at_nghiem_thu?: string | null
          at_tiep_nhan?: string | null
          bao_cao_ban_dau?: Json | null
          bien_phap_xu_ly?: string | null
          created_at?: string
          don_vi?: string | null
          file_dinh_kem?: string | null
          he_thong?: string | null
          he_thong_id?: string | null
          hien_tuong?: string | null
          id?: string
          lien_ket_hong_hoc?: string | null
          luu_tru?: boolean
          ma_nhom_bc?: string | null
          ma_su_co?: string
          muc_do?: string | null
          ngay_phat_hien?: string
          nguoi_bao_cao?: string | null
          nguoi_bao_cao_id?: string | null
          nguoi_nghiem_thu_id?: string | null
          nguoi_tiep_nhan_id?: string | null
          nguoi_xu_ly?: string[] | null
          nguoi_xu_ly_chinh_id?: string | null
          nguyen_nhan?: string | null
          snapshot_don_vi?: string | null
          snapshot_he_thong?: string | null
          snapshot_ma_thiet_bi?: string | null
          snapshot_ten_thiet_bi?: string | null
          snapshot_vi_tri?: string | null
          thanh_phan_id?: string | null
          thiet_bi?: string
          thiet_bi_id?: string | null
          thoi_diem_khac_phuc?: string | null
          thoi_gian_gian_doan?: number | null
          tong_thoi_gian_cho_vat_tu_phut?: number
          trang_thai?: string | null
          trang_thai_moi?: string | null
          updated_at?: string
          van_de_id?: string | null
        }
        Relationships: []
      }
      su_co_lich_su: {
        Row: {
          at: string
          buoc: number
          den_trang_thai: string
          doi_tuong_bang: string
          doi_tuong_id: string
          ghi_chu: string | null
          id: string
          meta: Json
          nguoi: string | null
          tu_trang_thai: string | null
        }
        Insert: {
          at?: string
          buoc: number
          den_trang_thai: string
          doi_tuong_bang: string
          doi_tuong_id: string
          ghi_chu?: string | null
          id?: string
          meta?: Json
          nguoi?: string | null
          tu_trang_thai?: string | null
        }
        Update: {
          at?: string
          buoc?: number
          den_trang_thai?: string
          doi_tuong_bang?: string
          doi_tuong_id?: string
          ghi_chu?: string | null
          id?: string
          meta?: Json
          nguoi?: string | null
          tu_trang_thai?: string | null
        }
        Relationships: []
      }
      system_signing_key: {
        Row: {
          active: boolean
          alg: string
          created_at: string
          id: string
          note: string | null
          private_key_b64: string
          public_key_b64: string
          rotated_at: string | null
        }
        Insert: {
          active?: boolean
          alg?: string
          created_at?: string
          id?: string
          note?: string | null
          private_key_b64: string
          public_key_b64: string
          rotated_at?: string | null
        }
        Update: {
          active?: boolean
          alg?: string
          created_at?: string
          id?: string
          note?: string | null
          private_key_b64?: string
          public_key_b64?: string
          rotated_at?: string | null
        }
        Relationships: []
      }
      telegram_da_gui: {
        Row: {
          chat_id: string
          id: string
          loai: string
          ref_id: string
          ref_meta: Json | null
          sent_at: string
        }
        Insert: {
          chat_id: string
          id?: string
          loai: string
          ref_id: string
          ref_meta?: Json | null
          sent_at?: string
        }
        Update: {
          chat_id?: string
          id?: string
          loai?: string
          ref_id?: string
          ref_meta?: Json | null
          sent_at?: string
        }
        Relationships: []
      }
      telegram_subscriber: {
        Row: {
          active: boolean
          cac_loai: string[]
          chat_id: string
          created_at: string
          created_by: string | null
          don_vi_id: string | null
          gio_gui: number
          id: string
          la_nhom: boolean
          nguong_ngay: number
          ten: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          cac_loai?: string[]
          chat_id: string
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          gio_gui?: number
          id?: string
          la_nhom?: boolean
          nguong_ngay?: number
          ten: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          cac_loai?: string[]
          chat_id?: string
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          gio_gui?: number
          id?: string
          la_nhom?: boolean
          nguong_ngay?: number
          ten?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      thiet_bi: {
        Row: {
          attrs: Json
          che_do_kd_hc: string
          created_at: string
          created_by: string | null
          danh_gia_nien_han_id: string | null
          de_xuat_khac: string | null
          de_xuat_phuong_an: string | null
          de_xuat_tiep_tuc: string | null
          do_tin_cay: string | null
          don_vi_giu_id: string | null
          don_vi_id: string | null
          don_vi_quan_ly_id: string | null
          field_set_id: string | null
          file_tai_lieu: string | null
          ghi_chu: string | null
          giay_phep_khai_thac: string | null
          giay_phep_tan_so: string | null
          han_bao_hanh: string | null
          he_thong_id: string | null
          hinh_anh: string | null
          id: string
          la_linh_kien: boolean
          loai_thiet_bi_id: string | null
          ly_do_dieu_chuyen: string | null
          ma_serial: string | null
          ma_tai_san_bravo: string | null
          ma_thiet_bi: string
          ma_thiet_bi_cu: string | null
          model: string | null
          model_id: string | null
          nam_dua_vao_khai_thac: number | null
          nam_san_xuat: number | null
          ngay_bao_tri_gan_nhat: string | null
          ngay_bao_tri_ke_tiep: string | null
          ngay_cap_phat: string | null
          ngay_kiem_ke_ke_tiep: string | null
          ngay_mua: string | null
          nguoi_giu: string | null
          nguon_du_lieu: string | null
          nha_cung_cap: string | null
          nha_cung_cap_id: string | null
          nha_san_xuat: string | null
          nha_san_xuat_id: string | null
          nhom_he_thong_id: string | null
          noi_cat_giu: string | null
          noi_chuyen_den: string | null
          noi_chuyen_di: string | null
          noi_quan_ly: string | null
          p_n: string | null
          phan_loai: string | null
          phan_loai_id: string | null
          qr_code: string | null
          quyet_dinh_cham_dut: string | null
          search_text: string | null
          search_tsv: unknown
          so_nam_su_dung: number | null
          ten_thiet_bi: string
          thanh_phan: string | null
          thoi_diem_cham_dut: string | null
          thoi_diem_dieu_chuyen: string | null
          thong_ke_hong_hoc: string | null
          tinh_trang_ky_thuat: string | null
          trang_thai_cap_phat: string
          trang_thai_id: string | null
          ty_le_tuoi_tho: number | null
          updated_at: string
          vat_tu_du_phong: string | null
          vi_tri: string | null
          vi_tri_id: string | null
        }
        Insert: {
          attrs?: Json
          che_do_kd_hc?: string
          created_at?: string
          created_by?: string | null
          danh_gia_nien_han_id?: string | null
          de_xuat_khac?: string | null
          de_xuat_phuong_an?: string | null
          de_xuat_tiep_tuc?: string | null
          do_tin_cay?: string | null
          don_vi_giu_id?: string | null
          don_vi_id?: string | null
          don_vi_quan_ly_id?: string | null
          field_set_id?: string | null
          file_tai_lieu?: string | null
          ghi_chu?: string | null
          giay_phep_khai_thac?: string | null
          giay_phep_tan_so?: string | null
          han_bao_hanh?: string | null
          he_thong_id?: string | null
          hinh_anh?: string | null
          id?: string
          la_linh_kien?: boolean
          loai_thiet_bi_id?: string | null
          ly_do_dieu_chuyen?: string | null
          ma_serial?: string | null
          ma_tai_san_bravo?: string | null
          ma_thiet_bi: string
          ma_thiet_bi_cu?: string | null
          model?: string | null
          model_id?: string | null
          nam_dua_vao_khai_thac?: number | null
          nam_san_xuat?: number | null
          ngay_bao_tri_gan_nhat?: string | null
          ngay_bao_tri_ke_tiep?: string | null
          ngay_cap_phat?: string | null
          ngay_kiem_ke_ke_tiep?: string | null
          ngay_mua?: string | null
          nguoi_giu?: string | null
          nguon_du_lieu?: string | null
          nha_cung_cap?: string | null
          nha_cung_cap_id?: string | null
          nha_san_xuat?: string | null
          nha_san_xuat_id?: string | null
          nhom_he_thong_id?: string | null
          noi_cat_giu?: string | null
          noi_chuyen_den?: string | null
          noi_chuyen_di?: string | null
          noi_quan_ly?: string | null
          p_n?: string | null
          phan_loai?: string | null
          phan_loai_id?: string | null
          qr_code?: string | null
          quyet_dinh_cham_dut?: string | null
          search_text?: string | null
          search_tsv?: unknown
          so_nam_su_dung?: number | null
          ten_thiet_bi: string
          thanh_phan?: string | null
          thoi_diem_cham_dut?: string | null
          thoi_diem_dieu_chuyen?: string | null
          thong_ke_hong_hoc?: string | null
          tinh_trang_ky_thuat?: string | null
          trang_thai_cap_phat?: string
          trang_thai_id?: string | null
          ty_le_tuoi_tho?: number | null
          updated_at?: string
          vat_tu_du_phong?: string | null
          vi_tri?: string | null
          vi_tri_id?: string | null
        }
        Update: {
          attrs?: Json
          che_do_kd_hc?: string
          created_at?: string
          created_by?: string | null
          danh_gia_nien_han_id?: string | null
          de_xuat_khac?: string | null
          de_xuat_phuong_an?: string | null
          de_xuat_tiep_tuc?: string | null
          do_tin_cay?: string | null
          don_vi_giu_id?: string | null
          don_vi_id?: string | null
          don_vi_quan_ly_id?: string | null
          field_set_id?: string | null
          file_tai_lieu?: string | null
          ghi_chu?: string | null
          giay_phep_khai_thac?: string | null
          giay_phep_tan_so?: string | null
          han_bao_hanh?: string | null
          he_thong_id?: string | null
          hinh_anh?: string | null
          id?: string
          la_linh_kien?: boolean
          loai_thiet_bi_id?: string | null
          ly_do_dieu_chuyen?: string | null
          ma_serial?: string | null
          ma_tai_san_bravo?: string | null
          ma_thiet_bi?: string
          ma_thiet_bi_cu?: string | null
          model?: string | null
          model_id?: string | null
          nam_dua_vao_khai_thac?: number | null
          nam_san_xuat?: number | null
          ngay_bao_tri_gan_nhat?: string | null
          ngay_bao_tri_ke_tiep?: string | null
          ngay_cap_phat?: string | null
          ngay_kiem_ke_ke_tiep?: string | null
          ngay_mua?: string | null
          nguoi_giu?: string | null
          nguon_du_lieu?: string | null
          nha_cung_cap?: string | null
          nha_cung_cap_id?: string | null
          nha_san_xuat?: string | null
          nha_san_xuat_id?: string | null
          nhom_he_thong_id?: string | null
          noi_cat_giu?: string | null
          noi_chuyen_den?: string | null
          noi_chuyen_di?: string | null
          noi_quan_ly?: string | null
          p_n?: string | null
          phan_loai?: string | null
          phan_loai_id?: string | null
          qr_code?: string | null
          quyet_dinh_cham_dut?: string | null
          search_text?: string | null
          search_tsv?: unknown
          so_nam_su_dung?: number | null
          ten_thiet_bi?: string
          thanh_phan?: string | null
          thoi_diem_cham_dut?: string | null
          thoi_diem_dieu_chuyen?: string | null
          thong_ke_hong_hoc?: string | null
          tinh_trang_ky_thuat?: string | null
          trang_thai_cap_phat?: string
          trang_thai_id?: string | null
          ty_le_tuoi_tho?: number | null
          updated_at?: string
          vat_tu_du_phong?: string | null
          vi_tri?: string | null
          vi_tri_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_danh_gia_nien_han_id_fkey"
            columns: ["danh_gia_nien_han_id"]
            isOneToOne: false
            referencedRelation: "dm_danh_gia_nien_han"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_don_vi_giu_id_fkey"
            columns: ["don_vi_giu_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_don_vi_quan_ly_id_fkey"
            columns: ["don_vi_quan_ly_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_field_set_id_fkey"
            columns: ["field_set_id"]
            isOneToOne: false
            referencedRelation: "field_set"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_loai_thiet_bi_id_fkey"
            columns: ["loai_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "dm_model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_nha_cung_cap_id_fkey"
            columns: ["nha_cung_cap_id"]
            isOneToOne: false
            referencedRelation: "dm_nha_cung_cap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_nha_san_xuat_id_fkey"
            columns: ["nha_san_xuat_id"]
            isOneToOne: false
            referencedRelation: "dm_nha_san_xuat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_nha_san_xuat_id_fkey"
            columns: ["nha_san_xuat_id"]
            isOneToOne: false
            referencedRelation: "v_nsx_stats"
            referencedColumns: ["nha_san_xuat_id"]
          },
          {
            foreignKeyName: "thiet_bi_nhom_he_thong_id_fkey"
            columns: ["nhom_he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_nhom_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_phan_loai_id_fkey"
            columns: ["phan_loai_id"]
            isOneToOne: false
            referencedRelation: "dm_phan_loai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_trang_thai_id_fkey"
            columns: ["trang_thai_id"]
            isOneToOne: false
            referencedRelation: "dm_trang_thai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_vi_tri_id_fkey"
            columns: ["vi_tri_id"]
            isOneToOne: false
            referencedRelation: "dm_vi_tri"
            referencedColumns: ["id"]
          },
        ]
      }
      thiet_bi_cap_phat: {
        Row: {
          created_at: string
          don_vi_giu_id: string | null
          ghi_chu: string | null
          hanh_dong: string
          id: string
          nguoi_giu: string | null
          thiet_bi_id: string
          thoi_diem: string
          thuc_hien_boi: string | null
        }
        Insert: {
          created_at?: string
          don_vi_giu_id?: string | null
          ghi_chu?: string | null
          hanh_dong: string
          id?: string
          nguoi_giu?: string | null
          thiet_bi_id: string
          thoi_diem?: string
          thuc_hien_boi?: string | null
        }
        Update: {
          created_at?: string
          don_vi_giu_id?: string | null
          ghi_chu?: string | null
          hanh_dong?: string
          id?: string
          nguoi_giu?: string | null
          thiet_bi_id?: string
          thoi_diem?: string
          thuc_hien_boi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_cap_phat_don_vi_giu_id_fkey"
            columns: ["don_vi_giu_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_cap_phat_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_cap_phat_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_cap_phat_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      thiet_bi_do_dac: {
        Row: {
          chi_so: string
          created_at: string
          created_by: string | null
          don_vi_do: string | null
          ghi_chu: string | null
          gia_tri: number | null
          id: string
          nguon: string | null
          thiet_bi_id: string
          thoi_diem: string
        }
        Insert: {
          chi_so: string
          created_at?: string
          created_by?: string | null
          don_vi_do?: string | null
          ghi_chu?: string | null
          gia_tri?: number | null
          id?: string
          nguon?: string | null
          thiet_bi_id: string
          thoi_diem?: string
        }
        Update: {
          chi_so?: string
          created_at?: string
          created_by?: string | null
          don_vi_do?: string | null
          ghi_chu?: string | null
          gia_tri?: number | null
          id?: string
          nguon?: string | null
          thiet_bi_id?: string
          thoi_diem?: string
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_do_dac_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_do_dac_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_do_dac_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      thiet_bi_ket_noi: {
        Row: {
          created_at: string
          created_by: string | null
          den_cong: string | null
          den_thiet_bi_id: string
          don_vi_id_snapshot: string | null
          id: string
          loai: string
          mo_ta: string | null
          ten_mach: string | null
          tu_cong: string | null
          tu_thiet_bi_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          den_cong?: string | null
          den_thiet_bi_id: string
          don_vi_id_snapshot?: string | null
          id?: string
          loai?: string
          mo_ta?: string | null
          ten_mach?: string | null
          tu_cong?: string | null
          tu_thiet_bi_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          den_cong?: string | null
          den_thiet_bi_id?: string
          don_vi_id_snapshot?: string | null
          id?: string
          loai?: string
          mo_ta?: string | null
          ten_mach?: string | null
          tu_cong?: string | null
          tu_thiet_bi_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      thiet_bi_khe_linh_kien: {
        Row: {
          bat_buoc: boolean
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          hieu_luc_den: string | null
          hieu_luc_tu: string | null
          id: string
          khe_cha: string | null
          loai_thiet_bi_yeu_cau: string | null
          ma_khe: string
          mo_ta: string | null
          ten: string
          thiet_bi_id: string
          thu_tu: number | null
          trang_thai: string
          updated_at: string
        }
        Insert: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          id?: string
          khe_cha?: string | null
          loai_thiet_bi_yeu_cau?: string | null
          ma_khe: string
          mo_ta?: string | null
          ten: string
          thiet_bi_id: string
          thu_tu?: number | null
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          bat_buoc?: boolean
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          hieu_luc_den?: string | null
          hieu_luc_tu?: string | null
          id?: string
          khe_cha?: string | null
          loai_thiet_bi_yeu_cau?: string | null
          ma_khe?: string
          mo_ta?: string | null
          ten?: string
          thiet_bi_id?: string
          thu_tu?: number | null
          trang_thai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_khe_cha_fkey"
            columns: ["khe_cha"]
            isOneToOne: false
            referencedRelation: "thiet_bi_khe_linh_kien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau_fkey"
            columns: ["loai_thiet_bi_yeu_cau"]
            isOneToOne: false
            referencedRelation: "dm_loai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      thiet_bi_tep_dinh_kem: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          kich_thuoc: number | null
          loai: Database["public"]["Enums"]["thiet_bi_tep_loai"]
          mime_type: string | null
          mo_ta: string | null
          thiet_bi_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          kich_thuoc?: number | null
          loai: Database["public"]["Enums"]["thiet_bi_tep_loai"]
          mime_type?: string | null
          mo_ta?: string | null
          thiet_bi_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          kich_thuoc?: number | null
          loai?: Database["public"]["Enums"]["thiet_bi_tep_loai"]
          mime_type?: string | null
          mo_ta?: string | null
          thiet_bi_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_tep_dinh_kem_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_tep_dinh_kem_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_tep_dinh_kem_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      thiet_bi_vong_doi: {
        Row: {
          created_at: string
          den_trang_thai_id: string | null
          id: string
          ly_do: string | null
          nguoi_thuc_hien: string | null
          thiet_bi_id: string
          thoi_diem: string
          tu_trang_thai_id: string | null
        }
        Insert: {
          created_at?: string
          den_trang_thai_id?: string | null
          id?: string
          ly_do?: string | null
          nguoi_thuc_hien?: string | null
          thiet_bi_id: string
          thoi_diem?: string
          tu_trang_thai_id?: string | null
        }
        Update: {
          created_at?: string
          den_trang_thai_id?: string | null
          id?: string
          ly_do?: string | null
          nguoi_thuc_hien?: string | null
          thiet_bi_id?: string
          thoi_diem?: string
          tu_trang_thai_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_vong_doi_den_trang_thai_id_fkey"
            columns: ["den_trang_thai_id"]
            isOneToOne: false
            referencedRelation: "dm_trang_thai_thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_vong_doi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_vong_doi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_vong_doi_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "thiet_bi_vong_doi_tu_trang_thai_id_fkey"
            columns: ["tu_trang_thai_id"]
            isOneToOne: false
            referencedRelation: "dm_trang_thai_thiet_bi"
            referencedColumns: ["id"]
          },
        ]
      }
      thong_bao: {
        Row: {
          created_at: string
          da_doc: boolean
          da_doc_at: string | null
          da_doc_boi: string | null
          den_han_at: string
          doi_tuong_bang: string
          doi_tuong_ref: string
          don_vi_id: string | null
          email_queued: boolean
          id: string
          kenh: Json
          khoa_chong_trung: string
          loai: string
          muc_do: string
          nguoi_nhan: string | null
          nguong: number | null
          noi_dung: string
          tieu_de: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          da_doc?: boolean
          da_doc_at?: string | null
          da_doc_boi?: string | null
          den_han_at: string
          doi_tuong_bang: string
          doi_tuong_ref: string
          don_vi_id?: string | null
          email_queued?: boolean
          id?: string
          kenh?: Json
          khoa_chong_trung: string
          loai: string
          muc_do: string
          nguoi_nhan?: string | null
          nguong?: number | null
          noi_dung: string
          tieu_de: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          da_doc?: boolean
          da_doc_at?: string | null
          da_doc_boi?: string | null
          den_han_at?: string
          doi_tuong_bang?: string
          doi_tuong_ref?: string
          don_vi_id?: string | null
          email_queued?: boolean
          id?: string
          kenh?: Json
          khoa_chong_trung?: string
          loai?: string
          muc_do?: string
          nguoi_nhan?: string | null
          nguong?: number | null
          noi_dung?: string
          tieu_de?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thong_bao_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      thong_bao_cau_hinh: {
        Row: {
          created_at: string
          don_vi_id: string | null
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          loai: string | null
          nguong: number[]
          scope: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          don_vi_id?: string | null
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          loai?: string | null
          nguong?: number[]
          scope: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          don_vi_id?: string | null
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          loai?: string | null
          nguong?: number[]
          scope?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thong_bao_cau_hinh_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      thong_bao_email_queue: {
        Row: {
          attempt: number
          body: string
          created_at: string
          id: string
          last_error: string | null
          sent_at: string | null
          subject: string
          thong_bao_id: string
          to_email: string
          trang_thai: string
        }
        Insert: {
          attempt?: number
          body: string
          created_at?: string
          id?: string
          last_error?: string | null
          sent_at?: string | null
          subject: string
          thong_bao_id: string
          to_email: string
          trang_thai?: string
        }
        Update: {
          attempt?: number
          body?: string
          created_at?: string
          id?: string
          last_error?: string | null
          sent_at?: string | null
          subject?: string
          thong_bao_id?: string
          to_email?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "thong_bao_email_queue_thong_bao_id_fkey"
            columns: ["thong_bao_id"]
            isOneToOne: false
            referencedRelation: "thong_bao"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comment: {
        Row: {
          created_at: string
          id: string
          noi_dung: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          noi_dung: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          noi_dung?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comment_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          don_vi: string | null
          first_response_at: string | null
          he_thong_id: string | null
          id: string
          ket_qua: string | null
          loai: Database["public"]["Enums"]["ticket_loai"]
          mo_ta: string | null
          sla_han: string | null
          su_co_id: string | null
          thiet_bi_id: string | null
          tieu_de: string
          trang_thai: Database["public"]["Enums"]["ticket_trang_thai"]
          updated_at: string
          uu_tien: Database["public"]["Enums"]["ticket_uu_tien"]
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          don_vi?: string | null
          first_response_at?: string | null
          he_thong_id?: string | null
          id?: string
          ket_qua?: string | null
          loai?: Database["public"]["Enums"]["ticket_loai"]
          mo_ta?: string | null
          sla_han?: string | null
          su_co_id?: string | null
          thiet_bi_id?: string | null
          tieu_de: string
          trang_thai?: Database["public"]["Enums"]["ticket_trang_thai"]
          updated_at?: string
          uu_tien?: Database["public"]["Enums"]["ticket_uu_tien"]
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          don_vi?: string | null
          first_response_at?: string | null
          he_thong_id?: string | null
          id?: string
          ket_qua?: string | null
          loai?: Database["public"]["Enums"]["ticket_loai"]
          mo_ta?: string | null
          sla_han?: string | null
          su_co_id?: string | null
          thiet_bi_id?: string | null
          tieu_de?: string
          trang_thai?: Database["public"]["Enums"]["ticket_trang_thai"]
          updated_at?: string
          uu_tien?: Database["public"]["Enums"]["ticket_uu_tien"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_su_co_id_fkey"
            columns: ["su_co_id"]
            isOneToOne: false
            referencedRelation: "su_co"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "tickets_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      user_layout_prefs: {
        Row: {
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_pinned: {
        Row: {
          created_at: string
          label: string
          order: number
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          label: string
          order?: number
          path: string
          user_id: string
        }
        Update: {
          created_at?: string
          label?: string
          order?: number
          path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recent: {
        Row: {
          label: string
          path: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          label: string
          path: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          label?: string
          path?: string
          user_id?: string
          viewed_at?: string
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
      user_scope: {
        Row: {
          created_at: string
          created_by: string | null
          don_vi_id: string | null
          id: string
          note: string | null
          to_chuc_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          id?: string
          note?: string | null
          to_chuc_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_vi_id?: string | null
          id?: string
          note?: string | null
          to_chuc_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scope_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scope_to_chuc_id_fkey"
            columns: ["to_chuc_id"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
        ]
      }
      van_de: {
        Row: {
          bien_phap_khac_phuc: string | null
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          he_thong_id: string | null
          id: string
          ma_van_de: string | null
          mo_ta: string | null
          muc_do: string
          nguyen_nhan_goc: string | null
          thiet_bi_id: string | null
          tieu_de: string
          trang_thai: string
          updated_at: string
        }
        Insert: {
          bien_phap_khac_phuc?: string | null
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          he_thong_id?: string | null
          id?: string
          ma_van_de?: string | null
          mo_ta?: string | null
          muc_do?: string
          nguyen_nhan_goc?: string | null
          thiet_bi_id?: string | null
          tieu_de: string
          trang_thai?: string
          updated_at?: string
        }
        Update: {
          bien_phap_khac_phuc?: string | null
          created_at?: string
          created_by?: string | null
          don_vi_id_snapshot?: string | null
          he_thong_id?: string | null
          id?: string
          ma_van_de?: string | null
          mo_ta?: string | null
          muc_do?: string
          nguyen_nhan_goc?: string | null
          thiet_bi_id?: string | null
          tieu_de?: string
          trang_thai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_de_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      vat_tu: {
        Row: {
          created_at: string
          created_by: string | null
          don_gia: number
          don_vi_id: string | null
          don_vi_tinh: string
          ghi_chu: string | null
          id: string
          kich_hoat: boolean
          loai: string
          ma_vat_tu: string | null
          model_id: string | null
          muc_ton_toi_thieu: number
          nha_cung_cap_id: string | null
          ten: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          don_gia?: number
          don_vi_id?: string | null
          don_vi_tinh?: string
          ghi_chu?: string | null
          id?: string
          kich_hoat?: boolean
          loai?: string
          ma_vat_tu?: string | null
          model_id?: string | null
          muc_ton_toi_thieu?: number
          nha_cung_cap_id?: string | null
          ten: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          don_gia?: number
          don_vi_id?: string | null
          don_vi_tinh?: string
          ghi_chu?: string | null
          id?: string
          kich_hoat?: boolean
          loai?: string
          ma_vat_tu?: string | null
          model_id?: string | null
          muc_ton_toi_thieu?: number
          nha_cung_cap_id?: string | null
          ten?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vat_tu_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_tu_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "dm_model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_tu_nha_cung_cap_id_fkey"
            columns: ["nha_cung_cap_id"]
            isOneToOne: false
            referencedRelation: "dm_nha_cung_cap"
            referencedColumns: ["id"]
          },
        ]
      }
      vi_tri_media: {
        Row: {
          chup_luc: string | null
          content_type: string | null
          created_at: string
          created_by: string
          do_chinh_xac: number | null
          don_vi: string | null
          duong_dan: string
          id: string
          kich_thuoc: number | null
          kinh_do: number | null
          loai: string
          mo_ta: string | null
          ten_tep: string
          vi_do: number | null
          vi_tri_ma: string
        }
        Insert: {
          chup_luc?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string
          do_chinh_xac?: number | null
          don_vi?: string | null
          duong_dan: string
          id?: string
          kich_thuoc?: number | null
          kinh_do?: number | null
          loai?: string
          mo_ta?: string | null
          ten_tep: string
          vi_do?: number | null
          vi_tri_ma: string
        }
        Update: {
          chup_luc?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string
          do_chinh_xac?: number | null
          don_vi?: string | null
          duong_dan?: string
          id?: string
          kich_thuoc?: number | null
          kinh_do?: number | null
          loai?: string
          mo_ta?: string | null
          ten_tep?: string
          vi_do?: number | null
          vi_tri_ma?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          backed_up: boolean
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          backed_up?: boolean
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          backed_up?: boolean
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_asset_anomaly: {
        Row: {
          asset_id: string | null
          incident_count_90d: number | null
          z_score: number | null
        }
        Relationships: []
      }
      mv_dashboard_overview: {
        Row: {
          payload: Json | null
        }
        Relationships: []
      }
      v_canh_bao_nien_han: {
        Row: {
          de_xuat_phuong_an: string | null
          ma_thiet_bi: string | null
          so_nam_su_dung: number | null
          ten_thiet_bi: string | null
          ty_le_tuoi_tho: number | null
        }
        Relationships: []
      }
      v_canh_dieu_huong: {
        Row: {
          co_huong: boolean | null
          den: string | null
          lan_truyen_tac_dong: boolean | null
          lien_ket_id: string | null
          loai_lien_ket_id: string | null
          loai_ma: string | null
          tu: string | null
        }
        Relationships: []
      }
      v_do_thi_he_thong: {
        Row: {
          co_huong: boolean | null
          dich_ben_ngoai: boolean | null
          dich_don_vi: string | null
          dich_id: string | null
          dich_nhom: string | null
          dich_ten: string | null
          dich_to_chuc: string | null
          don_vi_id_snapshot: string | null
          giao_dien_dich: string | null
          giao_dien_nguon: string | null
          giao_thuc: string | null
          huong: string | null
          id: string | null
          kieu_net: string | null
          loai_lien_ket_id: string | null
          loai_ma: string | null
          loai_ten: string | null
          lop: string | null
          mau_sac: string | null
          nguon_ben_ngoai: boolean | null
          nguon_don_vi: string | null
          nguon_id: string | null
          nguon_nhom: string | null
          nguon_ten: string | null
          nguon_to_chuc: string | null
          trang_thai: string | null
          vai_tro_du_phong: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_dich_id_fkey"
            columns: ["dich_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_dich_id_fkey"
            columns: ["dich_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_nguon_id_fkey"
            columns: ["nguon_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_he_thong_nguon_id_fkey"
            columns: ["nguon_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_he_thong_loai_lien_ket_id_fkey"
            columns: ["loai_lien_ket_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_lien_ket"
            referencedColumns: ["id"]
          },
        ]
      }
      v_do_thi_toan_canh: {
        Row: {
          bac_lien_ket: number | null
          ben_ngoai: boolean | null
          don_vi_id: string | null
          don_vi_ten: string | null
          id: string | null
          ma: string | null
          nhom_he_thong_id: string | null
          nhom_ten: string | null
          pham_vi_quan_ly: string | null
          ten: string | null
          to_chuc_cha_id: string | null
          to_chuc_id: string | null
          to_chuc_loai: string | null
          to_chuc_ma: string | null
          to_chuc_mau: string | null
          to_chuc_so_huu: string | null
          to_chuc_ten: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_he_thong_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_nhom_he_thong_id_fkey"
            columns: ["nhom_he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_nhom_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_he_thong_to_chuc_id_fkey"
            columns: ["to_chuc_id"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_to_chuc_to_chuc_cha_id_fkey"
            columns: ["to_chuc_cha_id"]
            isOneToOne: false
            referencedRelation: "dm_to_chuc"
            referencedColumns: ["id"]
          },
        ]
      }
      v_giay_phep: {
        Row: {
          bi_thay_the: boolean | null
          created_at: string | null
          don_vi_id: string | null
          don_vi_ma: string | null
          don_vi_ten: string | null
          file_url: string | null
          ghi_chu: string | null
          gp_cu: string | null
          he_thong_id: string | null
          id: string | null
          kieu_thiet_bi: string | null
          loai: string | null
          loai_ma: string | null
          ma_giay_phep: string | null
          ngay_cap: string | null
          ngay_het_han: string | null
          nguon: string | null
          noi_cap: string | null
          pham_vi: string | null
          so_giay_phep: string | null
          so_ngay_con_lai: number | null
          ten_doi_tuong: string | null
          thiet_bi_id: string | null
          trang_thai: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_he_thong_ky_thuat_summary: {
        Row: {
          so_he_thong: number | null
          so_nhom: number | null
          so_tai_san: number | null
          so_tai_san_chua_gan_he_thong: number | null
          so_tai_san_dang_lap: number | null
          so_thanh_phan: number | null
        }
        Relationships: []
      }
      v_kpi_bao_tri: {
        Row: {
          da_hoan_thanh: number | null
          dang_mo: number | null
          don_vi_id: string | null
          don_vi_ten: string | null
          hoan_thanh_dung_han: number | null
          qua_han: number | null
          tong_cong_viec: number | null
          ty_le_dung_han: number | null
        }
        Relationships: []
      }
      v_lien_ket_tu_khe: {
        Row: {
          co_huong: boolean | null
          giao_dien_dich: string | null
          giao_dien_nguon: string | null
          giao_thuc: string | null
          he_thong_dich_id: string | null
          he_thong_nguon_id: string | null
          khe_dich_id: string | null
          khe_nguon_id: string | null
          lan_truyen_tac_dong: boolean | null
          lien_ket_khe_id: string | null
          loai_lien_ket_id: string | null
          loai_ma: string | null
          trang_thai: string | null
        }
        Relationships: [
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_dich_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_nguon_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_dich_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_nguon_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_khe_khe_dich_id_fkey"
            columns: ["khe_dich_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_khe_khe_nguon_id_fkey"
            columns: ["khe_nguon_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_ket_khe_loai_lien_ket_id_fkey"
            columns: ["loai_lien_ket_id"]
            isOneToOne: false
            referencedRelation: "dm_loai_lien_ket"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ly_lich_he_thong: {
        Row: {
          he_thong_id: string | null
          loai_su_kien: string | null
          mo_ta: string | null
          nguon: string | null
          nguon_id: string | null
          thanh_phan_id: string | null
          thiet_bi_id: string | null
          thoi_diem: string | null
          tieu_de: string | null
        }
        Relationships: []
      }
      v_ly_lich_khe_linh_kien: {
        Row: {
          den_ngay: string | null
          gan_id: string | null
          ghi_chu: string | null
          hong_hoc_id: string | null
          khe_id: string | null
          linh_kien_id: string | null
          ly_do: string | null
          ma_khe: string | null
          ma_serial: string | null
          ma_thiet_bi: string | null
          nguoi_thuc_hien: string | null
          ten_khe: string | null
          ten_linh_kien: string | null
          thiet_bi_cha_id: string | null
          tu_ngay: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gan_linh_kien_hong_hoc_id_fkey"
            columns: ["hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_khe_id_fkey"
            columns: ["khe_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi_khe_linh_kien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_linh_kien_linh_kien_id_fkey"
            columns: ["linh_kien_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_cha_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_cha_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_khe_linh_kien_thiet_bi_id_fkey"
            columns: ["thiet_bi_cha_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      v_ly_lich_thanh_phan: {
        Row: {
          loai_su_kien: string | null
          ma_thiet_bi: string | null
          mo_ta: string | null
          nguon: string | null
          nguon_id: string | null
          thanh_phan_id: string | null
          thiet_bi_id: string | null
          thoi_diem: string | null
          tieu_de: string | null
        }
        Relationships: []
      }
      v_ly_lich_thiet_bi: {
        Row: {
          loai_su_kien: string | null
          mo_ta: string | null
          nguon: string | null
          nguon_id: string | null
          thiet_bi_id: string | null
          thoi_diem: string | null
          tieu_de: string | null
        }
        Relationships: []
      }
      v_ly_lich_vi_tri_chuc_nang: {
        Row: {
          den_ngay: string | null
          gan_id: string | null
          ghi_chu: string | null
          he_thong_id: string | null
          hong_hoc_id: string | null
          ly_do: string | null
          ma_serial: string | null
          ma_thanh_phan: string | null
          ma_thiet_bi: string | null
          nguoi_thuc_hien: string | null
          ten_thiet_bi: string | null
          ten_vi_tri: string | null
          thanh_phan_id: string | null
          thiet_bi_id: string | null
          tu_ngay: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gan_chuc_nang_hong_hoc_id_fkey"
            columns: ["hong_hoc_id"]
            isOneToOne: false
            referencedRelation: "hong_hoc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thanh_phan_id_fkey"
            columns: ["thanh_phan_id"]
            isOneToOne: false
            referencedRelation: "he_thong_thanh_phan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gan_chuc_nang_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "he_thong_thanh_phan_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
        ]
      }
      v_menu_badges: {
        Row: {
          bao_tri_hom_nay: number | null
          bao_tri_mo: number | null
          hong_hoc_mo: number | null
          su_co_mo: number | null
        }
        Relationships: []
      }
      v_nsx_stats: {
        Row: {
          ma: string | null
          nha_san_xuat_id: string | null
          so_model: number | null
          so_thiet_bi: number | null
          ten: string | null
        }
        Relationships: []
      }
      v_sap_het_han: {
        Row: {
          loai: string | null
          ngay_het_han: string | null
          so_ngay_con_lai: number | null
          ten: string | null
          thiet_bi_id: string | null
        }
        Relationships: []
      }
      v_thiet_bi_dac_tinh: {
        Row: {
          dac_tinh_id: string | null
          thiet_bi_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_model_dac_tinh_dac_tinh_id_fkey"
            columns: ["dac_tinh_id"]
            isOneToOne: false
            referencedRelation: "dm_dac_tinh"
            referencedColumns: ["id"]
          },
        ]
      }
      v_thiet_bi_ket_noi: {
        Row: {
          created_at: string | null
          created_by: string | null
          den_cong: string | null
          den_ma: string | null
          den_ten: string | null
          den_thiet_bi_id: string | null
          don_vi_id_snapshot: string | null
          don_vi_ma: string | null
          don_vi_ten: string | null
          id: string | null
          loai: string | null
          mo_ta: string | null
          ten_mach: string | null
          tu_cong: string | null
          tu_ma: string | null
          tu_ten: string | null
          tu_thiet_bi_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_den_thiet_bi_id_fkey"
            columns: ["den_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thiet_bi_ket_noi_tu_thiet_bi_id_fkey"
            columns: ["tu_thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
      v_ton_kho: {
        Row: {
          don_vi_id: string | null
          don_vi_tinh: string | null
          kho_id: string | null
          loai: string | null
          ma_vat_tu: string | null
          muc_ton_toi_thieu: number | null
          ten_kho: string | null
          ten_vat_tu: string | null
          ton_kho: number | null
          vat_tu_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kho_giao_dich_kho_id_fkey"
            columns: ["kho_id"]
            isOneToOne: false
            referencedRelation: "kho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kho_giao_dich_vat_tu_id_fkey"
            columns: ["vat_tu_id"]
            isOneToOne: false
            referencedRelation: "v_ton_kho_canh_bao"
            referencedColumns: ["vat_tu_id"]
          },
          {
            foreignKeyName: "kho_giao_dich_vat_tu_id_fkey"
            columns: ["vat_tu_id"]
            isOneToOne: false
            referencedRelation: "vat_tu"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ton_kho_canh_bao: {
        Row: {
          don_vi_id: string | null
          don_vi_tinh: string | null
          loai: string | null
          ma_vat_tu: string | null
          muc_ton_toi_thieu: number | null
          ten_vat_tu: string | null
          tong_ton: number | null
          vat_tu_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vat_tu_don_vi_id_fkey"
            columns: ["don_vi_id"]
            isOneToOne: false
            referencedRelation: "dm_don_vi"
            referencedColumns: ["id"]
          },
        ]
      }
      v_van_de: {
        Row: {
          bien_phap_khac_phuc: string | null
          created_at: string | null
          created_by: string | null
          don_vi_id_snapshot: string | null
          don_vi_ten: string | null
          he_thong_id: string | null
          he_thong_ten: string | null
          id: string | null
          ma_van_de: string | null
          mo_ta: string | null
          muc_do: string | null
          nguyen_nhan_goc: string | null
          so_su_co: number | null
          so_thay_doi: number | null
          thiet_bi_id: string | null
          thiet_bi_ma: string | null
          thiet_bi_ten: string | null
          tieu_de: string | null
          trang_thai: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "van_de_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "dm_he_thong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_he_thong_id_fkey"
            columns: ["he_thong_id"]
            isOneToOne: false
            referencedRelation: "v_do_thi_toan_canh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "mv_asset_anomaly"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "thiet_bi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_de_thiet_bi_id_fkey"
            columns: ["thiet_bi_id"]
            isOneToOne: false
            referencedRelation: "v_thiet_bi_dac_tinh"
            referencedColumns: ["thiet_bi_id"]
          },
        ]
      }
    }
    Functions: {
      _admin_check_ident: { Args: { _ident: string }; Returns: undefined }
      _admin_check_table: { Args: { _table: string }; Returns: undefined }
      _admin_check_type: { Args: { _type: string }; Returns: undefined }
      _backup_allowed_table: { Args: { p_table: string }; Returns: boolean }
      _cay_apply: { Args: { _id: string }; Returns: Json }
      _danh_muc_merge_ref_map: { Args: never; Returns: Json }
      _debug_test_insert: { Args: never; Returns: string }
      _dong_gan_lk: {
        Args: {
          p_gan_id: string
          p_hong_hoc_id: string
          p_ly_do_gan: string
          p_ly_do_vd: string
          p_trang_thai_moi: string
        }
        Returns: undefined
      }
      _dong_gan_va_vong_doi: {
        Args: {
          p_gan_id: string
          p_hong_hoc_id: string
          p_ly_do_gan: string
          p_ly_do_vd: string
          p_trang_thai_moi: string
        }
        Returns: undefined
      }
      _gen_ma_thiet_bi_random: { Args: { len?: number }; Returns: string }
      _import_allowed_table: { Args: { _tbl: string }; Returns: boolean }
      _import_has_dependents: {
        Args: { _id: string; _tbl: string }
        Returns: boolean
      }
      _map_trang_thai_tb: { Args: { p_key: string }; Returns: string }
      _mo_gan_lk: {
        Args: {
          p_ghi_chu: string
          p_hong_hoc_id: string
          p_khe_id: string
          p_lk_id: string
          p_ly_do: string
        }
        Returns: string
      }
      _mo_gan_va_vong_doi: {
        Args: {
          p_ghi_chu: string
          p_hong_hoc_id: string
          p_ly_do: string
          p_thanh_phan_id: string
          p_thiet_bi_id: string
        }
        Returns: string
      }
      _n6_normalize: { Args: { _raw: string }; Returns: string }
      _search_tsv: {
        Args: { _noi_dung: string; _tieu_de: string }
        Returns: unknown
      }
      _sync_3lop: {
        Args: {
          p_he_thong_id: string
          p_ngay: string
          p_thanh_phan_id: string
          p_thiet_bi_id: string
        }
        Returns: Record<string, unknown>
      }
      _try_date: { Args: { txt: string }; Returns: string }
      _validate_vi_tri_tuong_thich: {
        Args: { p_thanh_phan_id: string; p_vi_tri_id: string }
        Returns: undefined
      }
      admin_add_column: {
        Args: {
          _column: string
          _default?: string
          _nullable?: boolean
          _table: string
          _type: string
        }
        Returns: undefined
      }
      admin_drop_column: {
        Args: { _column: string; _table: string }
        Returns: undefined
      }
      admin_get_audit_retention: { Args: never; Returns: number }
      admin_import_rows: {
        Args: { p_rows: Json; p_table: string }
        Returns: number
      }
      admin_list_backup_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      admin_list_schema: { Args: never; Returns: Json }
      admin_rename_column: {
        Args: { _new: string; _old: string; _table: string }
        Returns: undefined
      }
      admin_reset_sequences: { Args: never; Returns: number }
      admin_restore_database: { Args: { payload: Json }; Returns: Json }
      admin_rollback_audit: { Args: { _audit_id: string }; Returns: Json }
      admin_set_audit_retention: { Args: { _days: number }; Returns: number }
      agent_add_bao_tri: {
        Args: {
          p_don_vi?: string
          p_he_thong: string
          p_ke_hoach?: string
          p_ket_qua?: string
          p_loai_bao_tri?: string
          p_mo_ta_cong_viec: string
          p_ngay_bat_dau?: string
          p_ngay_hoan_thanh?: string
          p_thiet_bi?: string
        }
        Returns: Json
      }
      agent_add_hong_hoc: {
        Args: {
          p_bo_phan_hong?: string
          p_mo_ta_hong_hoc: string
          p_ngay_hong?: string
          p_phuong_an?: string
          p_su_co?: string
          p_thiet_bi_hong: string
          p_thiet_bi_thay_the?: string
        }
        Returns: Json
      }
      agent_add_kiem_ke: {
        Args: {
          p_ghi_chu?: string
          p_nguoi_kiem?: string
          p_thiet_bi_id: string
          p_tinh_trang: string
          p_vi_tri_gps?: string
        }
        Returns: Json
      }
      agent_add_su_co: {
        Args: {
          p_bien_phap_xu_ly?: string
          p_don_vi?: string
          p_he_thong: string
          p_hien_tuong: string
          p_muc_do?: string
          p_ngay_phat_hien?: string
          p_nguoi_bao_cao?: string
          p_nguyen_nhan?: string
          p_thiet_bi?: string
        }
        Returns: Json
      }
      ai_describe_schema: { Args: never; Returns: Json }
      ai_run_select: {
        Args: { _max_rows?: number; _sql: string }
        Returns: Json
      }
      apply_import_batch: {
        Args: { _batch_id: string; _limit?: number }
        Returns: Json
      }
      approve_change_request: {
        Args: { p_id: string; p_ly_do?: string }
        Returns: string
      }
      backup_schema_json: { Args: never; Returns: Json }
      can_access_du_an: {
        Args: { _du_an_id: string; _user: string }
        Returns: boolean
      }
      can_access_so_do: {
        Args: { _so_do_id: string; _user: string }
        Returns: boolean
      }
      can_access_ticket: {
        Args: { _ticket_id: string; _user: string }
        Returns: boolean
      }
      can_edit_cong_viec: {
        Args: { _cv_id: string; _user: string }
        Returns: boolean
      }
      can_manage_du_an: {
        Args: { _du_an_id: string; _user: string }
        Returns: boolean
      }
      can_manage_equipment: { Args: { _user_id: string }; Returns: boolean }
      can_view_import_batch: {
        Args: { _batch_id: string; _user: string }
        Returns: boolean
      }
      can_view_thiet_bi: {
        Args: { _id: string; _user: string }
        Returns: boolean
      }
      can_view_thiet_bi_ma: {
        Args: { _ma: string; _user: string }
        Returns: boolean
      }
      cancel_change_request: { Args: { p_id: string }; Returns: undefined }
      cap_phat_thiet_bi: {
        Args: {
          _don_vi_giu_id?: string
          _ghi_chu?: string
          _hanh_dong: string
          _nguoi_giu?: string
          _thiet_bi_id: string
        }
        Returns: {
          attrs: Json
          che_do_kd_hc: string
          created_at: string
          created_by: string | null
          danh_gia_nien_han_id: string | null
          de_xuat_khac: string | null
          de_xuat_phuong_an: string | null
          de_xuat_tiep_tuc: string | null
          do_tin_cay: string | null
          don_vi_giu_id: string | null
          don_vi_id: string | null
          don_vi_quan_ly_id: string | null
          field_set_id: string | null
          file_tai_lieu: string | null
          ghi_chu: string | null
          giay_phep_khai_thac: string | null
          giay_phep_tan_so: string | null
          han_bao_hanh: string | null
          he_thong_id: string | null
          hinh_anh: string | null
          id: string
          la_linh_kien: boolean
          loai_thiet_bi_id: string | null
          ly_do_dieu_chuyen: string | null
          ma_serial: string | null
          ma_tai_san_bravo: string | null
          ma_thiet_bi: string
          ma_thiet_bi_cu: string | null
          model: string | null
          model_id: string | null
          nam_dua_vao_khai_thac: number | null
          nam_san_xuat: number | null
          ngay_bao_tri_gan_nhat: string | null
          ngay_bao_tri_ke_tiep: string | null
          ngay_cap_phat: string | null
          ngay_kiem_ke_ke_tiep: string | null
          ngay_mua: string | null
          nguoi_giu: string | null
          nguon_du_lieu: string | null
          nha_cung_cap: string | null
          nha_cung_cap_id: string | null
          nha_san_xuat: string | null
          nha_san_xuat_id: string | null
          nhom_he_thong_id: string | null
          noi_cat_giu: string | null
          noi_chuyen_den: string | null
          noi_chuyen_di: string | null
          noi_quan_ly: string | null
          p_n: string | null
          phan_loai: string | null
          phan_loai_id: string | null
          qr_code: string | null
          quyet_dinh_cham_dut: string | null
          search_text: string | null
          search_tsv: unknown
          so_nam_su_dung: number | null
          ten_thiet_bi: string
          thanh_phan: string | null
          thoi_diem_cham_dut: string | null
          thoi_diem_dieu_chuyen: string | null
          thong_ke_hong_hoc: string | null
          tinh_trang_ky_thuat: string | null
          trang_thai_cap_phat: string
          trang_thai_id: string | null
          ty_le_tuoi_tho: number | null
          updated_at: string
          vat_tu_du_phong: string | null
          vi_tri: string | null
          vi_tri_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "thiet_bi"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cay_duyet: { Args: { _approve: boolean; _id: string }; Returns: Json }
      cay_hoan_tac: { Args: { _id: string }; Returns: Json }
      cay_submit_change: {
        Args: {
          _he_thong_id: string
          _loai: string
          _mo_ta: string
          _payload: Json
        }
        Returns: Json
      }
      chuan_hoa_ten: { Args: { s: string }; Returns: string }
      create_change_request: {
        Args: {
          p_ghi_chu?: string
          p_loai: Database["public"]["Enums"]["change_request_loai"]
          p_payload: Json
        }
        Returns: string
      }
      current_jwt: { Args: never; Returns: Json }
      current_role: { Args: never; Returns: string }
      current_uid: { Args: never; Returns: string }
      dashboard_activity_feed: {
        Args: { p_don_vi_ids?: string[]; p_limit?: number }
        Returns: {
          at: string
          loai: string
          ref_id: string
          ref_route: string
          tieu_de: string
        }[]
      }
      dashboard_asset_status: {
        Args: { p_don_vi_ids?: string[] }
        Returns: {
          so_luong: number
          ten: string
          trang_thai_ma: string
        }[]
      }
      dashboard_brief_today: {
        Args: { p_don_vi_ids?: string[] }
        Returns: Json
      }
      dashboard_expiry_timeline: {
        Args: { p_days?: number; p_don_vi_ids?: string[] }
        Returns: {
          days_left: number
          loai: string
          ngay_het: string
          ref_id: string
          ten: string
        }[]
      }
      dashboard_health: {
        Args: { p_don_vi_ids?: string[]; p_from?: string; p_to?: string }
        Returns: Json
      }
      dashboard_kpis: {
        Args: { p_don_vi_ids?: string[]; p_from?: string; p_to?: string }
        Returns: Json
      }
      dashboard_su_co_by_month: {
        Args: { p_don_vi_ids?: string[]; p_months?: number }
        Returns: {
          muc_do: string
          so_luong: number
          thang: string
        }[]
      }
      dashboard_su_co_heatmap: {
        Args: { p_days?: number; p_don_vi_ids?: string[] }
        Returns: {
          dow: number
          hour: number
          so_luong: number
        }[]
      }
      dashboard_top_he_thong_su_co: {
        Args: { p_don_vi_ids?: string[]; p_limit?: number }
        Returns: {
          he_thong_id: string
          mttr_h: number
          so_su_co_mo: number
          ten_he_thong: string
        }[]
      }
      dashboard_top_thiet_bi_hong_lap: {
        Args: { p_don_vi_ids?: string[]; p_limit?: number }
        Returns: {
          ma: string
          mttr_h: number
          so_lan: number
          ten: string
          thiet_bi_id: string
        }[]
      }
      dieu_chuyen: {
        Args: {
          p_ghi_chu?: string
          p_thanh_phan_dich: string
          p_thiet_bi_id: string
        }
        Returns: string
      }
      dieu_chuyen_linh_kien: {
        Args: {
          p_ghi_chu?: string
          p_khe_moi_id: string
          p_linh_kien_id: string
        }
        Returns: string
      }
      dieu_chuyen_thiet_bi: {
        Args: {
          p_ghi_chu?: string
          p_thanh_phan_moi_id: string
          p_thiet_bi_id: string
        }
        Returns: string
      }
      dieu_chuyen_trao: {
        Args: {
          p_ghi_chu?: string
          p_thanh_phan_a: string
          p_thanh_phan_b: string
        }
        Returns: undefined
      }
      dm_xoa_an_toan: { Args: { _bang: string; _id: string }; Returns: Json }
      dong_van_de: {
        Args: { p_ghi_chu?: string; p_id: string }
        Returns: undefined
      }
      dot_bao_cao_tong_hop: { Args: { p_dot_id: string }; Returns: Json }
      dot_bao_duong_canh_bao: {
        Args: { p_dot_id: string; p_sap_han_ngay?: number }
        Returns: {
          cho_duyet: number
          da_duyet: number
          don_vi_id: string
          don_vi_ma: string
          don_vi_ten: string
          han_ngay: string
          hoan_thanh: number
          muc_do: string
          qua_han: number
          sap_han: number
          tong: number
        }[]
      }
      dot_hm_approve: {
        Args: { p_hang_muc_id: string; p_note?: string }
        Returns: undefined
      }
      dot_hm_reject: {
        Args: { p_hang_muc_id: string; p_note?: string }
        Returns: undefined
      }
      dot_hm_submit: { Args: { p_hang_muc_id: string }; Returns: undefined }
      dot_hm_unlock: { Args: { p_hang_muc_id: string }; Returns: undefined }
      dot_them_hang_muc_hang_loat: {
        Args: {
          p_don_vi_id: string
          p_dot_id: string
          p_he_thong_ids: string[]
        }
        Returns: number
      }
      f_unaccent: { Args: { "": string }; Returns: string }
      get_ai_public_config: {
        Args: never
        Returns: {
          beta_label: string
          enabled: boolean
          model: string
        }[]
      }
      get_user_don_vi_id: { Args: { _user_id: string }; Returns: string }
      get_user_don_vi_ma: { Args: { _user_id: string }; Returns: string }
      ghi_kiem_ke: {
        Args: {
          _anh_url?: string
          _chu_ky_ngay?: number
          _ghi_chu?: string
          _nguoi_kiem?: string
          _thiet_bi_id: string
          _thoi_diem?: string
          _tinh_trang: string
          _vi_tri_gps?: string
        }
        Returns: {
          anh_url: string | null
          created_at: string
          created_by: string | null
          ghi_chu: string | null
          id: string
          nguoi_kiem: string | null
          thiet_bi_id: string
          thoi_diem: string
          tinh_trang: string
          vi_tri_gps: string | null
        }
        SetofOptions: {
          from: "*"
          to: "kiem_ke"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      global_search: {
        Args: { _limit?: number; _q: string }
        Returns: {
          entity: string
          id: string
          score: number
          subtitle: string
          title: string
        }[]
      }
      gop_loai_thiet_bi: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: Json
      }
      gop_model: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: Json
      }
      gop_nha_cung_cap: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: Json
      }
      gop_nha_san_xuat: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: Json
      }
      gop_vi_tri: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hoan_thanh_cong_viec_bao_tri:
        | { Args: { _bao_tri_id?: string; _id: string }; Returns: undefined }
        | {
            Args: {
              _bao_tri_id?: string
              _form_submission_id?: string
              _id: string
            }
            Returns: undefined
          }
      hoan_thanh_hong_hoc: { Args: { _id: string }; Returns: string }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      is_conv_participant: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      khai_them_thanh_phan_he_thong: {
        Args: {
          p_bat_buoc?: boolean
          p_he_thong_id: string
          p_loai_thiet_bi_yeu_cau?: string
          p_ma_thanh_phan: string
          p_mo_ta?: string
          p_ten: string
          p_thanh_phan_cha?: string
          p_thu_tu?: number
        }
        Returns: {
          id: string
        }[]
      }
      kho_chuyen: {
        Args: {
          _cho_phep_am?: boolean
          _ghi_chu?: string
          _kho_dich_id: string
          _kho_nguon_id: string
          _so_luong: number
          _vat_tu_id: string
        }
        Returns: string
      }
      kho_kiem_ke: {
        Args: {
          _ghi_chu?: string
          _kho_id: string
          _so_luong_thuc_te: number
          _vat_tu_id: string
        }
        Returns: string
      }
      kho_nhap: {
        Args: {
          _cong_viec_id?: string
          _don_gia?: number
          _ghi_chu?: string
          _hong_hoc_id?: string
          _kho_id: string
          _so_luong: number
          _su_co_id?: string
          _vat_tu_id: string
        }
        Returns: string
      }
      kho_ton_hien_tai: {
        Args: { _kho_id: string; _vat_tu_id: string }
        Returns: number
      }
      kho_xuat: {
        Args: {
          _cho_phep_am?: boolean
          _cong_viec_id?: string
          _don_gia?: number
          _ghi_chu?: string
          _hong_hoc_id?: string
          _kho_id: string
          _so_luong: number
          _su_co_id?: string
          _vat_tu_id: string
        }
        Returns: string
      }
      khoi_phuc_thanh_phan: { Args: { v_id: string }; Returns: Json }
      lap_linh_kien: {
        Args: { p_ghi_chu?: string; p_khe_id: string; p_linh_kien_id: string }
        Returns: string
      }
      lap_tai_san_vao_thanh_phan: {
        Args: {
          p_ghi_chu?: string
          p_ly_do?: string
          p_thanh_phan_id: string
          p_thiet_bi_id: string
        }
        Returns: string
      }
      lap_thiet_bi: {
        Args: {
          p_ghi_chu?: string
          p_thanh_phan_id: string
          p_thiet_bi_id: string
        }
        Returns: string
      }
      log_app_event: {
        Args: {
          _action: string
          _detail: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
      log_auth_event: {
        Args: { _detail: Json; _event: string; _target: string }
        Returns: undefined
      }
      log_feature_usage: {
        Args: {
          _duration_ms: number
          _feature: string
          _params: Json
          _path: string
        }
        Returns: undefined
      }
      merge_danh_muc: {
        Args: {
          p_drop_id: string
          p_entity: string
          p_keep_id: string
          p_ly_do?: string
        }
        Returns: Json
      }
      ngung_khai_thac_thiet_bi: {
        Args: { _ly_do?: string; _mas: string[]; _thanh_ly?: boolean }
        Returns: Json
      }
      parse_vn_date: { Args: { t: string }; Returns: string }
      phan_quyen_thong_ke: { Args: never; Returns: Json }
      phan_tich_tac_dong: {
        Args: { p_he_thong_id: string }
        Returns: {
          do_sau: number
          duong_dan: string[]
          he_thong_id: string
          ma: string
          ten: string
        }[]
      }
      phe_duyet_cong_viec: {
        Args: { p_approve: boolean; p_ghi_chu?: string; p_id: string }
        Returns: undefined
      }
      phuc_hoi_thiet_bi: {
        Args: { _ly_do?: string; _mas: string[] }
        Returns: Json
      }
      pm_bo_qua_cong_viec: {
        Args: { _ly_do: string; _task_id: string }
        Returns: Json
      }
      pm_hoan_thanh_cong_viec: {
        Args: {
          _ghi_chu?: string
          _ket_qua: string
          _nguoi_thuc_hien_id: string
          _task_id: string
          _thuc_hien_at: string
          _van_de?: string
        }
        Returns: Json
      }
      pm_next_due_date: {
        Args: { _last_done?: string; _policy_id: string }
        Returns: string
      }
      pm_sinh_cong_viec: { Args: { _as_of?: string }; Returns: Json }
      preview_rollback_import_batch: {
        Args: { _batch_id: string }
        Returns: Json
      }
      promote_ticket_to_su_co: {
        Args: { p_ticket_id: string }
        Returns: string
      }
      purge_thiet_bi: { Args: { _mas: string[] }; Returns: Json }
      rebuild_search_index: { Args: never; Returns: number }
      record_user_recent: {
        Args: { _label: string; _path: string }
        Returns: undefined
      }
      refresh_mv_asset_anomaly: { Args: never; Returns: undefined }
      reject_change_request: {
        Args: { p_id: string; p_ly_do: string }
        Returns: undefined
      }
      reliability_by_scope: {
        Args: {
          p_from?: string
          p_scope: string
          p_scope_ids: string[]
          p_to?: string
        }
        Returns: {
          availability: number
          downtime_s: number
          failures: number
          failures_closed: number
          mtbf_h: number
          mttr_h: number
          operational_s: number
          scope_id: string
        }[]
      }
      reliability_top_worst: {
        Args: {
          p_don_vi_ids?: string[]
          p_from?: string
          p_limit?: number
          p_to?: string
        }
        Returns: {
          availability: number
          downtime_s: number
          failures: number
          ma_thiet_bi: string
          mttr_h: number
          ten_thiet_bi: string
          thiet_bi_id: string
        }[]
      }
      reset_user_layout_prefs: { Args: never; Returns: undefined }
      resolve_he_thong_ten: { Args: { _he_thong_id: string }; Returns: string }
      rollback_import_batch: { Args: { _batch_id: string }; Returns: Json }
      rpc_count_thiet_bi_by_trang_thai: { Args: never; Returns: Json }
      rpc_daily_brief: { Args: { p_user_id?: string }; Returns: Json }
      rpc_dashboard_overview: { Args: never; Returns: Json }
      rpc_incident_by_severity: {
        Args: { _from?: string; _to?: string }
        Returns: {
          muc_do: string
          so_dong: number
          so_su_co: number
        }[]
      }
      rpc_incident_heatmap: {
        Args: { _from?: string; _to?: string }
        Returns: {
          dow: number
          hour: number
          so_su_co: number
        }[]
      }
      rpc_reliability_by_system: {
        Args: { _from?: string; _to?: string }
        Returns: {
          he_thong_id: string
          ma: string
          mtbf_gio: number
          mttr_phut: number
          so_dong: number
          so_su_co: number
          ten: string
        }[]
      }
      rpc_reliability_trend: {
        Args: { _bucket?: string; _from?: string; _to?: string }
        Returns: {
          bucket_start: string
          mttr_phut: number
          so_dong: number
          so_su_co: number
        }[]
      }
      rpc_tai_san_toan_cuc: { Args: never; Returns: Json }
      rpc_thanh_phan_toan_cuc: { Args: never; Returns: Json }
      run_audit_daily_digest: { Args: never; Returns: number }
      run_audit_retention: { Args: never; Returns: number }
      sinh_canh_bao_het_han: { Args: never; Returns: Json }
      su_co_check_transition: {
        Args: { _den: string; _tu: string }
        Returns: boolean
      }
      su_co_downtime_minutes: {
        Args: { p_ngay_phat_hien: string; p_thoi_diem_khac_phuc: string }
        Returns: number
      }
      su_co_transition: {
        Args: {
          _bang: string
          _den: string
          _ghi_chu?: string
          _id: string
          _meta?: Json
        }
        Returns: {
          at: string
          buoc: number
          den_trang_thai: string
          doi_tuong_bang: string
          doi_tuong_id: string
          ghi_chu: string | null
          id: string
          meta: Json
          nguoi: string | null
          tu_trang_thai: string | null
        }
        SetofOptions: {
          from: "*"
          to: "su_co_lich_su"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sua_ngay_lap: {
        Args: { p_gan_id: string; p_ghi_chu?: string; p_tu_ngay: string }
        Returns: undefined
      }
      sync_thiet_bi_he_thong_cache: {
        Args: { p_thiet_bi_id: string }
        Returns: undefined
      }
      tao_cong_viec_bao_tri_dinh_ky: {
        Args: never
        Returns: {
          so_phieu_tao: number
        }[]
      }
      thao_linh_kien: {
        Args: { p_ghi_chu?: string; p_khe_id: string; p_ly_do?: string }
        Returns: undefined
      }
      thao_tai_san_khoi_thanh_phan: {
        Args: {
          p_gan_id: string
          p_ghi_chu?: string
          p_ly_do?: string
          p_new_vi_tri_id: string
        }
        Returns: undefined
      }
      thao_thiet_bi: {
        Args: { p_ghi_chu?: string; p_ly_do?: string; p_thanh_phan_id: string }
        Returns: undefined
      }
      thay_the_linh_kien: {
        Args: {
          p_ghi_chu?: string
          p_hong_hoc_id?: string
          p_khe_id: string
          p_linh_kien_moi_id: string
        }
        Returns: string
      }
      thay_the_thiet_bi: {
        Args: {
          p_ghi_chu?: string
          p_hong_hoc_id?: string
          p_thanh_phan_id: string
          p_thiet_bi_moi_id: string
          p_vi_tri_tai_san_cu_id?: string
        }
        Returns: string
      }
      thoi_gian_may_chu: { Args: never; Returns: string }
      tim_kiem_toan_cuc: {
        Args: { _gioi_han?: number; _loai?: string; _q: string }
        Returns: {
          hang: number
          id: string
          loai: string
          mota_ngan: string
          route: string
          tieu_de: string
        }[]
      }
      topology_import_tu_so_do: { Args: { p_so_do_id: string }; Returns: Json }
      undo_merge_danh_muc: {
        Args: { p_drop_id: string; p_entity: string }
        Returns: Json
      }
      user_can: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      user_can_see_he_thong: {
        Args: { _he_thong_id: string; _user_id: string }
        Returns: boolean
      }
      user_scope_don_vi: { Args: { _user_id: string }; Returns: string[] }
      user_scope_to_chuc: { Args: { _user_id: string }; Returns: string[] }
      v_lien_ket_hieu_luc: {
        Args: { tai_thoi_diem?: string }
        Returns: {
          created_at: string
          created_by: string | null
          don_vi_id_snapshot: string | null
          ghi_chu: string | null
          giao_dien_dich: string | null
          giao_dien_nguon: string | null
          giao_thuc: string | null
          hieu_luc_den: string | null
          hieu_luc_tu: string
          id: string
          khe_dich_id: string
          khe_nguon_id: string
          loai_lien_ket_id: string
          mo_ta: string | null
          trang_thai: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "lien_ket_khe"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      xem_truoc_xoa_thanh_phan: { Args: { v_id: string }; Returns: Json }
      xoa_thanh_phan_cuong_buc: {
        Args: { v_id: string; v_reason?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "phong_kt"
        | "phu_trach_dv"
        | "ktv"
        | "readonly"
        | "quan_ly_du_an"
        | "to_truong"
      bao_cao_annotation_loai: "bao_tri" | "su_co" | "thay_doi" | "ghi_chu"
      change_request_loai:
        | "cay.delete_node"
        | "cay.restore_node"
        | "cay.hard_delete_node"
        | "cay.reorg"
        | "thiet_bi.change_model"
        | "thiet_bi.change_don_vi"
        | "he_thong.change_nhom"
        | "he_thong.change_don_vi"
        | "danh_muc.merge"
        | "danh_muc.deactivate"
        | "role.grant"
        | "role.revoke"
      change_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "applied_failed"
      cong_viec_trang_thai:
        | "chua_bat_dau"
        | "dang_lam"
        | "cho_duyet"
        | "hoan_thanh"
        | "qua_han"
      don_vi_code: "CRA" | "CLA" | "THO" | "PCA" | "PBA" | "PLK"
      dot_bao_duong_hm_ket_qua: "dat" | "khong_dat" | "khac"
      dot_bao_duong_hm_nguon: "kt_khoi_tao" | "don_vi_bo_sung"
      dot_bao_duong_hm_trang_thai:
        | "chua_bat_dau"
        | "dang_lam"
        | "hoan_thanh"
        | "khong_thuc_hien"
      dot_bao_duong_trang_thai:
        | "nhap"
        | "mo"
        | "dang_thuc_hien"
        | "dong"
        | "huy"
      du_an_trang_thai:
        | "moi"
        | "dang_thuc_hien"
        | "tam_dung"
        | "hoan_thanh"
        | "huy"
      form_field_kind:
        | "text"
        | "textarea"
        | "number"
        | "date"
        | "datetime"
        | "select"
        | "multiselect"
        | "checkbox"
        | "file"
        | "user_ref"
        | "don_vi_ref"
        | "thiet_bi_ref"
        | "measure"
        | "before_after"
        | "rating"
        | "radio"
        | "photo"
        | "signature"
        | "geo"
        | "duration"
        | "table"
        | "linh_kien_ref"
        | "vat_tu_ref"
        | "he_thong_thanh_phan_ref"
        | "computed"
        | "heading"
        | "note"
        | "divider"
        | "section_repeat"
      form_ket_qua: "dat" | "khong_dat" | "khong_ap_dung"
      form_result_kind: "so" | "dat_khong_dat" | "chon" | "text"
      form_submission_status: "draft" | "submitted" | "approved" | "returned"
      form_template_version_status: "draft" | "published" | "retired"
      form_thiet_bi_mode: "none" | "single" | "multi"
      node_note_type: "he_thong" | "thanh_phan"
      notification_loai:
        | "ticket_moi"
        | "ticket_cap_nhat"
        | "ticket_binh_luan"
        | "tin_nhan_moi"
        | "he_thong"
      thiet_bi_tep_loai: "hinh_anh" | "tai_lieu"
      ticket_loai:
        | "cap_tai_khoan"
        | "doi_quyen"
        | "reset_mat_khau"
        | "bao_loi"
        | "khac"
      ticket_trang_thai:
        | "moi"
        | "dang_xu_ly"
        | "cho_phan_hoi"
        | "hoan_thanh"
        | "tu_choi"
        | "dong"
      ticket_uu_tien: "thap" | "trung_binh" | "cao" | "khan"
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
      app_role: [
        "admin",
        "phong_kt",
        "phu_trach_dv",
        "ktv",
        "readonly",
        "quan_ly_du_an",
        "to_truong",
      ],
      bao_cao_annotation_loai: ["bao_tri", "su_co", "thay_doi", "ghi_chu"],
      change_request_loai: [
        "cay.delete_node",
        "cay.restore_node",
        "cay.hard_delete_node",
        "cay.reorg",
        "thiet_bi.change_model",
        "thiet_bi.change_don_vi",
        "he_thong.change_nhom",
        "he_thong.change_don_vi",
        "danh_muc.merge",
        "danh_muc.deactivate",
        "role.grant",
        "role.revoke",
      ],
      change_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "applied_failed",
      ],
      cong_viec_trang_thai: [
        "chua_bat_dau",
        "dang_lam",
        "cho_duyet",
        "hoan_thanh",
        "qua_han",
      ],
      don_vi_code: ["CRA", "CLA", "THO", "PCA", "PBA", "PLK"],
      dot_bao_duong_hm_ket_qua: ["dat", "khong_dat", "khac"],
      dot_bao_duong_hm_nguon: ["kt_khoi_tao", "don_vi_bo_sung"],
      dot_bao_duong_hm_trang_thai: [
        "chua_bat_dau",
        "dang_lam",
        "hoan_thanh",
        "khong_thuc_hien",
      ],
      dot_bao_duong_trang_thai: ["nhap", "mo", "dang_thuc_hien", "dong", "huy"],
      du_an_trang_thai: [
        "moi",
        "dang_thuc_hien",
        "tam_dung",
        "hoan_thanh",
        "huy",
      ],
      form_field_kind: [
        "text",
        "textarea",
        "number",
        "date",
        "datetime",
        "select",
        "multiselect",
        "checkbox",
        "file",
        "user_ref",
        "don_vi_ref",
        "thiet_bi_ref",
        "measure",
        "before_after",
        "rating",
        "radio",
        "photo",
        "signature",
        "geo",
        "duration",
        "table",
        "linh_kien_ref",
        "vat_tu_ref",
        "he_thong_thanh_phan_ref",
        "computed",
        "heading",
        "note",
        "divider",
        "section_repeat",
      ],
      form_ket_qua: ["dat", "khong_dat", "khong_ap_dung"],
      form_result_kind: ["so", "dat_khong_dat", "chon", "text"],
      form_submission_status: ["draft", "submitted", "approved", "returned"],
      form_template_version_status: ["draft", "published", "retired"],
      form_thiet_bi_mode: ["none", "single", "multi"],
      node_note_type: ["he_thong", "thanh_phan"],
      notification_loai: [
        "ticket_moi",
        "ticket_cap_nhat",
        "ticket_binh_luan",
        "tin_nhan_moi",
        "he_thong",
      ],
      thiet_bi_tep_loai: ["hinh_anh", "tai_lieu"],
      ticket_loai: [
        "cap_tai_khoan",
        "doi_quyen",
        "reset_mat_khau",
        "bao_loi",
        "khac",
      ],
      ticket_trang_thai: [
        "moi",
        "dang_xu_ly",
        "cho_phan_hoi",
        "hoan_thanh",
        "tu_choi",
        "dong",
      ],
      ticket_uu_tien: ["thap", "trung_binh", "cao", "khan"],
    },
  },
} as const
