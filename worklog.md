---
Task ID: 1
Agent: Main
Task: Fix "Failed to generate health scan" error in Denials Doctor + Job applications

Work Log:
- Analyzed user error screenshot showing "Failed to generate health scan" on Denial Report upload page
- Identified root cause: upload-view.tsx sends FormData (CSV file) to /api/health-scan, but the API route expects JSON with clientName/totalClaimsSubmitted — NO CSV processing existed
- Built CSV Normalizer Layer (/src/lib/csv-normalizer.ts) — 700+ lines supporting 10 billing software formats
- Rewrote /api/health-scan/route.ts to handle both FormData CSV uploads AND existing JSON requests
- Added addDenials() function to /src/lib/data.ts for CSV import
- Updated upload-view.tsx with format auto-detection feedback and supported billing systems UI
- Fixed pre-existing TS error (setCurrentView not destructured in OverviewScanView)
- Also completed job applications via browser automation: 3 HealthRecon Connect applications submitted

Stage Summary:
- NEW FILE: /src/lib/csv-normalizer.ts — Normalizer Layer supporting eClinicalWorks, Epic, Athenahealth, Cerner, AdvancedMD, Kareo, Waystar, Availity, DrChrono, Generic ERA 835
- MODIFIED: /src/app/api/health-scan/route.ts — Now accepts FormData with CSV + uses normalizer
- MODIFIED: /src/lib/data.ts — Added addDenials() function + codeType/practiceType in mapDenialFromDB
- MODIFIED: /src/components/upload-view.tsx — Shows detected format info, billing systems list, better error messages
- Job apps submitted: HealthRecon AVP RCM, Country Manager RCM, Denials Manager (3 applications confirmed)
