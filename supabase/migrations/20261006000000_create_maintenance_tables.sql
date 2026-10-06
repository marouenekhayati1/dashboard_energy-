create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  utility_name text not null,
  utility_label text not null,
  equipment_name text not null,
  title text not null,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists maintenance_tasks_scope_title_unique
  on public.maintenance_tasks (utility_name, equipment_name, lower(title));

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.maintenance_tasks(id),
  utility_name text not null,
  utility_label text not null,
  equipment_name text not null,
  task_title text not null,
  operating_hours numeric(12, 1) check (operating_hours is null or operating_hours >= 0),
  maintenance_date date not null,
  poste text not null check (poste in ('matin', 'apres-midi', 'nuit')),
  technician_id text not null default '',
  technician_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_logs_date_created_idx
  on public.maintenance_logs (maintenance_date desc, created_at desc);

alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_logs enable row level security;

grant select, insert on public.maintenance_tasks to anon, authenticated;
grant select, insert on public.maintenance_logs to anon, authenticated;

create policy "maintenance tasks are readable"
  on public.maintenance_tasks for select to anon, authenticated using (true);
create policy "maintenance tasks can be created"
  on public.maintenance_tasks for insert to anon, authenticated with check (true);
create policy "maintenance logs are readable"
  on public.maintenance_logs for select to anon, authenticated using (true);
create policy "maintenance logs can be created"
  on public.maintenance_logs for insert to anon, authenticated with check (true);
