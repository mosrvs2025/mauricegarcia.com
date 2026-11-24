# PROJECT_STATUS

Personal site and public product lab for Maurice Garcia: portfolio, three switchable identities, and a products page for live demos.

- **Live URL(s):** [https://www.mauricegarcia.com](https://www.mauricegarcia.com), [https://www.mauricegarcia.com/products](https://www.mauricegarcia.com/products), [https://www.mauricegarcia.com/projects/ultron](https://www.mauricegarcia.com/projects/ultron). Live product hosts: [risklab.mauricegarcia.com](https://risklab.mauricegarcia.com), [leads.mauricegarcia.com](https://leads.mauricegarcia.com), [disputes.mauricegarcia.com](https://disputes.mauricegarcia.com), [radar.mauricegarcia.com](https://radar.mauricegarcia.com). Ultron dashboard: [https://ultron-moslab.vercel.app](https://ultron-moslab.vercel.app) (Discord login).
- **Current phase:** Live on Vercel (Next.js). Workshop (classic) is the default look; SOFTWORKS, MERCURY and PARALLAX stay switchable. MERCURY and PARALLAX use the pre-redesign looks. The intro is opt-in only (`?intro=1`). The `/products` page is live and links the four custom-domain demos plus Is This Bullshit?, ScopeCanvas, CaseCanvas, and AgentLatch. The `/projects/ultron` page now links the live dashboard (Vercel, Discord login; bot worker on Northflank; Postgres on Neon) and no longer describes Ultron as an unhosted prototype.
- **Assigned builders:** Claude Code shipped the SOFTWORKS redesign. Gemini via Antigravity produced a comparison redesign that was not shipped. Site follow-ups (shared headline, Softworks-first visit, products page, DNS) were handled as routine ops.
- **Open PRs:** [Draft #18](https://github.com/mosrvs2025/mauricegarcia.com/pull/18) — Vercel Web Analytics install (opened by Vercel, still a draft).
- **Known blockers:** None for the four product subdomains; they serve HTTPS 200, and the products page uses those custom-domain demo links.
- **Next actions:** Leave draft #18 until someone decides whether to enable Web Analytics.
- **Last updated:** November 23, 2026
