import { Settings as SettingsIcon } from "lucide-react";
import { useLang } from "../hooks/useLang";
import { t } from "../utils/i18n";
import AppLayout from "../components/layout/AppLayout";

export default function Settings() {
  useLang();
  return (
    <AppLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-kiiya-primary">
          <SettingsIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-kiiya-dark">
          {t("dashboard.nav.settings")}
        </h1>
        <p className="mt-2 text-gray-500">Coming Soon</p>
      </div>
    </AppLayout>
  );
}
