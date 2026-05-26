export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          avatar_glb_url: string | null;
          gender: string | null;
          date_of_birth: string | null;
          location_city: string | null;
          location_country: string | null;
          occupation: string | null;
          personality_type: string | null;
          village_score: number;
          force_rate: number;
          success_ratio: number;
          data_consent: string;
          vlg_balance: number;
          nebu_balance: number;
          tribe_balance: number;
          wallet_address: string | null;
          stripe_customer_id: string | null;
          is_verified: boolean;
          is_creator: boolean;
          onboarding_complete: boolean;
          onboarding_step: number;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; username: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          goal_type: 'short_term' | 'long_term' | null;
          status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
          category: string | null;
          is_public: boolean;
          start_date: string | null;
          target_date: string | null;
          estimated_weeks: number | null;
          weekly_hours: number;
          probability_score: number;
          progress_percentage: number;
          current_step_index: number;
          total_steps: number;
          medal: string | null;
          ai_analysis: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['goals']['Row']> & { user_id: string; title: string };
        Update: Partial<Database['public']['Tables']['goals']['Row']>;
      };
      dream_line_posts: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          step_id: string | null;
          content: string;
          visibility: 'public' | 'tribe' | 'anonymous' | 'private';
          media_urls: string[];
          oowop_count: number;
          comment_count: number;
          is_milestone: boolean;
          is_validated: boolean;
          medal_at_post: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['dream_line_posts']['Row']> & { user_id: string; content: string };
        Update: Partial<Database['public']['Tables']['dream_line_posts']['Row']>;
      };
      oowops: {
        Row: {
          id: string;
          post_id: string;
          giver_id: string;
          receiver_id: string;
          goal_id: string | null;
          step_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['oowops']['Row']> & { post_id: string; giver_id: string; receiver_id: string };
        Update: never;
      };
      spirit_configs: {
        Row: {
          id: string;
          user_id: string;
          spiritual_system: string;
          topics: string[];
          coaching_tone: string;
          do_not_disturb: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['spirit_configs']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['spirit_configs']['Row']>;
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_name: string;
          rating: number;
          rating_category: 'pain_point' | 'neutral' | 'skillset';
          years_experience: number;
          is_monetizable: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_skills']['Row']> & { user_id: string; skill_name: string; rating: number };
        Update: Partial<Database['public']['Tables']['user_skills']['Row']>;
      };
      dreamline_config: {
        Row: { id: number; algorithm: string; mission_score_minimum: number; boost_keywords: string[]; suppress_keywords: string[]; auto_hide_below: number; require_video_check: boolean; oowop_weight: number; recency_weight: number; mission_weight: number; updated_at: string; updated_by: string | null };
        Insert: { id?: number; algorithm?: string; mission_score_minimum?: number; boost_keywords?: string[]; suppress_keywords?: string[]; auto_hide_below?: number; require_video_check?: boolean; oowop_weight?: number; recency_weight?: number; mission_weight?: number };
        Update: { algorithm?: string; mission_score_minimum?: number; boost_keywords?: string[]; suppress_keywords?: string[]; auto_hide_below?: number; require_video_check?: boolean; oowop_weight?: number; recency_weight?: number; mission_weight?: number; updated_at?: string; updated_by?: string | null };
      };
      content_review_queue: {
        Row: { id: string; post_id: string; mission_score: number; reason: string | null; status: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string };
        Insert: { post_id: string; mission_score: number; reason?: string | null; status?: string };
        Update: { status?: string; reviewed_by?: string | null; reviewed_at?: string | null; reason?: string | null };
      };
      tribe_messages: {
        Row: { id: string; tribe_id: string; user_id: string; content: string; created_at: string };
        Insert: { tribe_id: string; user_id: string; content: string };
        Update: { content?: string };
      };
      referrals: {
        Row: { id: string; referrer_id: string; referred_id: string; vlg_awarded: boolean; created_at: string };
        Insert: { referrer_id: string; referred_id: string; vlg_awarded?: boolean };
        Update: { vlg_awarded?: boolean };
      };
      crowdfunding_contributions: {
        Row: { id: string; campaign_id: string; backer_id: string; amount: number; currency: string; perk_tier: string | null; stripe_charge_id: string | null; created_at: string };
        Insert: { campaign_id: string; backer_id: string; amount: number; currency?: string; perk_tier?: string | null; stripe_charge_id?: string | null };
        Update: { stripe_charge_id?: string | null };
      };
      ad_placements: {
        Row: { id: string; advertiser_id: string | null; title: string; body: string; cta: string; url: string; icon: string; target_categories: string[]; bid_amount: number; budget: number | null; spent: number; is_active: boolean; starts_at: string | null; ends_at: string | null; created_at: string };
        Insert: { title: string; body: string; cta: string; url: string; target_categories?: string[]; bid_amount?: number; is_active?: boolean; icon?: string };
        Update: { is_active?: boolean; spent?: number; ends_at?: string | null };
      };
      event_rsvps: {
        Row: { id: string; event_id: string; user_id: string; status: string; created_at: string };
        Insert: { event_id: string; user_id: string; status?: string };
        Update: { status?: string };
      };
      ad_impressions: {
        Row: { id: string; ad_id: string; user_id: string; goal_category: string | null; step_title: string | null; step_index: number | null; clicked: boolean; clicked_at: string | null; shown_at: string };
        Insert: { ad_id: string; user_id: string; goal_category?: string | null; step_title?: string | null; step_index?: number | null };
        Update: { clicked?: boolean; clicked_at?: string | null };
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_village_score: {
        Args: { p_user_id: string; p_points: number; p_vlg?: number; p_reason: string; p_reference_id?: string | null };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
