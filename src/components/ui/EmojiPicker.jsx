"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Loading placeholder sized to roughly match the emoji-mart picker, so the
// surrounding modal layout doesn't jump while the chunks stream in.
function PickerSkeleton() {
  return (
    <div className="flex h-[350px] w-full items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C6EF5] border-t-transparent" />
    </div>
  );
}

// @emoji-mart/react's default export IS the Picker component. Dynamic + ssr:false
// keeps the ~75KB picker out of every initial bundle (it uses browser APIs).
const Picker = dynamic(() => import("@emoji-mart/react"), {
  ssr: false,
  loading: () => <PickerSkeleton />,
});

/**
 * Lazily-loaded emoji picker. Both the picker component (@emoji-mart/react,
 * ~75KB) and its dataset (@emoji-mart/data, ~465KB) are code-split and only
 * fetched the first time a picker is actually rendered — they no longer ship
 * in the initial bundles of /planning, /calendar or /wishlist.
 *
 * Accepts the same props as the underlying emoji-mart Picker (onEmojiSelect,
 * theme, locale, previewPosition, …) — `data` is injected here.
 */
export default function EmojiPicker(props) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    import("@emoji-mart/data")
      .then((mod) => {
        if (active) setData(mod.default);
      })
      .catch(() => {
        // Dynamic chunk failed to load (offline / network) — leave the
        // placeholder visible rather than throw an unhandled rejection.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <PickerSkeleton />;
  return <Picker data={data} {...props} />;
}
