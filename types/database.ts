// ============================================================
// VILLA9E — COMPLETE DATABASE TYPES
// Auto-generated from supabase/schema.sql + migrations 002-004
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      // ── Core User Data ──────────────────────────────────────
      profiles: {
        Row: {
          id: string; username: string; display_name: string | null; bio: string | null;
          avatar_url: string | null; avatar_glb_url: string | null; gender: string | null;
          date_of_birth: string | null; location_city: string | null; location_country: string | null;
          location_lat: number | null; location_lng: number | null; language: string;
          occupation: string | null; education_level: string | null; communication_style: string | null;
          phone_number: string | null; phone_verified: boolean; email_verified: boolean;
          onboarding_complete: boolean; onboarding_step: number; personality_type: string | null;
          village_score: number; force_rate: number; success_ratio: number;
          score_tier: string; data_consent: string; data_earnings_total: number;
          vlg_balance: number; nebu_balance: number; tribe_balance: number;
          wallet_address: string | null; stripe_customer_id: string | null;
          is_verified: boolean; is_creator: boolean; is_minor: boolean;
          is_founding_villager: boolean; founding_villager_number: number | null;
          mindful_moment_done: boolean; last_mindful_date: string | null;
          last_active_at: string; created_at: string; updated_at: string;
        };
        Insert: {
          id: string; username: string; display_name?: string | null; bio?: string | null;
          avatar_url?: string | null; village_score?: number; onboarding_complete?: boolean;
          onboarding_step?: number; personality_type?: string | null; language?: string;
          occupation?: string | null; education_level?: string | null; communication_style?: string | null;
          date_of_birth?: string | null; location_city?: string | null; location_country?: string | null;
          is_founding_villager?: boolean; founding_villager_number?: number | null;
        };
        Update: {
          username?: string; display_name?: string | null; bio?: string | null;
          avatar_url?: string | null; village_score?: number; score_tier?: string;
          is_founding_villager?: boolean; founding_villager_number?: number | null;
          onboarding_complete?: boolean; onboarding_step?: number; personality_type?: string | null;
          language?: string | null; last_active_at?: string; is_minor?: boolean;
          occupation?: string | null; education_level?: string | null;
          communication_style?: string | null; date_of_birth?: string | null;
          location_city?: string | null; location_country?: string | null;
          mindful_moment_done?: boolean; last_mindful_date?: string | null;
        };
      };
      spirit_configs: {
        Row: {
          id: string; user_id: string; spiritual_system: string; topics: string[];
          coaching_tone: string; do_not_disturb: boolean;
          morning_check_in_time: string | null; evening_check_in_time: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { user_id: string; spiritual_system?: string; topics?: string[]; coaching_tone?: string; do_not_disturb?: boolean; morning_check_in_time?: string | null; evening_check_in_time?: string | null };
        Update: { spiritual_system?: string; topics?: string[]; coaching_tone?: string; do_not_disturb?: boolean; morning_check_in_time?: string | null; evening_check_in_time?: string | null };
      };
      hut_configs: {
        Row: { id: string; user_id: string; theme: string; accent_color: string; show_score: boolean; show_wallet: boolean; created_at: string };
        Insert: { user_id: string; theme?: string; accent_color?: string };
        Update: { theme?: string; accent_color?: string; show_score?: boolean; show_wallet?: boolean };
      };
      user_skills: {
        Row: { id: string; user_id: string; skill_name: string; rating: number; rating_category: string; years_experience: number; is_monetizable: boolean; created_at: string };
        Insert: { user_id: string; skill_name: string; rating: number; rating_category?: string; years_experience?: number; is_monetizable?: boolean };
        Update: { rating?: number; rating_category?: string; years_experience?: number; is_monetizable?: boolean };
      };
      skills: {
        Row: { id: string; name: string; category: string; subcategory: string | null; created_at: string };
        Insert: { name: string; category: string; subcategory?: string | null };
        Update: { name?: string; category?: string; subcategory?: string | null };
      };
      user_interests: {
        Row: { id: string; user_id: string; interest: string; created_at: string };
        Insert: { user_id: string; interest: string };
        Update: { interest?: string };
      };
      user_restrictions: {
        Row: { id: string; user_id: string; restriction: string; created_at: string };
        Insert: { user_id: string; restriction: string };
        Update: Record<string, never>;
      };
      user_intentions: {
        Row: { id: string; user_id: string; intention: string; created_at: string };
        Insert: { user_id: string; intention: string };
        Update: Record<string, never>;
      };

      // ── Goals ───────────────────────────────────────────────
      goals: {
        Row: {
          id: string; user_id: string; title: string; description: string | null;
          goal_type: string | null; status: string; category: string | null;
          is_public: boolean; start_date: string | null; target_date: string | null;
          estimated_weeks: number | null; weekly_hours: number;
          probability_score: number; progress_percentage: number;
          current_step_index: number; total_steps: number; medal: string | null;
          medal_type: string | null; completed_at: string | null;
          ai_analysis: Json; source_template_id: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { user_id: string; title: string; description?: string | null; goal_type?: string | null; status?: string; category?: string | null; is_public?: boolean; target_date?: string | null; estimated_weeks?: number | null; weekly_hours?: number; probability_score?: number; ai_analysis?: Json; source_template_id?: string | null };
        Update: { status?: string; probability_score?: number; progress_percentage?: number; current_step_index?: number; completed_at?: string | null; medal_type?: string | null; ai_analysis?: Json; is_public?: boolean; target_date?: string | null; total_steps?: number };
      };
      goal_steps: {
        Row: { id: string; goal_id: string; user_id: string; title: string; description: string | null; step_number: number; status: string; estimated_hours: number | null; completed_date: string | null; oowops_received: number; oowops_needed: number; is_validated: boolean; resource_category: string | null; created_at: string };
        Insert: { goal_id: string; user_id: string; title: string; description?: string | null; step_number?: number; status?: string; estimated_hours?: number | null; order_index?: number };
        Update: { status?: string; completed_date?: string | null; oowops_received?: number; is_validated?: boolean; title?: string };
      };
      goal_resources: {
        Row: { id: string; goal_id: string; name: string; category: string | null; estimated_cost: number | null; url: string | null; is_acquired: boolean; created_at: string };
        Insert: { goal_id: string; name: string; category?: string | null; estimated_cost?: number | null; url?: string | null };
        Update: { is_acquired?: boolean; url?: string | null };
      };
      goal_team_members: {
        Row: { id: string; goal_id: string; user_id: string; role: string; status: string; joined_at: string };
        Insert: { goal_id: string; user_id: string; role?: string; status?: string };
        Update: { role?: string; status?: string };
      };
      goal_probability_log: {
        Row: { id: string; goal_id: string; score: number; factors: Json | null; created_at: string };
        Insert: { goal_id: string; score: number; factors?: Json | null };
        Update: Record<string, never>;
      };
      goal_templates: {
        Row: { id: string; creator_id: string | null; title: string; description: string | null; category: string; steps: Json | null; steps_preview: Json; estimated_weeks: number | null; steps_count: number | null; probability_score: number; is_public: boolean; use_count: number; rating: number; created_at: string };
        Insert: { creator_id?: string | null; title: string; description?: string | null; category: string; steps?: Json | null; steps_preview?: Json; is_public?: boolean };
        Update: { use_count?: number; rating?: number; is_public?: boolean };
      };

      // ── Social Feed ─────────────────────────────────────────
      dream_line_posts: {
        Row: {
          id: string; user_id: string; goal_id: string | null; step_id: string | null;
          content: string; visibility: string; media_urls: string[];
          oowop_count: number; comment_count: number; is_milestone: boolean;
          milestone_type: string | null; is_validated: boolean; medal_at_post: string | null;
          mission_score: number | null; mission_labels: string[] | null;
          is_hidden: boolean; hidden_reason: string | null;
          video_url: string | null; video_analyzed: boolean;
          created_at: string; updated_at: string;
        };
        Insert: { user_id: string; content: string; goal_id?: string | null; step_id?: string | null; visibility?: string; is_milestone?: boolean; milestone_type?: string | null; mission_score?: number | null };
        Update: { content?: string; oowop_count?: number; is_validated?: boolean; mission_score?: number | null; mission_labels?: string[] | null; is_hidden?: boolean; hidden_reason?: string | null; video_url?: string | null; video_analyzed?: boolean };
      };
      oowops: {
        Row: { id: string; post_id: string; giver_id: string; receiver_id: string; goal_id: string | null; step_id: string | null; created_at: string };
        Insert: { post_id: string; giver_id: string; receiver_id: string; goal_id?: string | null; step_id?: string | null };
        Update: Record<string, never>;
      };
      post_comments: {
        Row: { id: string; post_id: string; user_id: string; content: string; created_at: string };
        Insert: { post_id: string; user_id: string; content: string };
        Update: { content?: string };
      };

      // ── Discovery & Connections ──────────────────────────────
      villager_matches: {
        Row: { id: string; user_id: string; matched_user_id: string; match_score: number; match_reason: string | null; is_dismissed: boolean; created_at: string };
        Insert: { user_id: string; matched_user_id: string; match_score: number; match_reason?: string | null };
        Update: { is_dismissed?: boolean };
      };
      connections: {
        Row: { id: string; requester_id: string; addressee_id: string; status: string; created_at: string };
        Insert: { requester_id: string; addressee_id: string; status?: string };
        Update: { status?: string };
      };

      // ── Trading Post ─────────────────────────────────────────
      trading_post_listings: {
        Row: { id: string; user_id: string; title: string; description: string | null; skill_offered: string; skill_wanted: string | null; category: string; hourly_rate: number | null; project_rate: number | null; currency: string; deal_types: string[]; availability: string | null; is_active: boolean; average_rating: number; listing_id: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; title: string; skill_offered: string; category: string; description?: string | null; hourly_rate?: number | null; project_rate?: number | null; deal_types?: string[]; is_active?: boolean; availability?: string | null };
        Update: { is_active?: boolean; hourly_rate?: number | null; description?: string | null; average_rating?: number };
      };
      deals: {
        Row: { id: string; listing_id: string; buyer_id: string; seller_id: string; status: string; deal_type: string; amount: number | null; currency: string; created_at: string };
        Insert: { listing_id: string; buyer_id: string; seller_id: string; deal_type: string; amount?: number | null };
        Update: { status?: string };
      };
      trading_reviews: {
        Row: { id: string; deal_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment: string | null; created_at: string };
        Insert: { deal_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment?: string | null };
        Update: Record<string, never>;
      };

      // ── Tribes ──────────────────────────────────────────────
      tribes: {
        Row: { id: string; creator_id: string; name: string; description: string | null; project_status: string; is_public: boolean; created_at: string };
        Insert: { creator_id: string; name: string; description?: string | null; is_public?: boolean };
        Update: { name?: string; description?: string | null; project_status?: string };
      };
      tribe_members: {
        Row: { id: string; tribe_id: string; user_id: string; role: string; joined_at: string };
        Insert: { tribe_id: string; user_id: string; role?: string };
        Update: { role?: string };
      };
      tribe_tasks: {
        Row: { id: string; tribe_id: string; created_by: string; title: string; status: string; assigned_to: string | null; due_date: string | null; created_at: string };
        Insert: { tribe_id: string; created_by: string; title: string; status?: string; assigned_to?: string | null; due_date?: string | null };
        Update: { status?: string; assigned_to?: string | null; title?: string };
      };
      tribe_messages: {
        Row: { id: string; tribe_id: string; user_id: string; content: string; created_at: string };
        Insert: { tribe_id: string; user_id: string; content: string };
        Update: { content?: string };
      };

      // ── Wellness / Zen ───────────────────────────────────────
      mindful_moments: {
        Row: { id: string; user_id: string; type: string; session_type: string; mood: string | null; mood_score: number | null; notes: string | null; duration_minutes: number | null; created_at: string };
        Insert: { user_id: string; type: string; session_type: string; mood?: string | null; mood_score?: number | null; notes?: string | null; duration_minutes?: number | null };
        Update: Record<string, never>;
      };
      zen_sessions: {
        Row: { id: string; user_id: string; session_type: string; duration_minutes: number; mood_before: string | null; mood_after: string | null; created_at: string };
        Insert: { user_id: string; session_type: string; duration_minutes?: number; mood_before?: string | null; mood_after?: string | null };
        Update: Record<string, never>;
      };
      journal_entries: {
        Row: { id: string; user_id: string; prompt: string | null; content: string; mood: string | null; is_private: boolean; created_at: string };
        Insert: { user_id: string; content: string; prompt?: string | null; mood?: string | null; is_private?: boolean };
        Update: { content?: string; is_private?: boolean };
      };

      // ── Spaces / Calendar ────────────────────────────────────
      calendar_events: {
        Row: { id: string; creator_id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string | null; event_type: string; is_public: boolean; created_at: string };
        Insert: { creator_id: string; title: string; start_time: string; end_time?: string | null; description?: string | null; location?: string | null; event_type?: string; is_public?: boolean };
        Update: { title?: string; description?: string | null; location?: string | null; start_time?: string; end_time?: string | null; event_type?: string };
      };
      event_attendees: {
        Row: { id: string; event_id: string; user_id: string; status: string; created_at: string };
        Insert: { event_id: string; user_id: string; status?: string };
        Update: { status?: string };
      };
      event_rsvps: {
        Row: { id: string; event_id: string; user_id: string; status: string; created_at: string };
        Insert: { event_id: string; user_id: string; status?: string };
        Update: { status?: string };
      };

      // ── Finance / Wallet ─────────────────────────────────────
      village_wallets: {
        Row: { id: string; user_id: string; vlg_balance: number; nebu_balance: number; tribe_balance: number; total_earned_vlg: number; total_data_earnings: number; created_at: string; updated_at: string };
        Insert: { user_id: string; vlg_balance?: number; total_earned_vlg?: number };
        Update: { vlg_balance?: number; total_earned_vlg?: number; total_data_earnings?: number };
      };
      wallet_transactions: {
        Row: { id: string; user_id: string; amount: number; token_type: string; direction: string; reason: string | null; transaction_type: string | null; description: string | null; reference_id: string | null; created_at: string };
        Insert: { user_id: string; amount: number; token_type?: string; direction: string; reason?: string | null; transaction_type?: string | null; description?: string | null; reference_id?: string | null };
        Update: Record<string, never>;
      };
      crowdfunding_campaigns: {
        Row: { id: string; user_id: string; goal_id: string | null; title: string; description: string | null; goal_amount: number; raised_amount: number; backer_count: number; status: string; currency: string; deadline: string | null; created_at: string };
        Insert: { user_id: string; title: string; description?: string | null; goal_amount: number; raised_amount?: number; backer_count?: number; status?: string; currency?: string; deadline?: string | null; goal_id?: string | null };
        Update: { raised_amount?: number; backer_count?: number; status?: string };
      };
      crowdfunding_contributions: {
        Row: { id: string; campaign_id: string; backer_id: string; amount: number; currency: string; perk_tier: string | null; stripe_charge_id: string | null; created_at: string };
        Insert: { campaign_id: string; backer_id: string; amount: number; currency?: string; perk_tier?: string | null; stripe_charge_id?: string | null };
        Update: { stripe_charge_id?: string | null };
      };

      // ── Messaging ────────────────────────────────────────────
      conversations: {
        Row: { id: string; participant_ids: string[]; listing_id: string | null; last_message_at: string | null; last_message_preview: string | null; created_at: string };
        Insert: { participant_ids: string[]; listing_id?: string | null };
        Update: { last_message_at?: string | null; last_message_preview?: string | null };
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; status: string; created_at: string };
        Insert: { conversation_id: string; sender_id: string; content: string; status?: string };
        Update: { status?: string };
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; title: string; body: string | null; is_read: boolean; reference_id: string | null; reference_type: string | null; created_at: string };
        Insert: { user_id: string; type: string; title: string; body?: string | null; reference_id?: string | null; reference_type?: string | null };
        Update: { is_read?: boolean };
      };

      // ── Scoring / XP ─────────────────────────────────────────
      village_score_log: {
        Row: { id: string; user_id: string; points: number; reason: string; reference_id: string | null; created_at: string };
        Insert: { user_id: string; points: number; reason: string; reference_id?: string | null };
        Update: Record<string, never>;
      };
      user_xp: {
        Row: { id: string; user_id: string; xp_points: number; level: number; updated_at: string };
        Insert: { user_id: string; xp_points?: number; level?: number };
        Update: { xp_points?: number; level?: number };
      };
      user_medals: {
        Row: { id: string; user_id: string; medal_type: string; goal_id: string | null; awarded_at: string };
        Insert: { user_id: string; medal_type: string; goal_id?: string | null };
        Update: Record<string, never>;
      };
      founding_villager_counter: {
        Row: { id: number; count: number; max_count: number; updated_at: string };
        Insert: { id?: number; count?: number; max_count?: number };
        Update: { count?: number; updated_at?: string };
      };

      // ── Platform / Admin ─────────────────────────────────────
      trending_goals: {
        Row: { id: string; title: string; category: string; emoji: string; momentum: string; context: string | null; search_volume: number; updated_at: string };
        Insert: { title: string; category: string; emoji?: string; momentum?: string; context?: string | null; search_volume?: number };
        Update: { momentum?: string; search_volume?: number; context?: string | null };
      };
      data_locker_settings: {
        Row: { id: string; user_id: string; consent_level: string; share_goals: boolean; share_behavior: boolean; share_purchases: boolean; share_health: boolean; share_location: boolean; share_interests: boolean; created_at: string; updated_at: string };
        Insert: { user_id: string; consent_level?: string; share_goals?: boolean; share_behavior?: boolean; share_purchases?: boolean; share_health?: boolean; share_location?: boolean; share_interests?: boolean };
        Update: { consent_level?: string; share_goals?: boolean; share_behavior?: boolean; share_purchases?: boolean; share_health?: boolean; share_location?: boolean; share_interests?: boolean };
      };

      // ── Migration 002-004 Tables ─────────────────────────────
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
      referrals: {
        Row: { id: string; referrer_id: string; referred_id: string; vlg_awarded: boolean; created_at: string };
        Insert: { referrer_id: string; referred_id: string; vlg_awarded?: boolean };
        Update: { vlg_awarded?: boolean };
      };
      ad_placements: {
        Row: { id: string; advertiser_id: string | null; title: string; body: string; cta: string; url: string; icon: string; target_categories: string[]; bid_amount: number; budget: number | null; spent: number; is_active: boolean; starts_at: string | null; ends_at: string | null; created_at: string };
        Insert: { title: string; body: string; cta: string; url: string; target_categories?: string[]; bid_amount?: number; is_active?: boolean; icon?: string };
        Update: { is_active?: boolean; spent?: number; ends_at?: string | null };
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
