# Sweepr

On-demand home cleaning marketplace for the Denver metro. Customers get an instant flat-rate price from their address; background-checked cleaners receive job offers and get paid per completed job.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run the full schema from `supabase/schema.sql`.
3. Enable email auth in Authentication → Providers.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `RENTCAST_API_KEY` | [rentcast.io](https://rentcast.io) |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
  page.jsx               Landing page (marketing)
  book/page.jsx          5-step customer booking flow
  dashboard/page.jsx     Customer dashboard (active bookings, reviews)
  cleaner/page.jsx       Cleaner portal (offers, jobs, photo upload)
  api/
    property-lookup/     POST — RentCast address lookup
    bookings/            POST — create booking + fan out offers
    bookings/[id]/
      accept/            POST — cleaner accepts, others expired
      complete/          POST — cleaner marks job done

lib/
  pricing.js             Pure pricing engine (no side effects)
  supabase/
    client.js            Browser Supabase client
    server.js            Server Supabase client (cookie-based auth)

supabase/
  schema.sql             Full Postgres schema + RLS policies
```

### Data flow

1. **Customer** enters address → `/api/property-lookup` → RentCast returns sqft/beds/baths.
2. Customer picks add-ons, schedule → `/api/bookings` computes price server-side and creates a `booking` row + `job_offers` rows for every active cleared cleaner.
3. **Cleaner** sees offers in their portal → hits `/api/bookings/[id]/accept` → booking status becomes `matched`, all other offers expire.
4. Cleaner uploads photos (Supabase Storage `job-photos` bucket) → marks complete.
5. Customer leaves a star review.

### Pricing logic (`lib/pricing.js`)

| Component | Rate |
|---|---|
| Base price | $89 |
| Per sqft over 1,000 | +$0.05/sqft |
| Per bed over 2 | +$12/bed |
| Per bath over 1 | +$16/bath |
| Weekly recurrence discount | −15% |
| Bi-weekly discount | −10% |
| Monthly discount | −5% |
| Platform take rate | 25% |

## Phased roadmap

### Phase 1 — Booking flow (current)
- [x] Landing page with address lookup
- [x] 5-step booking flow with flat-rate pricing
- [x] Supabase auth (email/password)
- [x] Cleaner portal: offer acceptance, photo upload, job completion
- [x] Customer dashboard: booking status, cleaner info, reviews
- [ ] Email confirmation on booking + acceptance

### Phase 2 — Stripe Connect
- [ ] Stripe Connect onboarding for cleaners (Express accounts)
- [ ] Payment intent created at booking time (capture on match)
- [ ] Automatic payout to cleaner after job completion
- [ ] Refund on customer cancellation before match

### Phase 3 — Growth
- [ ] Twilio SMS alerts (booking confirmed, cleaner en route, job complete)
- [ ] Supabase Realtime for live booking status updates
- [ ] PWA manifest for cleaner mobile app
- [ ] Admin dashboard (booking overview, cleaner management, revenue)
- [ ] Recurring plan automation (auto-create next booking from `recurring_plans`)
