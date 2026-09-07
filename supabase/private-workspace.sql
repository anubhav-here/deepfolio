create table public.deepfolio_owner (
 singleton boolean primary key default true check (singleton),
 email text not null unique check (email = lower(email))
);
alter table public.deepfolio_owner enable row level security;
revoke all on public.deepfolio_owner from anon, authenticated;
grant select on public.deepfolio_owner to authenticated;
create policy owner_read on public.deepfolio_owner for select to authenticated
 using (email = (select auth.jwt()->>'email') and (select auth.jwt()->>'is_anonymous') is distinct from 'true');

create table public.deepfolio_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check (kind in ('task','habit','reflection','review','finance')),
 title text not null check (length(trim(title)) between 1 and 300),
 body text not null default '' check (length(body) <= 20000),
 horizon text not null default 'today' check (horizon in ('today','week','horizon')),
 due_date date,
 completed boolean not null default false,
 checkins date[] not null default '{}',
 created_at timestamptz not null default now()
);
create index deepfolio_entries_user_created on public.deepfolio_entries(user_id,created_at desc);
alter table public.deepfolio_entries enable row level security;
revoke all on public.deepfolio_entries from anon;
grant select,insert,update,delete on public.deepfolio_entries to authenticated;
create policy owner_entries on public.deepfolio_entries for all to authenticated
using (
 user_id = (select auth.uid()) and exists (select 1 from public.deepfolio_owner)
)
with check (
 user_id = (select auth.uid()) and exists (select 1 from public.deepfolio_owner)
);

-- Internal DDL trigger must not be callable through the public API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
