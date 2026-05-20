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
