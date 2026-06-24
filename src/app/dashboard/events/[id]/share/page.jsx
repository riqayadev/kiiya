"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import { useEventDetail } from "@/hooks/useEventDetail";
import ShareableCard from "@/components/ui/ShareableCard";
import { toast } from "@/components/ui/Toast";

function diffDays(start, end) {
  if (!start) return 1;
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export default function ShareEventPage({ params }) {
  const detail = useEventDetail(params.id);
  const { event, checklist, loading, error } = detail;
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(
    () => ({
      days: diffDays(event?.start_date, event?.end_date),
      budget: event?.budget || 0,
      checklistCount: checklist.length,
    }),
    [event, checklist]
  );

  const renderCanvas = async () => {
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(cardRef.current, {
      scale: 1080 / 320, // upscale to ~1080px wide for IG Stories
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      const link = document.createElement("a");
      link.download = `${event?.title || "kiiya"}-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded!");
    } catch (e) {
      toast.error(e.message || "Could not generate card.");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "kiiya-card.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: event?.title,
          text: "Life happens. This is your story. — Kiiya",
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info("Sharing not supported here — link copied to clipboard.");
      }
    } catch (e) {
      if (e.name !== "AbortError") toast.error(e.message || "Share failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-kiiya-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error || !event) {
    return (
      <div className="mt-12 text-center">
        <p className="font-semibold text-kiiya-dark">Event not found</p>
        <Link href="/dashboard" className="mt-4 inline-block text-kiiya-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <Link
        href={`/dashboard/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-kiiya-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-kiiya-dark">
        Your Memory Card
      </h1>
      <p className="mt-1 text-gray-500">
        Share your completed event to Instagram Stories.
      </p>

      {/* Card preview */}
      <div className="mt-6 flex justify-center">
        <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-purple-100">
          <ShareableCard ref={cardRef} event={event} stats={stats} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={handleDownload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          Download Card
        </button>
        <button
          onClick={handleShare}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-5 py-3 font-semibold text-kiiya-primary transition hover:bg-purple-50 disabled:opacity-60"
        >
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>
    </div>
  );
}
