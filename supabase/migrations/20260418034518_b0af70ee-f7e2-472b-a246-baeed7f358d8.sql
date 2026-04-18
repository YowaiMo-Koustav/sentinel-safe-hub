-- Enums
create type public.incident_type as enum (
  'smoke_fire', 'crowd_surge', 'fall_injury', 'blocked_exit',
  'power_failure', 'network_failure', 'suspicious_activity', 'other'
);

create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');

create type public.incident_status as enum ('new', 'acknowledged', 'in_progress', 'resolved');

create type public.incident_source as enum ('guest', 'staff', 'sensor');

-- Incidents table
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  type public.incident_type not null,
  severity public.incident_severity not null default 'medium',
  status public.incident_status not null default 'new',
  zone text not null,
  room text,
  note text,
  source public.incident_source not null default 'guest',
  reporter_id uuid not null,
  reporter_name text,
  assigned_to uuid,
  assigned_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_incidents_status on public.incidents(status);
create index idx_incidents_reporter on public.incidents(reporter_id);
create index idx_incidents_created on public.incidents(created_at desc);

alter table public.incidents enable row level security;

-- Helper: is staff/responder/admin
create or replace function public.is_staff_or_above(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('staff','responder','admin')
  )
$$;

-- RLS for incidents
create policy "Guests can create incidents"
  on public.incidents for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "Reporters can view their own incidents"
  on public.incidents for select to authenticated
  using (auth.uid() = reporter_id);

create policy "Staff+ can view all incidents"
  on public.incidents for select to authenticated
  using (public.is_staff_or_above(auth.uid()));

create policy "Staff+ can update incidents"
  on public.incidents for update to authenticated
  using (public.is_staff_or_above(auth.uid()));

create policy "Admins can delete incidents"
  on public.incidents for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create trigger trg_incidents_updated_at
before update on public.incidents
for each row execute function public.update_updated_at_column();

-- Incident events (timeline)
create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  actor_id uuid,
  actor_name text,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

create index idx_events_incident on public.incident_events(incident_id, created_at);

alter table public.incident_events enable row level security;

create policy "Authenticated can view related events"
  on public.incident_events for select to authenticated
  using (
    public.is_staff_or_above(auth.uid())
    or exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid())
  );

create policy "Staff+ can insert events"
  on public.incident_events for insert to authenticated
  with check (public.is_staff_or_above(auth.uid()) or auth.uid() = actor_id);

-- Realtime
alter table public.incidents replica identity full;
alter table public.incident_events replica identity full;
alter publication supabase_realtime add table public.incidents;
alter publication supabase_realtime add table public.incident_events;