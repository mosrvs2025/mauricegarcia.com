"use client";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/** Reports one `post_read` when the reader reaches the end of the article. No scroll tracking beyond that. */
export function ReadSignal({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { track("post_read", { post: slug }); io.disconnect(); } });
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);
  return <div ref={ref} aria-hidden="true" />;
}
