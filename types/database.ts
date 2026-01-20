/**
 * Database schema types for Supabase
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          display_name: string | null;
          email: string | null;
          timezone: string;
          is_anonymous: boolean;
          password_changed_at: string | null;
          last_login: string | null;
          subscription_status: 'none' | 'active' | 'expired';
          subscription_expires_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          timezone?: string;
          is_anonymous?: boolean;
          password_changed_at?: string | null;
          last_login?: string | null;
          subscription_status?: 'none' | 'active' | 'expired';
          subscription_expires_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          timezone?: string;
          is_anonymous?: boolean;
          password_changed_at?: string | null;
          last_login?: string | null;
          subscription_status?: 'none' | 'active' | 'expired';
          subscription_expires_at?: string | null;
        };
      };
      puzzles: {
        Row: {
          id: string;
          date: string;
          target_phrase: string;
          facsimile_phrase: string;
          difficulty: number;
          bonus_question: any; // JSON
          created_at: string;
          created_by_ai: boolean;
          approved: boolean;
        };
        Insert: {
          id?: string;
          date: string;
          target_phrase: string;
          facsimile_phrase: string;
          difficulty?: number;
          bonus_question: any;
          created_at?: string;
          created_by_ai?: boolean;
          approved?: boolean;
        };
        Update: {
          id?: string;
          date?: string;
          target_phrase?: string;
          facsimile_phrase?: string;
          difficulty?: number;
          bonus_question?: any;
          created_at?: string;
          created_by_ai?: boolean;
          approved?: boolean;
        };
      };
      scores: {
        Row: {
          id: string;
          user_id: string;
          puzzle_id: string;
          score: number;
          bonus_correct: boolean;
          time_taken_seconds: number;
          speed: number;
          first_play_of_day: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          puzzle_id: string;
          score: number;
          bonus_correct?: boolean;
          time_taken_seconds: number;
          speed?: number;
          first_play_of_day?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          puzzle_id?: string;
          score?: number;
          bonus_correct?: boolean;
          time_taken_seconds?: number;
          speed?: number;
          first_play_of_day?: boolean;
          created_at?: string;
        };
      };
      stats: {
        Row: {
          user_id: string;
          total_games: number;
          average_score: number;
          current_streak: number;
          best_streak: number;
          last_played_date: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_games?: number;
          average_score?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_date?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_games?: number;
          average_score?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_date?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      leaderboards: {
        Row: {
          puzzle_id: string;
          user_id: string;
          display_name: string | null;
          score: number;
          bonus_correct: boolean;
          speed: number;
          first_play_of_day: boolean;
          rank: number;
          puzzle_date: string;
        };
      };
      leaderboards_pure: {
        Row: {
          puzzle_id: string;
          user_id: string;
          display_name: string | null;
          score: number;
          bonus_correct: boolean;
          rank: number;
          puzzle_date: string;
        };
      };
      leaderboards_boosted: {
        Row: {
          puzzle_id: string;
          user_id: string;
          display_name: string | null;
          score: number;
          bonus_correct: boolean;
          speed: number;
          rank: number;
          puzzle_date: string;
        };
      };
      global_leaderboards_pure: {
        Row: {
          user_id: string;
          display_name: string | null;
          average_score: number;
          total_games: number;
          rank: number;
        };
      };
      global_leaderboards_boosted: {
        Row: {
          user_id: string;
          display_name: string | null;
          average_score: number;
          total_games: number;
          rank: number;
        };
      };
    };
  };
}
