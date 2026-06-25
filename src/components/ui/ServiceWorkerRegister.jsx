"use client";
import { useEffect } from "react";
import { toast } from "@/components/ui/Toast";

// Registers the PWA service worker once on the client (production-safe). When a
// new worker is installed while one is already controlling the page, we surface
// an "updated" toast and reload as soon as the new worker takes control, so a
// fresh deploy is picked up without a manual hard refresh.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              // A new version is ready and we're already controlled by an old
              // one → this is an update (not the first install).
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                toast.info("✨ Kiiya was updated — refreshing for the latest…");
              }
            });
          });
        })
        .catch(() => {
          /* registration is best-effort */
        });
    };

    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  return null;
}
