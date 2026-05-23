-- ══════════════════════════════════════════
-- FitIQ Iraq — Supabase SQL Schema
-- ══════════════════════════════════════════

-- جدول الملفات الشخصية
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('athlete', 'captain')) not null,
  full_name text,
  phone text,
  avatar_emoji text default '💪',
  created_at timestamptz default now()
);

-- جدول الكباتن
create table if not exists captains (
  id uuid references profiles(id) on delete cascade primary key,
  gym_name text,
  specialty text,
  experience_years int default 0,
  price_per_session int default 0,
  bio text,
  badge text,
  city text default 'بغداد',
  available boolean default true,
  rating numeric default 5.0
);

-- جدول الكورسات
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  captain_id uuid references captains(id) on delete cascade not null,
  title text not null,
  description text,
  duration_weeks int default 0,
  price int default 0,
  level text default 'مبتدئ',
  icon text default '💪',
  includes text[],
  created_at timestamptz default now()
);

-- جدول المحادثات
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references profiles(id) on delete cascade not null,
  captain_id uuid references captains(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(athlete_id, captain_id)
);

-- جدول الرسائل
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- جدول الاشتراكات بالكورسات
create table if not exists enrollments (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(athlete_id, course_id)
);

-- ══════════════════════════════════════════
-- تفعيل Row Level Security
-- ══════════════════════════════════════════

alter table profiles     enable row level security;
alter table captains     enable row level security;
alter table courses      enable row level security;
alter table conversations enable row level security;
alter table messages     enable row level security;
alter table enrollments  enable row level security;

-- ══════════════════════════════════════════
-- سياسات الصلاحيات (RLS Policies)
-- ══════════════════════════════════════════

-- Profiles
create policy "Anyone can view profiles"
  on profiles for select using (true);

create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id);

-- Captains
create policy "Anyone can view captains"
  on captains for select using (true);

create policy "Captains manage own data"
  on captains for all using (auth.uid() = id);

-- Courses
create policy "Anyone can view courses"
  on courses for select using (true);

create policy "Captains manage own courses"
  on courses for all using (auth.uid() = captain_id);

-- Conversations
create policy "Participants view conversations"
  on conversations for select
  using (auth.uid() = athlete_id or auth.uid() = captain_id);

create policy "Athletes create conversations"
  on conversations for insert
  with check (auth.uid() = athlete_id);

-- Messages
create policy "Participants view messages"
  on messages for select
  using (
    exists (
      select 1 from conversations
      where id = conversation_id
      and (athlete_id = auth.uid() or captain_id = auth.uid())
    )
  );

create policy "Participants send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations
      where id = conversation_id
      and (athlete_id = auth.uid() or captain_id = auth.uid())
    )
  );

-- Enrollments
create policy "Athletes view own enrollments"
  on enrollments for select using (auth.uid() = athlete_id);

create policy "Athletes create enrollments"
  on enrollments for insert with check (auth.uid() = athlete_id);

create policy "Captains view their course enrollments"
  on enrollments for select
  using (
    exists (
      select 1 from courses
      where id = course_id and captain_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════
-- تفعيل Realtime للرسائل
-- ══════════════════════════════════════════

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
