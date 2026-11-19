# PROJECT_STATUS

Personal site and public product lab for Maurice Garcia: portfolio, three switchable identities, and a products page for live demos.

- **Live URL(s):** [https://www.mauricegarcia.com](https://www.mauricegarcia.com), [https://www.mauricegarcia.com/products](https://www.mauricegarcia.com/products). Planned product hosts (DNS and certificates still pending as of this update): risklab.mauricegarcia.com, leads.mauricegarcia.com, disputes.mauricegarcia.com, radar.mauricegarcia.com.
- **Current phase:** Live on Vercel (Next.js). SOFTWORKS is the default identity; MERCURY and PARALLAX use the pre-redesign looks. The intro is opt-in only (`?intro=1`). The `/products` page is live and links the four live demos plus Is This Bullshit?, with ScopeCanvas, CaseCanvas, and AgentLatch marked coming soon.
- **Assigned builders:** Claude Code shipped the SOFTWORKS redesign. Gemini via Antigravity produced a comparison redesign that was not shipped. Site follow-ups (shared headline, Softworks-first visit, products page, DNS) were handled as routine ops.
- **Open PRs:** [Draft #18](https://github.com/mosrvs2025/mauricegarcia.com/pull/18) — Vercel Web Analytics install (opened by Vercel, still a draft).
- **Known blockers:** The four product subdomains have CNAMEs at the registrar, but DNS and Vercel certificates are not ready yet. Visitors fall back to the vercel.app demo URLs on the products page until that completes.
- **Next actions:** Confirm the four subdomains serve HTTPS, then drop the fallbacks if the custom hosts stay healthy. Leave draft #18 until someone decides whether to enable Web Analytics.
- **Last updated:** November 19, 2026
