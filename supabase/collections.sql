-- Run after private-workspace.sql and goal-hierarchy.sql.
-- Adds the small set of fields used by the private capture workspace.
alter table public.deepfolio_entries
  add column if not exists visibility text not null default 'private' check (visibility in ('private','public')),
  add column if not exists source_url text check (source_url is null or source_url ~ '^https?://'),
  add column if not exists target_price numeric(12,2) check (target_price is null or target_price >= 0),
  add column if not exists currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  add column if not exists end_date date;

alter table public.deepfolio_entries drop constraint if exists deepfolio_entries_kind_check;
alter table public.deepfolio_entries add constraint deepfolio_entries_kind_check
  check (kind in ('task','habit','reflection','review','finance','long_goal','weekly_goal','mit','note','watch','trip'));

create index if not exists deepfolio_entries_user_kind_created
  on public.deepfolio_entries(user_id,kind,created_at desc);
