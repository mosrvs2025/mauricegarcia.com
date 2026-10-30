import Link from "next/link";
import { linkedInUrl, site } from "@/lib/site";

export function Footer() {
  const linkedin = linkedInUrl();
  return (
    <footer className="j-footer">
      <div className="studio-wrap j-footer-grid">
        <div>
          <p className="display j-footer-mark">Maurice Garcia</p>
          <p>Experience Engineer, creative technologist and independent builder.</p>
          <p className="j-muted">© {new Date().getFullYear()} Maurice Garcia</p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow">Read &amp; follow</p>
          <ul>
            <li><Link href="/projects">Projects</Link></li>
            <li><Link href="/learn">Learn</Link> · <a href="/learn/rss.xml" data-track="feed_click" data-track-feed="learn">RSS</a></li>
            <li><Link href="/writing">Writing</Link> · <a href="/writing/rss.xml" data-track="feed_click" data-track-feed="writing">RSS</a></li>
            <li><Link href="/updates">Updates</Link> · <a href="/updates/rss.xml" data-track="feed_click" data-track-feed="updates">RSS</a></li>
            <li><Link href="/now">Now</Link></li>
          </ul>
        </nav>
        <nav aria-label="Work with me">
          <p className="eyebrow">Work with me</p>
          <ul>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/lab">Design lab</Link></li>
            <li><Link href="/v/game">Game version</Link></li>
            <li><Link href="/coaching">AI tools coaching</Link></li>
            <li><Link href="/ai-receptionist">AI receptionist pilots</Link></li>
            <li><Link href="/shop">Shop</Link></li>
          </ul>
        </nav>
        <nav aria-label="Elsewhere">
          <p className="eyebrow">Say hello</p>
          <ul>
            <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><Link href="/connect">Contact form</Link></li>
            <li><a href={site.github}>GitHub</a></li>
            <li><a href={site.instagram}>Instagram</a></li>
            {linkedin ? <li><a href={linkedin}>LinkedIn</a></li> : null}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
