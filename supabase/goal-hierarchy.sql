alter table public.deepfolio_entries drop constraint deepfolio_entries_kind_check;
alter table public.deepfolio_entries add constraint deepfolio_entries_kind_check check (kind in ('task','habit','reflection','review','finance','long_goal','weekly_goal','mit'));
alter table public.deepfolio_entries add column parent_id uuid, add column week_start date, add column automation_id text;
alter table public.deepfolio_entries add constraint deepfolio_entry_owner_key unique(id,user_id);
alter table public.deepfolio_entries add constraint deepfolio_parent_owner foreign key(parent_id,user_id) references public.deepfolio_entries(id,user_id) on delete restrict;
alter table public.deepfolio_entries add constraint deepfolio_hierarchy_fields check (
 (kind='long_goal' and parent_id is null) or
 (kind='weekly_goal' and parent_id is not null and week_start is not null and extract(isodow from week_start)=1) or
 (kind='mit' and parent_id is not null and due_date is not null) or
 (kind in ('task','habit','reflection','review','finance') and parent_id is null)
);
create index deepfolio_parent_index on public.deepfolio_entries(parent_id,user_id);
create function public.deepfolio_validate_parent() returns trigger language plpgsql security invoker set search_path='' as $$
declare parent_kind text;
begin
 if new.parent_id is not null then
  select kind into parent_kind from public.deepfolio_entries where id=new.parent_id and user_id=new.user_id for key share;
  if parent_kind is null or (new.kind='weekly_goal' and parent_kind<>'long_goal') or (new.kind='mit' and parent_kind<>'weekly_goal') then
   raise exception 'Weekly goals must belong to a long-term goal; MITs must belong to a weekly goal.';
  end if;
 end if;
 if tg_op='UPDATE' and (new.kind is distinct from old.kind or new.user_id is distinct from old.user_id) and exists(select 1 from public.deepfolio_entries where parent_id=old.id) then
  raise exception 'Move linked children before changing a goal type or owner.';
 end if;
 return new;
end $$;
create trigger deepfolio_parent_validation before insert or update on public.deepfolio_entries for each row execute function public.deepfolio_validate_parent();
