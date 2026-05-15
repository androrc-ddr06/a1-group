-- ============================================
-- A1 Group — Supabase Database Schema
-- Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CLIENTS table
-- ============================================
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text not null,
  email text not null unique,
  access_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'onboarding', 'active')),
  created_at timestamptz default now()
);

-- ============================================
-- PROJECTS table
-- ============================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  start_date date,
  due_date date,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  days_remaining integer default 0,
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz default now()
);

-- ============================================
-- ONBOARDING_RESPONSES table
-- ============================================
create table if not exists public.onboarding_responses (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  company_name text,
  industry text,
  website text,
  description text,
  brand_colors text,
  font_preferences text,
  instagram_handle text,
  facebook_page text,
  tiktok_handle text,
  other_socials text,
  target_audience text,
  main_goal text,
  monthly_budget text,
  top_competitors text,
  submitted_at timestamptz default now()
);

-- ============================================
-- CLIENT_UPDATES table
-- ============================================
create table if not exists public.client_updates (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- ============================================
-- PORTFOLIO_ITEMS table (admin manages these)
-- ============================================
create table if not exists public.portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  client_name text,
  category text,
  description text,
  result text,
  url text,
  image_url text,
  featured boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.client_updates enable row level security;
alter table public.portfolio_items enable row level security;

-- Portfolio items are publicly readable
create policy "Portfolio items are public" on public.portfolio_items
  for select using (true);

-- Service role bypasses RLS (used by admin panel server routes)
-- All other access controlled by service role key on server

-- ============================================
-- SEED DATA — Ruben Prado (Roosters BBQ)
-- ============================================

insert into public.clients (name, company, email, access_code, status)
values ('Ruben Prado', 'Roosters Rolling Barbecue', 'ruben@roostersrollingbbq.com', 'A1RUBEN8', 'active')
on conflict (email) do nothing;

-- Insert project for Ruben (linked via subquery)
insert into public.projects (client_id, name, start_date, due_date, progress_percent, days_remaining, status)
select
  id,
  'Content Production & Social Media Management',
  '2026-05-01',
  '2026-05-27',
  65,
  12,
  'in_progress'
from public.clients where email = 'ruben@roostersrollingbbq.com'
on conflict do nothing;

-- Insert welcome updates for Ruben
insert into public.client_updates (client_id, message)
select id, 'Content calendar for week 3 is ready. 8 posts scheduled including 2 reels.'
from public.clients where email = 'ruben@roostersrollingbbq.com';

insert into public.client_updates (client_id, message)
select id, 'Instagram reached 1,200 followers — up 18% from last month. Great momentum!'
from public.clients where email = 'ruben@roostersrollingbbq.com';

insert into public.client_updates (client_id, message)
select id, 'Onboarding complete. Strategy session scheduled for May 7th.'
from public.clients where email = 'ruben@roostersrollingbbq.com';

-- Insert Roosters BBQ portfolio item
insert into public.portfolio_items (title, client_name, category, description, result, url, featured)
values (
  'Roosters Rolling Barbecue',
  'Ruben Prado',
  'Web Design · Social Media · Content',
  'Full content production, social media management, and a custom website for a mobile BBQ business. Built the brand''s entire digital presence from the ground up.',
  '+180% Follower Growth',
  'https://roostersrollingbbq.com/',
  true
);
