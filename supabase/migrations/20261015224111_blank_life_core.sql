-- Blank Life hosted-data foundation. Supabase Auth is the identity source.
-- Campus leadership access is granted by an administrator, never self-selected by a client.
create type public.campus_path as enum ('beginner', 'developer', 'grower');
create type public.campus_role as enum ('learner', 'developer', 'mentor', 'director', 'shareholder', 'investor', 'cofounder', 'founder');

create table public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,18}$'),
  display_name text not null check (char_length(display_name) between 2 and 28),
  path public.campus_path not null default 'beginner',
  selected_career text not null default 'frontend-engineer',
  life_coins bigint not null default 250 check (life_coins >= 0),
  career_xp bigint not null default 0 check (career_xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campus_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.campus_role not null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.startup_pitches (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 90),
  pitch_text text not null check (char_length(pitch_text) between 20 and 3000),
  video_object_path text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index startup_pitches_feed_idx on public.startup_pitches(published, created_at desc);

create table public.pitch_reactions (
  pitch_id uuid not null references public.startup_pitches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'grower-interest')),
  created_at timestamptz not null default now(),
  primary key (pitch_id, user_id, reaction)
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  ciphertext text not null,
  nonce text not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index direct_messages_pair_idx on public.direct_messages(sender_id, recipient_id, created_at desc);

create table public.learning_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);

alter table public.player_profiles enable row level security;
alter table public.campus_memberships enable row level security;
alter table public.startup_pitches enable row level security;
alter table public.pitch_reactions enable row level security;
alter table public.direct_messages enable row level security;
alter table public.learning_completions enable row level security;

-- Profiles are readable by signed-in island members, but writable only by their owner.
create policy "Members can view profiles" on public.player_profiles for select to authenticated using (true);
create policy "Players create their own profile" on public.player_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players update their own profile" on public.player_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Membership rows have no client write policy: use a trusted administrative server to grant roles.
create policy "Players can read their own campus roles" on public.campus_memberships for select to authenticated using ((select auth.uid()) = user_id);

create policy "Published pitches and own drafts are readable" on public.startup_pitches for select to authenticated using (published or (select auth.uid()) = founder_id);
create policy "Players create their own pitches" on public.startup_pitches for insert to authenticated with check ((select auth.uid()) = founder_id);
create policy "Founders update their own pitches" on public.startup_pitches for update to authenticated using ((select auth.uid()) = founder_id) with check ((select auth.uid()) = founder_id);
create policy "Founders delete their own pitches" on public.startup_pitches for delete to authenticated using ((select auth.uid()) = founder_id);

create policy "Signed-in players read pitch reactions" on public.pitch_reactions for select to authenticated using (true);
create policy "Players react as themselves" on public.pitch_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players remove their reactions" on public.pitch_reactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Message participants can read" on public.direct_messages for select to authenticated using ((select auth.uid()) in (sender_id, recipient_id));
create policy "Sender can create an encrypted message" on public.direct_messages for insert to authenticated with check ((select auth.uid()) = sender_id);
create policy "Message participants can delete" on public.direct_messages for delete to authenticated using ((select auth.uid()) in (sender_id, recipient_id));

create policy "Players read their own learning progress" on public.learning_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players record their own learning progress" on public.learning_completions for insert to authenticated with check ((select auth.uid()) = user_id);

-- Explicit grants are needed for Data API access on projects that disable default table exposure.
grant select, insert, update on public.player_profiles to authenticated;
grant select on public.campus_memberships to authenticated;
grant select, insert, update, delete on public.startup_pitches to authenticated;
grant select, insert, delete on public.pitch_reactions to authenticated;
grant select, insert, delete on public.direct_messages to authenticated;
grant select, insert on public.learning_completions to authenticated;
