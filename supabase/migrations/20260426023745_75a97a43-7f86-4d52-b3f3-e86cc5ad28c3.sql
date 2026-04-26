-- Enable replica identity full so realtime payloads include row data
alter table public.incidents replica identity full;
alter table public.incident_updates replica identity full;
alter table public.zones replica identity full;
alter table public.evacuation_paths replica identity full;
alter table public.system_status replica identity full;

-- Add tables to the supabase_realtime publication (idempotent)
do $$
begin
  begin alter publication supabase_realtime add table public.incidents; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.incident_updates; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.zones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.evacuation_paths; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.system_status; exception when duplicate_object then null; end;
end $$;