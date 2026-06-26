export function formatRupiah(amount) {
  if (!amount) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return "";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const options = { day: "numeric", month: "short", year: "numeric" };
  if (!end || start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-GB", options);
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", options)}`;
  }
  return `${start.toLocaleDateString("en-GB", options)} – ${end.toLocaleDateString("en-GB", options)}`;
}

export function formatDateShort(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "afternoon";
  if (hour >= 15 && hour < 18) return "evening";
  return "night";
}
