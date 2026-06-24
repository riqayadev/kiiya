# Kiiya — Supabase Schema (Phase 1 MVP)

This folder holds the database schema for Kiiya's Life Event Planner.

## How to apply

> **Run this file in the Supabase SQL Editor.**

1. Open your project at [app.supabase.com](https://app.supabase.com) → **SQL Editor**.
2. Click **New query**, paste the full contents of [`schema.sql`](./schema.sql).
3. Click **Run**. All tables, triggers, functions, RLS policies, and indexes are created in one pass.

> ⚠️ Run `schema.sql` **once** on a fresh project. It uses bare `CREATE TABLE` /
> `CREATE POLICY` / `CREATE TRIGGER` statements (no `IF NOT EXISTS` / `DROP`), so
> re-running it on an existing database will error on the already-created objects.

## Conventions

Every table follows the same rules:

- **UUID primary keys** — `profiles.id` mirrors `auth.users.id`; all other tables default to `uuid_generate_v4()`.
- **Timestamps** — `created_at` + `updated_at` (both `TIMESTAMPTZ DEFAULT NOW()`). `updated_at` is auto-bumped by the shared `update_updated_at()` trigger on every `UPDATE`.
- **Row Level Security** — enabled on every table. Policies are scoped so a user can only reach **their own data**, resolved through `auth.uid()`.
- **Money** — stored as `BIGINT` in the smallest currency unit (e.g. Rupiah), never floats. Default currency `IDR`.

## Tables

| Table | Purpose | Owner key | Cascade |
|---|---|---|---|
| `profiles` | One row per auth user (name, avatar, preferred language). Auto-created on signup. | `id = auth.users.id` | Deleted when the auth user is deleted |
| `events` | Core table — every life event (trip, wedding, anniversary, babymoon, graduation, custom). | `user_id` | Deleted with the user |
| `event_members` | Collaboration — invite people to an event by email with a role + invite status. | via parent `events` | Deleted with the event |
| `itinerary_days` | The days that make up an event (day 1, day 2, …). Unique per `(event_id, day_number)`. | via parent `events` | Deleted with the event |
| `itinerary_activities` | Activities inside a day (transport, food, activity, …) with times and estimated cost. | via parent `events` | Deleted with the day **and** the event |
| `expenses` | Real-time spending per event, optionally linked to an activity. | `user_id` (+ event scope) | Deleted with the user/event |
| `checklists` | Packing list / to-do items per event. | via parent `events` | Deleted with the event |

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | FK → `auth.users(id)` |
| `full_name` | TEXT | from signup metadata |
| `avatar_url` | TEXT | |
| `preferred_lang` | TEXT | `'en'` \| `'id'`, default `'en'` |

Auto-creation: the `handle_new_user()` function (a `SECURITY DEFINER` trigger on `auth.users`) inserts a profile row right after signup, pulling `full_name` / `avatar_url` from `raw_user_meta_data`.

### `events`
Key columns: `title`, `type` (6 allowed values), `status` (`upcoming` / `ongoing` / `completed` / `archived`), `cover_emoji` (default ✨), `cover_image_url`, `start_date`, `end_date`, `location`, `budget` (BIGINT), `currency` (default `IDR`), `is_private` (default `true`).

### `event_members`
`role` ∈ `owner` / `editor` / `viewer`; `status` ∈ `pending` / `accepted` / `declined`. `user_id` is nullable (`ON DELETE SET NULL`) so a pending invite can exist before the invitee has an account — it's matched by `email`.

### `itinerary_days` → `itinerary_activities`
A day belongs to an event; an activity belongs to both a day and (denormalized) its event, so RLS and cascade deletes resolve cleanly. `category` ∈ transport / accommodation / food / activity / shopping / other / general.

### `expenses`
Linked to an event and the spending user, optionally to an `activity_id` (`ON DELETE SET NULL` so deleting an activity keeps its expense record). `category` ∈ transport / accommodation / food / activity / shopping / other.

### `checklists`
Simple per-event to-do/packing items with `is_completed`, `category`, and `sort_order`.

## RLS policy summary

| Table | Read | Write |
|---|---|---|
| `profiles` | own row (`auth.uid() = id`) | insert/update own row |
| `events` | own (`auth.uid() = user_id`) | insert/update/delete own |
| `event_members` | event owner **or** existing members | event owner manages (`FOR ALL`) |
| `itinerary_days` | event owner (`FOR ALL`) | event owner |
| `itinerary_activities` | event owner (`FOR ALL`) | event owner |
| `expenses` | anyone scoped to the event | insert/update/delete own (`auth.uid() = user_id`) |
| `checklists` | event owner (`FOR ALL`) | event owner |

## Indexes

Foreign-key and filter columns are indexed for dashboard queries: `events(user_id)`, `events(status)`, `events(type)`, `itinerary_days(event_id)`, `itinerary_activities(day_id)`, `expenses(event_id)`, `checklists(event_id)`, `event_members(event_id)`.

## Notes / future hardening

- The current child-table policies (`itinerary_days`, `itinerary_activities`, `checklists`, and the expense/member read policies) grant access to the **event owner** (`events.user_id`). They do **not** yet extend collaborative write access to accepted `event_members` — that's a Phase 2 concern once collaboration ships.
- `event_members` SELECT policy references `event_members` within its own subquery. If Postgres reports recursion on that policy, refactor the membership check into a `SECURITY DEFINER` helper function and call it from the policy.
