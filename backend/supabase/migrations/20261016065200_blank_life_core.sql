-- Startup.life server-owned schema. The game currently authenticates through its
-- Node API; these tables are intentionally unavailable to public client roles.

create table public.users (
  id text primary key,
  username text not null,
  display_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create unique index users_username_ci on public.users (lower(username));

create table public.players (
  user_id text primary key references public.users(id) on delete cascade,
  avatar integer not null default 0 check (avatar between 0 and 5),
  coins bigint not null default 250 check (coins >= 0),
  mood integer not null default 78,
  energy integer not null default 82,
  x double precision not null default 508,
  y double precision not null default 702,
  updated_at timestamptz not null default now(),
  job_id text not null default 'frontend-engineer',
  account_type text not null default 'developer' check (account_type in ('beginner','developer','grower')),
  xp bigint not null default 0 check (xp >= 0),
  learning_coins bigint not null default 0 check (learning_coins >= 0),
  tasks_done integer not null default 0 check (tasks_done >= 0)
);

create table public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at bigint not null,
  created_at timestamptz not null default now()
);
create index sessions_user_expiry on public.sessions(user_id, expires_at);

create table public.job_completions (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,
  job_id text not null,
  completed_at timestamptz not null default now()
);
create table public.learning_completions (
  user_id text not null references public.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);
create table public.coding_quest_completions (
  user_id text not null references public.users(id) on delete cascade,
  quest_id text not null,
  code text not null,
  completed_at timestamptz not null default now(),
  primary key(user_id, quest_id)
);
create table public.player_items (
  user_id text not null references public.users(id) on delete cascade,
  item_id text not null,
  collected_at timestamptz not null default now(),
  primary key(user_id, item_id)
);
create table public.visits (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,
  place_id text not null,
  reward integer not null,
  visited_at timestamptz not null default now()
);

create table public.homes (
  id text primary key,
  name text not null,
  district text not null,
  emoji text not null,
  x double precision not null,
  y double precision not null,
  price integer not null,
  description text not null
);
insert into public.homes(id,name,district,emoji,x,y,price,description) values
  ('lagoon-edge','Lagoon Edge Plot','Victoria Island','🌊',820,610,150,'A sunny plot close to the water.'),
  ('yaba-loft','Yaba Creative Loft','Yaba','🏙️',380,170,220,'Room for big ideas on the mainland.'),
  ('island-cottage','Island Garden Cottage','Lagos Island','🪴',350,400,300,'A quiet corner near the old city.'),
  ('ikeja-home','Ikeja Townhome','Ikeja','🏘️',160,180,350,'A roomy home on the north side of the city.')
on conflict(id) do nothing;
create table public.owned_homes (
  id bigint generated always as identity primary key,
  home_id text not null unique references public.homes(id),
  user_id text not null references public.users(id) on delete cascade,
  bought_at timestamptz not null default now()
);

create table public.chat_messages (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  room text not null default 'lagos',
  is_hidden boolean not null default false
);
create index chat_created_idx on public.chat_messages(created_at desc);
create table public.chat_reports (
  id bigint generated always as identity primary key,
  message_id text not null references public.chat_messages(id) on delete cascade,
  reporter_id text not null references public.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  status text not null default 'open',
  resolved_by text,
  resolved_at timestamptz,
  unique(message_id, reporter_id)
);

create table public.programming_resources (
  id text primary key,
  title text not null,
  description text,
  resource_type text not null,
  languages jsonb not null default '[]'::jsonb,
  subjects jsonb not null default '[]'::jsonb,
  authors jsonb not null default '[]'::jsonb,
  source_repository text not null,
  source_url text not null,
  source_file text,
  source_line integer,
  catalog_license text not null,
  content_license text,
  notes jsonb not null default '[]'::jsonb,
  availability text not null,
  difficulty text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resources_type_title_idx on public.programming_resources(resource_type, lower(title));
create index resources_languages_idx on public.programming_resources using gin(languages);
create index resources_subjects_idx on public.programming_resources using gin(subjects);
create index resources_search_idx on public.programming_resources using gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
create table public.player_resource_bookmarks (
  user_id text not null references public.users(id) on delete cascade,
  resource_id text not null references public.programming_resources(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key(user_id, resource_id)
);
create table public.player_resource_history (
  user_id text not null references public.users(id) on delete cascade,
  resource_id text not null references public.programming_resources(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(user_id, resource_id)
);

create table public.github_links (
  user_id text primary key references public.users(id) on delete cascade,
  github_id text not null,
  login text not null,
  avatar_url text,
  encrypted_token text not null,
  linked_at timestamptz not null default now()
);
create table public.github_oauth_states (
  state_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at bigint not null
);

create table public.learning_books (
  id text primary key,
  title text not null,
  language text not null,
  description text not null,
  price integer not null check(price >= 0),
  filename text not null,
  added_by text not null,
  created_at timestamptz not null default now()
);
create table public.learning_book_purchases (
  user_id text not null references public.users(id) on delete cascade,
  book_id text not null references public.learning_books(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key(user_id, book_id)
);
create table public.learning_videos (
  id text primary key,
  title text not null,
  language text not null,
  description text not null,
  youtube_url text not null,
  added_by text not null,
  created_at timestamptz not null default now()
);

-- RLS is enabled everywhere. The game API is the only data path and will use
-- a server-side Supabase secret; no password or OAuth-token table is exposed.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename not like 'spatial_ref_sys' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
