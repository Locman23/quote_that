/* Team and quote management schema for Quote That! */
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text unique not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  quoted_person_name text not null,
  content text not null,
  context text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

/*Enable RLS policies */
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table quotes enable row level security;

/*Per-row profile access policy */
create policy "Users can read own profile"
on profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = id);

/*Group access policies */
create policy "Members can read groups they belong to"
on groups
for select
using (
  exists (
    select 1 from group_members
    where group_members.group_id = groups.id
    and group_members.user_id = auth.uid()
  )
);

create policy "Authenticated users can create groups"
on groups
for insert
with check (auth.uid() = created_by);

/*Group member access policies */
create policy "Users can read memberships for their groups"
on group_members
for select
using (
  exists (
    select 1 from group_members gm
    where gm.group_id = group_members.group_id
    and gm.user_id = auth.uid()
  )
);

create policy "Users can join groups as themselves"
on group_members
for insert
with check (auth.uid() = user_id);

/* Quote access policies */
create policy "Users can read quotes in their groups"
on quotes
for select
using (
  exists (
    select 1 from group_members
    where group_members.group_id = quotes.group_id
    and group_members.user_id = auth.uid()
  )
);

create policy "Users can insert quotes in their groups"
on quotes
for insert
with check (
  auth.uid() = created_by
  and exists (
    select 1 from group_members
    where group_members.group_id = quotes.group_id
    and group_members.user_id = auth.uid()
  )
);

create policy "Users can update own quotes"
on quotes
for update
using (auth.uid() = created_by);

create policy "Users can delete own quotes"
on quotes
for delete
using (auth.uid() = created_by);