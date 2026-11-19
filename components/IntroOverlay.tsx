/**
 * Markup for the optional intro. It is always in the server HTML but stays display:none unless the inline
 * boot script (lib/motion.ts) adds `mg-intro-on` to <html> for an explicit `?intro=1` visit, so it costs
 * nothing on an ordinary first visit, with scripts off, or on pages that opt out. All motion is CSS; there
 * is no client JavaScript in this component.
 */
import { BlackHole } from "./BlackHole";

export function IntroOverlay() {
  return (
    <div id="mg-intro" aria-hidden="true">
      <div className="b b3" />
      <div className="b b2" />
      <div className="b b1">
        <i className="swallow" />
        <BlackHole />
        <span className="word">mg<b>✳</b></span>
      </div>
    </div>
  );
}
