import { Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toast";
import AchievementToaster from "@/components/ui/AchievementToast";
import NavigationProgress from "@/components/ui/NavigationProgress";
import ServiceWorkerRegister from "@/components/ui/ServiceWorkerRegister";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  metadataBase: new URL("https://kiiya.vercel.app"),
  title: "Kiiya — Life Event Planner",
  description:
    "Plan, live, and remember every chapter of your story. From dream trips to wedding days — Kiiya helps you plan any life event.",
  keywords:
    "life event planner, trip planner, wedding planner, travel planning, event management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kiiya",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Kiiya — Life Event Planner",
    description: "Plan, live, and remember every chapter of your story.",
    url: "https://kiiya.vercel.app",
    siteName: "Kiiya",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiiya — Life Event Planner",
    description: "Plan, live, and remember every chapter of your story.",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  themeColor: "#7C6EF5",
  width: "device-width",
  initialScale: 1,
};

// Runs before paint to set the `dark` class from the stored preference,
// preventing a light→dark flash on first load.
const themeScript = `(function(){try{var t=localStorage.getItem('kiiya_theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <NavigationProgress />
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster />
        <AchievementToaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
