# Denials Doctor Deployment Worklog

---
Task ID: 1
Agent: Main Agent
Task: Push code to GitHub and deploy to both versions of the app (denialsdoctor + dharma denials doctor)

Work Log:
- Located project directories: /home/z/my-project/denial-doctor-app and /home/z/my-project/dharma-denial-doctor
- Confirmed CSV Normalizer code already pushed to both GitHub repos
- Fixed commit author email (denialsdoctor@gmail.com → sriraajj@gmail.com) to match GitHub account
- Discovered Vercel deployments were failing for main app (dharma was succeeding)
- Root cause #1: vercel-build script used DATABASE_URL=file:./db/custom.db (doesn't exist on Vercel)
- Root cause #2: Next.js 16 Turbopack requires turbopack config when webpack config is present
- Fixed vercel-build script: changed to "prisma generate && next build"
- Added "postinstall": "prisma generate" to package.json
- Replaced webpack config in next.config.ts with turbopack: {} for Next.js 16 compatibility
- Pushed fixes to GitHub → Vercel auto-deploy succeeded
- Both apps now LIVE with latest code including CSV Normalizer Layer

Stage Summary:
- ✅ Denials Doctor: https://denial-doctor.vercel.app (LIVE, latest code)
- ✅ Dharma Denial Doctor: https://dharma-denial-doctor.vercel.app (LIVE, latest code)
- ✅ denialsdoctor.com: https://denialsdoctor.com (LIVE, Cloudflare proxy)
- ✅ GitHub repos: sriraajj-lab/denial-doctor + sriraajj-lab/dharma-denial-doctor (latest)
- ⏳ Turso env vars (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN) need to be set on Vercel dashboard

---
Task ID: 1
Agent: Main Agent
Task: Continue Rajesh Kantubhukta job search - find new opportunities, create tailored materials, submit applications, and upload to job portals

Work Log:
- Searched web extensively for remote RCM Director/VP-level jobs for India-based candidate with AI experience
- Found 8 new companies beyond the original 6: Genesis Orthopedics, CorroHealth, 25Madison, FreeHealth.ai, RethinkFirst, US Urology Partners, Huron Consulting, AKASA
- Also found Freenome (VP RCM on Greenhouse) and NIVA Health (RCM Manager on Workable)
- Created 8 tailored resume PDFs + 8 tailored cover letter PDFs (16 documents total)
- Each document includes rajeshkantubhukta.github.io personal story link
- Submitted applications via browser automation to:
  - Genesis Orthopedics (Workable) - SUCCESS
  - Freenome VP RCM (Greenhouse) - SUCCESS
  - NIVA Health RCM Manager (Workable) - SUCCESS
- Identified 6 companies requiring manual application (Workday/custom forms)
- Created comprehensive Job Application Tracker DOCX
- Uploaded all materials to GoFile for external download

Stage Summary:
- 3 new applications submitted (Genesis, Freenome, NIVA Health) + 3 previous (HealthRecon x3) = 6 total submitted
- 6 manual applications documented with direct URLs and instructions
- 25Madison and FreeHealth.ai jobs found to be closed
- GoFile link: https://gofile.io/d/uDWkkm
- Tracker document: /home/z/my-project/download/Rajesh_Kantubhukta_Job_Application_Tracker_May2026.docx
