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
          username: string | null;
          email: string | null;
          timezone: string;
          is_anonymous: boolean;
          password_changed_at: string | null;
          last_login: string | null;
          last_active: string | null;
          subscription_status: 'none' | 'active' | 'expired';
          subscription_expires_at: string | null;
          is_admin: boolean;
          user_tier: 'free' | 'premium' | 'admin';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          display_name?: string | null;
          username?: string | null;
          email?: string | null;
          timezone?: string;
          is_anonymous?: boolean;
          password_changed_at?: string | null;
          last_login?: string | null;
          last_active?: string | null;
          subscription_status?: 'none' | 'active' | 'expired';
          subscription_expires_at?: string | null;
          is_admin?: boolean;
          user_tier?: 'free' | 'premium' | 'admin';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          display_name?: string | null;
          username?: string | null;
          email?: string | null;
          timezone?: string;
          is_anonymous?: boolean;
          password_changed_at?: string | null;
          last_login?: string | null;
          last_active?: string | null;
          subscription_status?: 'none' | 'active' | 'expired';
          subscription_expires_at?: string | null;
          is_admin?: boolean;
          user_tier?: 'free' | 'premium' | 'admin';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
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
          theme: string | null;
          metadata: any; // JSON
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
          theme?: string | null;
          metadata?: any;
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
          theme?: string | null;
          metadata?: any;
        };
      };
      scores: {
        Row: {
          id: string;
          user_id: string;
          puzzle_id: string;
          score: number;
          phase1_score: number | null;
          phase2_score: number | null;
          bonus_correct: boolean;
          time_taken_seconds: number;
          speed: number;
          min_speed: number;
          max_speed: number;
          first_play_of_day: boolean;
          stars: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          puzzle_id: string;
          score: number;
          phase1_score?: number | null;
          phase2_score?: number | null;
          bonus_correct?: boolean;
          time_taken_seconds: number;
          speed?: number;
          min_speed?: number;
          max_speed?: number;
          first_play_of_day?: boolean;
          stars?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          puzzle_id?: string;
          score?: number;
          phase1_score?: number | null;
          phase2_score?: number | null;
          bonus_correct?: boolean;
          time_taken_seconds?: number;
          speed?: number;
          min_speed?: number;
          max_speed?: number;
          first_play_of_day?: boolean;
          stars?: number | null;
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
          total_stars_pure: number;
          total_stars_boosted: number;
        };
        Insert: {
          user_id: string;
          total_games?: number;
          average_score?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_date?: string;
          updated_at?: string;
          total_stars_pure?: number;
          total_stars_boosted?: number;
        };
        Update: {
          user_id?: string;
          total_games?: number;
          average_score?: number;
          current_streak?: number;
          best_streak?: number;
          last_played_date?: string;
          total_stars_pure?: number;
          total_stars_boosted?: number;
          updated_at?: string;
        };
      };
      admin_activity_log: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_user_id: string | null;
          details: any; // JSON
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_user_id?: string | null;
          details?: any;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_user_id?: string | null;
          details?: any;
          ip_address?: string | null;
          created_at?: string;
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
          min_speed: number;
          max_speed: number;
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
          stars: number | null;
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
          min_speed: number;
          max_speed: number;
          stars: number | null;
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
          total_stars: number;
          rank: number;
        };
      };
      global_leaderboards_boosted: {
        Row: {
          user_id: string;
          display_name: string | null;
          average_score: number;
          total_games: number;
          total_stars: number;
          rank: number;
        };
      };
    };
  };
}
