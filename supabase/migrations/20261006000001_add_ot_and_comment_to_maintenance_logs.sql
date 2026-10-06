alter table public.maintenance_logs
  add column if not exists work_order_number text,
  add column if not exists comment text not null default '';
