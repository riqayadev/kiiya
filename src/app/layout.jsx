import { Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toast";
import AchievementToaster from "@/components/ui/AchievementToast";
import NavigationProgress from "@/components/ui/NavigationProgress";
import ServiceWorkerRegister from "@/components/ui/ServiceWorkerRegister";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata = {
  metadataBase: new URL("https://kiiya.vercel.app"),
  title: {
    default: "Kiiya — Life Event Planner",
    template: "%s | Kiiya",
  },
  description:
    "Plan and remember your most important life moments — trips, weddings, milestones, and more.",
  keywords: [
    "life event planner",
    "trip planner",
    "wedding planner",
    "milestone tracker",
  ],
  authors: [{ name: "Kiiya" }],
  creator: "Kiiya",
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
    type: "website",
    locale: "en_US",
    url: "https://kiiya.vercel.app",
    siteName: "Kiiya",
    title: "Kiiya — Life Event Planner",
    description: "Plan and remember your most important life moments.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Kiiya" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiiya — Life Event Planner",
    description: "Plan and remember your most important life moments.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://tikssidjxhemwavgbbya.supabase.co"
        />
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
