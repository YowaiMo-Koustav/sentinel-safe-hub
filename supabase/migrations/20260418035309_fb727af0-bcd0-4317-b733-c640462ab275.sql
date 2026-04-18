-- ---------------------------------------------------------------
-- ZONES
-- ---------------------------------------------------------------
create type public.zone_status as enum ('normal','caution','danger');

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  building text,
  floor text,
  capacity int,
  status public.zone_status not null default 'normal',
  evacuation_path_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.zones enable row level security;

create policy "Anyone authenticated can view zones"
  on public.zones for select to authenticated using (true);

create policy "Admins manage zones"
  on public.zones for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger trg_zones_updated
  before update on public.zones
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------
-- EVACUATION PATHS
-- ---------------------------------------------------------------
create type public.path_status as enum ('clear','partial','blocked');

create table public.evacuation_paths (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  from_zone text not null,
  to_zone text not null,
  steps jsonb not null default '[]'::jsonb,
  status public.path_status not null default 'clear',
  estimated_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.evacuation_paths enable row level security;

create policy "Anyone authenticated can view paths"
  on public.evacuation_paths for select to authenticated using (true);

create policy "Admins manage paths"
  on public.evacuation_paths for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger trg_paths_updated
  before update on public.evacuation_paths
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------
-- INCIDENT UPDATES (renamed concept of incident_events)
-- ---------------------------------------------------------------
create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  actor_id uuid,
  actor_name text,
  actor_role public.app_role,
  message text not null,
  new_status public.incident_status,
  created_at timestamptz not null default now()
);

create index idx_updates_incident on public.incident_updates(incident_id, created_at);

alter table public.incident_updates enable row level security;

create policy "View updates for own or staff incidents"
  on public.incident_updates for select to authenticated
  using (
    public.is_staff_or_above(auth.uid())
    or exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid())
  );

create policy "Staff+ can post updates"
  on public.incident_updates for insert to authenticated
  with check (public.is_staff_or_above(auth.uid()) and auth.uid() = actor_id);

-- ---------------------------------------------------------------
-- DEMO EVENTS
-- ---------------------------------------------------------------
create table public.demo_events (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  played_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.demo_events enable row level security;

create policy "Anyone authenticated can view demo events"
  on public.demo_events for select to authenticated using (true);

create policy "Admins manage demo events"
  on public.demo_events for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------
-- SYSTEM STATUS (single row)
-- ---------------------------------------------------------------
create table public.system_status (
  id uuid primary key default gen_random_uuid(),
  sensors_online int not null default 0,
  sensors_total int not null default 0,
  network_ok boolean not null default true,
  power_ok boolean not null default true,
  responders_available int not null default 0,
  staff_on_duty int not null default 0,
  last_heartbeat timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.system_status enable row level security;

create policy "Anyone authenticated can view system status"
  on public.system_status for select to authenticated using (true);

create policy "Admins update system status"
  on public.system_status for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger trg_status_updated
  before update on public.system_status
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------
alter table public.incident_updates replica identity full;
alter table public.system_status replica identity full;
alter table public.zones replica identity full;
alter publication supabase_realtime add table public.incident_updates;
alter publication supabase_realtime add table public.system_status;
alter publication supabase_realtime add table public.zones;

-- ---------------------------------------------------------------
-- SEED DATA
-- ---------------------------------------------------------------
insert into public.zones (name, building, floor, capacity, status) values
  ('Tower A · Lobby','Tower A','G',200,'normal'),
  ('Tower A · Rooms','Tower A','3-20',420,'normal'),
  ('Tower B · Lobby','Tower B','G',180,'normal'),
  ('Tower B · Rooms','Tower B','3-18',380,'normal'),
  ('Pool deck','Outdoor','R',120,'normal'),
  ('Conference hall','Tower A','2',300,'normal'),
  ('Restaurant','Tower A','1',150,'normal'),
  ('Parking','Underground','-1,-2',500,'normal'),
  ('Back of house','Service','G',60,'normal');

insert into public.evacuation_paths (name, from_zone, to_zone, steps, status, estimated_seconds) values
  ('Tower A → North Assembly','Tower A · Rooms','North Assembly Point',
   '["Take corridor right toward Stair B","Descend Stair B to ground","Exit through North door","Proceed to North Assembly Point"]'::jsonb,
   'clear', 110),
  ('Tower B → South Assembly','Tower B · Rooms','South Assembly Point',
   '["Head left to Stair C","Descend to ground level","Exit south doors","Walk to South Assembly Point"]'::jsonb,
   'clear', 130),
  ('Pool deck → North Assembly','Pool deck','North Assembly Point',
   '["Cross deck toward east gate","Use service ramp","Follow yellow line to assembly"]'::jsonb,
   'clear', 90);

insert into public.system_status
  (sensors_online, sensors_total, network_ok, power_ok, responders_available, staff_on_duty)
values (47, 48, true, true, 6, 14);
