import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  access_code: string;
  status: "pending" | "onboarding" | "active";
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  name: string;
  start_date: string;
  due_date: string;
  progress_percent: number;
  days_remaining: number;
  status: "not_started" | "in_progress" | "completed";
  created_at: string;
};

export type OnboardingResponse = {
  id: string;
  client_id: string;
  company_name: string;
  industry: string;
  website: string;
  description: string;
  brand_colors: string;
  font_preferences: string;
  instagram_handle: string;
  facebook_page: string;
  tiktok_handle: string;
  other_socials: string;
  target_audience: string;
  main_goal: string;
  monthly_budget: string;
  top_competitors: string;
  submitted_at: string;
};

export type ClientUpdate = {
  id: string;
  client_id: string;
  message: string;
  created_at: string;
};
