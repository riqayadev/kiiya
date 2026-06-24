-- ═══════════════════════════════════════
-- 002_additions.sql
-- Tambahan kolom untuk: profile lengkap, theme, PIN, notifikasi,
-- cover image event. Aman dijalankan berulang (IF NOT EXISTS).
--
-- Cara pakai: buka Supabase SQL Editor → paste isi file ini → Run.
-- ═══════════════════════════════════════

-- ── Profile additions ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'violet';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"email": true, "push": true}'::jsonb;

-- ── Event cover image ──────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ── (Opsional) Storage bucket untuk avatar ─────────────────
-- Profile page upload foto ke bucket "avatars". Buat bucket publik:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;
