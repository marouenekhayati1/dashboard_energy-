create or replace function public.update_maintenance_log(
  p_record_id uuid,
  p_technician_id text,
  p_matricule text,
  p_task_id uuid,
  p_operating_hours numeric,
  p_maintenance_date date,
  p_work_order_number text,
  p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_technician public.technicians%rowtype;
  v_log public.maintenance_logs%rowtype;
  v_task public.maintenance_tasks%rowtype;
begin
  select * into v_technician
  from public.technicians
  where id::text = p_technician_id
    and matricule = p_matricule
    and is_active = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Authentification invalide.');
  end if;

  select * into v_log
  from public.maintenance_logs
  where id = p_record_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Cette intervention est introuvable.');
  end if;

  if coalesce(v_technician.role, '') <> 'admin' and v_log.technician_id <> v_technician.id::text then
    return jsonb_build_object('success', false, 'error', 'Vous pouvez uniquement modifier vos propres interventions.');
  end if;

  select * into v_task
  from public.maintenance_tasks
  where id = p_task_id
    and utility_name = v_log.utility_name
    and equipment_name = v_log.equipment_name;

  if not found then
    return jsonb_build_object('success', false, 'error', 'La tâche doit rester associée au même équipement.');
  end if;

  if p_operating_hours is not null and p_operating_hours < 0 then
    return jsonb_build_object('success', false, 'error', 'Le compteur d''heures doit être positif ou nul.');
  end if;

  if p_maintenance_date is null then
    return jsonb_build_object('success', false, 'error', 'La date de l''intervention est obligatoire.');
  end if;

  update public.maintenance_logs
  set task_id = v_task.id,
      task_title = v_task.title,
      operating_hours = p_operating_hours,
      maintenance_date = p_maintenance_date,
      work_order_number = nullif(btrim(p_work_order_number), ''),
      comment = coalesce(p_comment, '')
  where id = v_log.id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.update_maintenance_log(uuid, text, text, uuid, numeric, date, text, text) from public;
grant execute on function public.update_maintenance_log(uuid, text, text, uuid, numeric, date, text, text) to anon, authenticated;
