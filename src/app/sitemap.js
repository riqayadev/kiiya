// Only public, indexable routes belong here — dashboard/planning/calendar/
// profile are private user data and are excluded (and Disallow'd in robots.txt).
export default function sitemap() {
  const now = new Date();
  return [
    {
      url: "https://kiiya.vercel.app",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://kiiya.vercel.app/login",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://kiiya.vercel.app/register",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
