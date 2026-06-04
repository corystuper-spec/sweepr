-- ============================================================
-- Sweepr Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'customer' check (role in ('customer', 'cleaner', 'admin')),
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CLEANERS
-- ============================================================
create table public.cleaners (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  bio               text,
  rating            numeric(3,2) default 0,
  jobs_completed    integer not null default 0,
  bg_check_status   text not null default 'pending' check (bg_check_status in ('pending', 'cleared', 'failed')),
  is_active         boolean not null default false,
  service_zips      text[] not null default '{}',
  stripe_account_id text,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- PROPERTIES
-- ============================================================
create table public.properties (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.profiles(id) on delete cascade,
  address       text not null,
  sqft          integer,
  beds          numeric(3,1),
  baths         numeric(3,1),
  property_type text,
  raw_lookup    jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id                     uuid primary key default uuid_generate_v4(),
  customer_id            uuid not null references public.profiles(id) on delete cascade,
  property_id            uuid not null references public.properties(id) on delete restrict,
  status                 text not null default 'pending_match'
                           check (status in ('pending_match', 'matched', 'in_progress', 'completed', 'cancelled')),
  base_price             numeric(10,2) not null,
  addons                 jsonb not null default '[]',
  addons_total           numeric(10,2) not null default 0,
  recurrence             text not null default 'once'
                           check (recurrence in ('once', 'weekly', 'biweekly', 'monthly')),
  total_price            numeric(10,2) not null,
  scheduled_date         date not null,
  scheduled_time         text not null,
  preferred_cleaner_id   uuid references public.cleaners(id),
  assigned_cleaner_id    uuid references public.cleaners(id),
  stripe_payment_intent  text,
  created_at             timestamptz not null default now()
);

-- ============================================================
-- JOB OFFERS
-- ============================================================
create table public.job_offers (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  cleaner_id  uuid not null references public.cleaners(id) on delete cascade,
  status      text not null default 'sent'
                check (status in ('sent', 'accepted', 'declined', 'expired')),
  created_at  timestamptz not null default now(),
  unique (booking_id, cleaner_id)
);

-- ============================================================
-- JOB PHOTOS
-- ============================================================
create table public.job_photos (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  cleaner_id    uuid not null references public.cleaners(id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  cleaner_id  uuid not null references public.cleaners(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (booking_id, customer_id)
);

-- ============================================================
-- RECURRING PLANS
-- ============================================================
create table public.recurring_plans (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  cleaner_id  uuid references public.cleaners(id),
  cadence     text not null check (cadence in ('weekly', 'biweekly', 'monthly')),
  addons      jsonb not null default '[]',
  next_date   date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.cleaners        enable row level security;
alter table public.properties      enable row level security;
alter table public.bookings        enable row level security;
alter table public.job_offers      enable row level security;
alter table public.job_photos      enable row level security;
alter table public.reviews         enable row level security;
alter table public.recurring_plans enable row level security;

-- Helper: get current user's role
create or replace function public.current_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: get current user's cleaner id
create or replace function public.current_cleaner_id()
returns uuid language sql security definer as $$
  select id from public.cleaners where user_id = auth.uid();
$$;

-- PROFILES policies
create policy "Users can read own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

-- CLEANERS policies
create policy "Cleaners can read own cleaner row"
  on public.cleaners for select using (user_id = auth.uid());

create policy "Admins can manage cleaners"
  on public.cleaners for all using (public.current_role() = 'admin');

-- PROPERTIES policies
create policy "Customers can read own properties"
  on public.properties for select using (customer_id = auth.uid());

create policy "Customers can insert own properties"
  on public.properties for insert with check (customer_id = auth.uid());

create policy "Customers can update own properties"
  on public.properties for update using (customer_id = auth.uid());

-- BOOKINGS policies
create policy "Customers can read own bookings"
  on public.bookings for select using (customer_id = auth.uid());

create policy "Customers can insert own bookings"
  on public.bookings for insert with check (customer_id = auth.uid());

create policy "Cleaners can read assigned bookings"
  on public.bookings for select
  using (assigned_cleaner_id = public.current_cleaner_id());

create policy "Cleaners can update assigned bookings"
  on public.bookings for update
  using (assigned_cleaner_id = public.current_cleaner_id());

-- JOB OFFERS policies
create policy "Cleaners can read offers sent to them"
  on public.job_offers for select
  using (cleaner_id = public.current_cleaner_id());

create policy "Cleaners can update own offers"
  on public.job_offers for update
  using (cleaner_id = public.current_cleaner_id());

-- JOB PHOTOS policies
create policy "Customers can read photos for own bookings"
  on public.job_photos for select
  using (
    booking_id in (select id from public.bookings where customer_id = auth.uid())
  );

create policy "Cleaners can insert photos for assigned bookings"
  on public.job_photos for insert
  with check (cleaner_id = public.current_cleaner_id());

create policy "Cleaners can read own photos"
  on public.job_photos for select
  using (cleaner_id = public.current_cleaner_id());

-- REVIEWS policies
create policy "Customers can insert own reviews"
  on public.reviews for insert with check (customer_id = auth.uid());

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

-- RECURRING PLANS policies
create policy "Customers can manage own recurring plans"
  on public.recurring_plans for all using (customer_id = auth.uid());

create policy "Cleaners can read own recurring plans"
  on public.recurring_plans for select
  using (cleaner_id = public.current_cleaner_id());

-- ============================================================
-- STORAGE BUCKET: job-photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict do nothing;

create policy "Cleaners can upload job photos"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and auth.role() = 'authenticated'
  );

create policy "Customers can view own job photos"
  on storage.objects for select
  using (bucket_id = 'job-photos' and auth.role() = 'authenticated');

-- ============================================================
-- HELPER RPC
-- ============================================================
create or replace function public.increment_jobs_completed(cleaner_id uuid)
returns void language sql security definer as $$
  update public.cleaners
  set jobs_completed = jobs_completed + 1
  where id = cleaner_id;
$$;
