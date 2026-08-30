export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlayerRow = 'fernanda' | 'hector';
export type PunishmentRow = 'beso' | 'baile' | 'masaje' | 'secreto';
export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface Database {
  public: {
    Tables: {
      answers: {
        Row: {
          id: number;
          run_id: string;
          player: PlayerRow;
          group_id: string;
          question_id: string;
          selected_option: number | null;
          is_correct: boolean;
          punishment_assigned: PunishmentRow | null;
          answered_at: string;
        };
        Insert: {
          id?: never;
          run_id: string;
          player: PlayerRow;
          group_id: string;
          question_id: string;
          selected_option?: number | null;
          is_correct: boolean;
          punishment_assigned?: PunishmentRow | null;
          answered_at?: string;
        };
        Update: {
          run_id?: string;
          player?: PlayerRow;
          group_id?: string;
          question_id?: string;
          selected_option?: number | null;
          is_correct?: boolean;
          punishment_assigned?: PunishmentRow | null;
          answered_at?: string;
        };
        Relationships: [];
      };
      group_summaries: {
        Row: {
          id: number;
          run_id: string;
          player: PlayerRow;
          group_id: string;
          hearts_earned: number;
          punishments_by_type: Json;
          question_ids: Json;
          bonus_distance_meters: number | null;
          completed_at: string;
        };
        Insert: {
          id?: never;
          run_id: string;
          player: PlayerRow;
          group_id: string;
          hearts_earned?: number;
          punishments_by_type?: Json;
          question_ids?: Json;
          bonus_distance_meters?: number | null;
          completed_at?: string;
        };
        Update: {
          run_id?: string;
          player?: PlayerRow;
          group_id?: string;
          hearts_earned?: number;
          punishments_by_type?: Json;
          question_ids?: Json;
          bonus_distance_meters?: number | null;
          completed_at?: string;
        };
        Relationships: [];
      };
      reciprocal_quiz_questions: {
        Row: {
          id: number;
          question_text: string;
          options: Json;
          correct_option: OptionLetter;
          batch_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: never;
          question_text: string;
          options: Json;
          correct_option: OptionLetter;
          batch_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          question_text?: string;
          options?: Json;
          correct_option?: OptionLetter;
          batch_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: number;
          storage_path: string;
          caricature_storage_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          storage_path: string;
          caricature_storage_path?: string | null;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          caricature_storage_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bonus_gift_answers: {
        Row: {
          id: number;
          run_id: string;
          group_id: string;
          answer_text: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          run_id: string;
          group_id?: string;
          answer_text: string;
          created_at?: string;
        };
        Update: {
          run_id?: string;
          group_id?: string;
          answer_text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game_state: {
        Row: {
          key: string;
          value: boolean;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: boolean;
          updated_at?: string;
        };
        Update: {
          value?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
