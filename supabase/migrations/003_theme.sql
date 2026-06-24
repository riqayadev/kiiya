-- ═══════════════════════════════════════
-- 003_theme.sql
-- Adds a per-user light/dark/system theme preference.
-- Safe to run repeatedly (IF NOT EXISTS + idempotent constraint guard).
--
-- Cara pakai: buka Supabase SQL Editor → paste isi file ini → Run.
-- ═══════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'light'
  CHECK (theme_mode IN ('light', 'dark', 'system'));
