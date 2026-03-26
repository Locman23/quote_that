/* Team and quote management schema for Quote That! */
create extension if not exists pgcrypto;

drop table if exists quotes cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;
drop function if exists public.is_username_available(text);

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

create index idx_groups_created_by on groups(created_by);
create index idx_group_members_group_id on group_members(group_id);
create index idx_group_members_user_id on group_members(user_id);
create index idx_quotes_group_id on quotes(group_id);
create index idx_quotes_created_by on quotes(created_by);

/*Enable RLS policies */
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table quotes enable row level security;

/*Per-row profile access policy */
create policy "Users can read own profile"
on profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert own profile"
on profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.is_username_available(candidate_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where username = candidate_username
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

/*Group access policies */
create policy "Members can read groups they belong to"
on groups
for select
to authenticated
using (
  exists (
    select 1 from group_members
    where group_members.group_id = groups.id
    and group_members.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can create groups"
on groups
for insert
to authenticated
with check ((select auth.uid()) = created_by);

/*Group member access policies */
create policy "Users can read memberships for their groups"
on group_members
for select
to authenticated
using (
  exists (
    select 1 from group_members gm
    where gm.group_id = group_members.group_id
    and gm.user_id = (select auth.uid())
  )
);

create policy "Users can join groups as themselves"
on group_members
for insert
to authenticated
with check ((select auth.uid()) = user_id);

/* Quote access policies */
create policy "Users can read quotes in their groups"
on quotes
for select
to authenticated
using (
  exists (
    select 1 from group_members
    where group_members.group_id = quotes.group_id
    and group_members.user_id = (select auth.uid())
  )
);

create policy "Users can insert quotes in their groups"
on quotes
for insert
to authenticated
with check (
  (select auth.uid()) = created_by
  and exists (
    select 1 from group_members
    where group_members.group_id = quotes.group_id
    and group_members.user_id = (select auth.uid())
  )
);

create policy "Users can update own quotes"
on quotes
for update
to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);

create policy "Users can delete own quotes"
on quotes
for delete
to authenticated
using ((select auth.uid()) = created_by);