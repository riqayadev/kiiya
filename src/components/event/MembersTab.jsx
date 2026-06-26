"use client";
import { useState } from "react";
import { Crown, Pencil, Eye, UserPlus, Loader2, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import { toast } from "@/components/ui/Toast";

const ROLE_META = {
  owner: { icon: Crown, badge: "bg-amber-100 text-amber-700", labelKey: "owner" },
  editor: { icon: Pencil, badge: "bg-blue-100 text-blue-700", labelKey: "editor" },
  viewer: { icon: Eye, badge: "bg-gray-100 text-gray-600", labelKey: "viewer" },
};

const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
};

function initials(text) {
  return (text || "?").slice(0, 2).toUpperCase();
}

function MemberRow({ member, canRemove, onRemove }) {
  const role = ROLE_META[member.role] ?? ROLE_META.viewer;
  const RoleIcon = role.icon;
  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-2xl bg-[#FAFAF8] p-4 text-center dark:bg-[#252235]">
      {canRemove && (
        <button
          onClick={() => onRemove(member.id)}
          aria-label={t("members.remove")}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kiiya-primary to-kiiya-romantic text-sm font-bold text-white">
        {initials(member.email)}
      </div>
      <p className="w-full truncate font-jakarta text-sm font-semibold text-kiiya-dark dark:text-white">
        {member.email}
      </p>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${role.badge}`}
      >
        <RoleIcon className="h-3 w-3" />
        {t(`members.${role.labelKey}`)}
      </span>
      {member.status && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            STATUS_BADGE[member.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {t(`members.${member.status}`)}
        </span>
      )}
    </div>
  );
}

export default function MembersTab({
  members,
  currentUserEmail,
  addMember,
  removeMember,
}) {
  useLang();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addMember(email.trim(), role);
      setEmail("");
      setRole("viewer");
    } catch (err) {
      setError(err.message || "Failed to invite member.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]";

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
        <h3 className="mb-3 font-jakarta font-bold text-kiiya-dark dark:text-white">{t("members.invite")}</h3>
        <form
          onSubmit={handleInvite}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("members.emailPlaceholder")}
            className={`flex-1 ${inputCls}`}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`${inputCls} sm:w-36`}
          >
            <option value="editor">{t("members.editor")}</option>
            <option value="viewer">{t("members.viewer")}</option>
          </select>
          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {t("members.invite")}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Members list */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
        <h3 className="mb-4 font-jakarta font-bold text-kiiya-dark dark:text-white">{t("members.title")}</h3>
        {members.length === 0 && !currentUserEmail ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {t("members.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {/* Owner (current user) — always shown, never removable */}
            {currentUserEmail && (
              <MemberRow
                member={{
                  id: "owner",
                  email: currentUserEmail,
                  role: "owner",
                  status: "accepted",
                }}
                canRemove={false}
              />
            )}
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                canRemove={m.role !== "owner"}
                onRemove={(id) =>
                  removeMember(id).catch((e) => toast.error(e.message))
                }
              />
            ))}
          </div>
        )}
        {members.length === 0 && currentUserEmail && (
          <p className="mt-3 text-center text-xs text-gray-400">
            {t("members.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
