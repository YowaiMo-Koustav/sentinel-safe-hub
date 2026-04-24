# Supabase Integration Guide

This document provides a comprehensive overview of how Supabase is integrated throughout the Sentinel Safe Hub project.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Database Schema](#database-schema)
3. [Authentication System](#authentication-system)
4. [API Usage Patterns](#api-usage-patterns)
5. [Real-time Features](#real-time-features)
6. [Security & RLS Policies](#security--rls-policies)
7. [Migration History](#migration-history)

## Project Setup

### Dependencies
The project uses `@supabase/supabase-js` version `2.103.3` for all Supabase interactions.

### Configuration Files

#### Environment Variables (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

#### Supabase Config (supabase/config.toml)
```toml
project_id = "ivcaeeszkawakuwryxye"
```

#### Client Setup (src/integrations/supabase/client.ts)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Database Schema

### Core Tables

#### 1. Users & Authentication

**profiles** - Extended user information
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**user_roles** - Role-based access control
```sql
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
```

**Role Types:**
- `guest` - Basic access, can report incidents
- `staff` - Can view and manage incidents
- `responder` - Can respond to incidents
- `admin` - Full system access

#### 2. Incident Management

**incidents** - Main incident tracking
```sql
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
```

**incident_events** - Incident timeline/events
```sql
create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  actor_id uuid,
  actor_name text,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);
```

#### 3. Venue Management

**zones** - Building zones/areas
```sql
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
```

**evacuation_paths** - Emergency routes
```sql
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
```

#### 4. System Data

**demo_events** - Demo/simulation events
```sql
create table public.demo_events (
  created_at string,
  id string,
  kind string,
  label string,
  payload Json,
  played_at string | null,
  scheduled_at string | null
);
```

### Enums

#### Incident Types
- `smoke_fire`
- `crowd_surge`
- `fall_injury`
- `blocked_exit`
- `power_failure`
- `network_failure`
- `suspicious_activity`
- `other`

#### Severity Levels
- `low`
- `medium`
- `high`
- `critical`

#### Status Values
- `new`
- `acknowledged`
- `in_progress`
- `resolved`

## Authentication System

### Auth Context (src/lib/AuthContext.tsx)

The application uses a comprehensive authentication context that manages:

```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  displayName: string;
  loading: boolean;
  rolesLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}
```

### Key Features

1. **Automatic User Creation**: New users automatically get a profile and default 'guest' role
2. **Role-Based Routing**: Users are redirected based on their primary role
3. **Role Hierarchy**: `admin > responder > staff > guest`
4. **Session Persistence**: Uses localStorage for session persistence

### Usage Example

```typescript
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, hasRole, signOut } = useAuth();
  
  if (!user) return <Login />;
  if (hasRole('admin')) return <AdminPanel />;
  return <UserDashboard />;
}
```

## API Usage Patterns

### Common Patterns Used Throughout the App

#### 1. Data Fetching with Hooks

**useIncidents Hook** (src/hooks/useIncidents.ts)
```typescript
const load = async () => {
  let q = supabase.from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (ownOnly && userId) q = q.eq("reporter_id", userId);
  const { data, error } = await q;
  // Handle error and set data
};
```

**useVenueData Hook** (src/hooks/useVenueData.ts)
```typescript
// Fetch zones
supabase.from("zones").select("*").order("name").then(({ data }) => {
  setZones((data ?? []) as Zone[]);
});

// Fetch evacuation paths
supabase.from("evacuation_paths").select("*").order("name").then(({ data }) => {
  setPaths((data ?? []) as EvacuationPath[]);
});
```

#### 2. CRUD Operations

**Create Incident** (src/pages/GuestSOS.tsx)
```typescript
const { data, error } = await supabase.from("incidents").insert({
  type,
  severity: meta.defaultSeverity,
  status: "new",
  zone: selectedZone,
  reporter_id: user.id,
  reporter_name: displayName || user.email?.split("@")[0],
});
```

**Update Incident** (src/pages/StaffDashboard.tsx)
```typescript
const { error } = await supabase.from("incidents")
  .update(patch)
  .eq("id", i.id);
```

**Claim Assignment** (src/pages/ResponderView.tsx)
```typescript
const { error } = await supabase.from("incidents").update({
  status: "in_progress",
  assigned_to: user.id,
  assigned_name: displayName || user.email?.split("@")[0],
}).eq("id", id);
```

#### 3. Role-Based Queries

**Auth Context Role Loading**
```typescript
const [{ data: roleRows }, { data: profile }] = await Promise.all([
  supabase.from("user_roles").select("role").eq("user_id", uid),
  supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
]);
```

## Real-time Features

### Real-time Subscriptions

The application uses Supabase real-time for live updates:

**Zone Status Updates**
```typescript
const ch = supabase.channel("zones-live")
  .on("postgres_changes", 
    { event: "*", schema: "public", table: "zones" },
    (payload) => { /* handle update */ }
  )
  .subscribe();
```

**System Status Monitoring**
```typescript
const ch = supabase.channel("status-live")
  .on("postgres_changes", 
    { event: "*", schema: "public", table: "system_status" },
    (payload) => { /* handle status change */ }
  )
  .subscribe();
```

**Incident Updates**
```typescript
const ch = supabase.channel(`updates-${incidentId}`)
  .on("postgres_changes", 
    { event: "*", schema: "public", table: "incident_updates" },
    (payload) => { /* handle new update */ }
  )
  .subscribe();
```

### Real-time Enabled Tables
- `incidents`
- `incident_events`
- `zones`
- `evacuation_paths`
- `system_status`

## Security & RLS Policies

### Row Level Security (RLS)

All tables have RLS enabled with granular policies:

#### Profile Policies
```sql
-- Viewable by all authenticated users
create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);
```

#### Incident Policies
```sql
-- Guests can create incidents
create policy "Guests can create incidents"
  on public.incidents for insert to authenticated
  with check (auth.uid() = reporter_id);

-- Staff+ can view all incidents
create policy "Staff+ can view all incidents"
  on public.incidents for select to authenticated
  using (public.is_staff_or_above(auth.uid()));
```

#### Security Functions

**Role Checking Function**
```sql
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;
```

**Staff Level Check**
```sql
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
```

### Automatic User Handling

**New User Trigger**
```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.app_role;
begin
  -- Create profile
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  -- Assign role from metadata or default to guest
  begin
    _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'guest'::public.app_role);
  exception when others then
    _role := 'guest'::public.app_role;
  end;

  insert into public.user_roles (user_id, role) values (new.id, _role);
  return new;
end;
$$;
```

## Migration History

### Migration 1: User System (20260417161158)
- Created `app_role` enum
- Set up `profiles` table with RLS
- Created `user_roles` table with role hierarchy
- Added security functions for role checking
- Implemented automatic user creation trigger

### Migration 2: Incident Management (20260418034518)
- Added incident-related enums (type, severity, status, source)
- Created `incidents` table with full indexing
- Created `incident_events` for timeline tracking
- Implemented comprehensive RLS policies
- Enabled real-time replication

### Migration 3: Venue Management (20260418035309)
- Added venue-related enums (zone_status, path_status)
- Created `zones` table for building areas
- Created `evacuation_paths` for emergency routes
- Added demo events table for simulations
- Implemented zone management RLS policies

## Best Practices Used

### 1. Type Safety
- Full TypeScript types generated in `src/integrations/supabase/types.ts`
- Database types used throughout the application
- Strict typing for all database operations

### 2. Error Handling
- Consistent error handling patterns across all API calls
- User-friendly error messages with toast notifications
- Graceful fallbacks for missing data

### 3. Performance Optimization
- Efficient queries with proper indexing
- Pagination for large datasets
- Real-time subscriptions only when needed
- Caching strategies in custom hooks

### 4. Security
- Comprehensive RLS policies on all tables
- Role-based access control
- Security definer functions for complex checks
- Input validation through TypeScript types

### 5. Real-time Architecture
- Strategic use of real-time subscriptions
- Channel-based organization for different data types
- Automatic cleanup of subscriptions
- Efficient update handling

## Integration Points

### Frontend Components Using Supabase

1. **AuthContext** - Authentication and role management
2. **useIncidents** - Incident data fetching and management
3. **useVenueData** - Zone and evacuation path data
4. **GuestSOS** - Incident creation for guests
5. **StaffDashboard** - Incident management for staff
6. **ResponderView** - Incident response interface
7. **IncidentDetail** - Detailed incident view with updates

### Data Flow

1. **User Registration** → Auth → Profile Creation → Role Assignment
2. **Incident Report** → Validation → Database Insert → Real-time Broadcast
3. **Status Updates** → Permission Check → Database Update → Real-time Sync
4. **Role Changes** → Admin Action → Database Update → Auth Context Refresh

This comprehensive Supabase integration provides a robust, scalable foundation for the Sentinel Safe Hub's emergency management system.
