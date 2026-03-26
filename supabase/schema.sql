/* Team and quote management schema for Quote That! */
create extension if not exists pgcrypto;

drop table if exists quotes cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;
drop function if exists public.is_username_available(text);
drop function if exists public.find_group_by_join_code(text);
drop function if exists public.create_group_with_admin_membership(text);

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

create or replace function public.find_group_by_join_code(candidate_join_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select groups.id, groups.name
  from public.groups
  where groups.join_code = upper(candidate_join_code)
  limit 1;
$$;

grant execute on function public.find_group_by_join_code(text) to authenticated;

create or replace function public.create_group_with_admin_membership(group_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  generated_join_code text;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to create a group.';
  end if;

  if group_name is null or btrim(group_name) = '' then
    raise exception 'Group name is required.';
  end if;

  loop
    generated_join_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    begin
      insert into public.groups (name, join_code, created_by)
      values (btrim(group_name), generated_join_code, current_user_id)
      returning groups.id, groups.name into id, name;

      exit;
    exception
      when unique_violation then
        if exists (
          select 1
          from public.groups
          where groups.join_code = generated_join_code
        ) then
          continue;
        end if;

        raise;
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role)
  values (id, current_user_id, 'admin');

  return next;
end;
$$;

grant execute on function public.create_group_with_admin_membership(text) to authenticated;

/*Group access policies */
create policy "Members can read groups they belong to"
on groups
for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
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
using ((select auth.uid()) = user_id);

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