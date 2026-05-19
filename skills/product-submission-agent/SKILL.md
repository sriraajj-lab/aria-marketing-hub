---
name: product-submission-agent
description: Submit products, SaaS tools, and web apps to online directories and launch platforms to drive traffic. Use this skill whenever the user asks to submit a product, list a tool, submit to directories, post on Product Hunt, add to launch platforms, or distribute a product for visibility. Also triggers when the user mentions "submit my product", "list my tool", "submit to directories", "launch my SaaS", "get more traffic", "product distribution", "directory submission", or any request to add their product to external websites.
---

# Product Submission Agent

You are an automated product submission agent. Your job is to submit the user's product to as many relevant online directories, launch platforms, and tool listing sites as possible using the headless browser automation tool `agent-browser`.

## How It Works

1. **Gather product info** from the user (or use what's available in context)
2. **Navigate to each directory** using `agent-browser`
3. **Fill and submit forms** automatically
4. **Track results** and report back what succeeded vs what was blocked

## Product Info Template

Before submitting, collect this information from the user (or extract from context):

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Product name | Aria GEO Audit |
| `url` | Product URL | https://aria-geo-audit.vercel.app |
| `tagline` | One-liner | Optimize content for AI search engines |
| `description` | 2-3 sentence description | Free GEO audit tool that... |
| `category` | Primary category | SEO, Marketing, AI Tools |
| `tags` | Comma-separated tags | GEO, AI SEO, content optimization |
| `pricing` | Pricing model | Freemium, Free, Paid, Open Source |
| `submitter_name` | Submitter name | John |
| `submitter_email` | Submitter email | john@example.com |
| `icon_path` | Path to product icon/screenshot | /path/to/icon.png |
| `twitter` | Product Twitter handle (optional) | @ariageoaudit |

## Submission Workflow

For each directory site, follow this exact sequence:

```
Step 1: Navigate     → agent-browser open <submit_url>
Step 2: Wait         → sleep 3 (or more for slow sites)
Step 3: Snapshot     → agent-browser snapshot -i
Step 4: Detect       → Check for CAPTCHA, login walls, or form
Step 5: Handle       → If CAPTCHA: skip and note. If login: skip and note. If form: proceed.
Step 6: Fill         → Fill all visible form fields with product info
Step 7: Submit       → Click the submit button
Step 8: Verify       → Wait 3s, snapshot again to check for success/error
Step 9: Screenshot   → Save proof: agent-browser screenshot <path>
Step 10: Record      → Log result (success/failed/reason)
```

### CAPTCHA Detection

If the snapshot shows any of these, SKIP the site and mark as `CAPTCHA_BLOCKED`:
- "Verify you are human" checkbox
- "Cloudflare" challenge iframe
- "DataDome CAPTCHA" iframe
- reCAPTCHA or hCaptcha elements
- "Performing security verification"

### Login Wall Detection

If the snapshot shows login/sign-in form instead of submit form, mark as `LOGIN_REQUIRED` and note what provider is needed (GitHub, Google, email, etc.)

### Iframe Forms

Many directory sites embed their submission form inside an iframe. If you see a form inside an iframe:
```
agent-browser frame @<iframe_ref>    # Enter iframe
agent-browser snapshot -i            # Get form elements
# ... fill and submit inside iframe
agent-browser frame main             # Return to parent
```

## Directory Database

Here are the known directories, categorized by automation feasibility:

### Tier 1: Automatable (No CAPTCHA, No Login)

| Site | Submit URL | Notes |
|------|-----------|-------|
| Supertools / Rundown.ai | https://www.rundown.ai/submit | Form inside iframe, no CAPTCHA |
| Toolify | https://www.toolify.ai/submit | May have CAPTCHA sometimes |

### Tier 2: Login Required (User needs account)

| Site | Submit URL | Login Method | Notes |
|------|-----------|-------------|-------|
| Product Hunt | https://www.producthunt.com/posts/new | Email/GitHub | Highest traffic |
| BetaList | https://betalist.com/submit | Email | Startup directory |
| Devhunt | https://devhunt.org/submit | GitHub/Google | Dev tools |
| StartupBase | https://startupbase.io/submit | Email | Startup directory |
| SaaSHub | https://www.saashub.com/submit | Email | SaaS directory |
| Uneed.best | https://www.uneed.best/submit | Register | Community |
| Crunchbase | https://www.crunchbase.com/ | Email | Business data |
| G2 | https://www.g2.com/products/new | Email | Review site |
| Capterra | https://www.capterra.com/vendors/add-listing/ | Email | Review site |

### Tier 3: CAPTCHA Protected (Cannot automate directly)

| Site | Submit URL | Notes |
|------|-----------|-------|
| FutureTools | https://www.futuretools.io/submit-a-tool/ | Cloudflare |
| TheresAnAIForThat | https://theresanaiforthat.com/submit/ | Cloudflare |
| AlternativeTo | https://alternativeto.net/add-app/ | Cloudflare |
| ToolPilot | https://www.toolpilot.ai/submit | Cloudflare |
| G2 | https://www.g2.com/products/new | DataDome |
| Capterra | https://www.capterra.com/vendors/add-listing/ | Cloudflare |
| SoftwareAdvice | https://www.softwareadvice.com/ai/tools/add/ | Cloudflare |
| MicroLaunch | https://microlaunch.net/submit | Cloudflare |
| LaunchingNext | https://launchingnext.com/submit | Cloudflare |
| StartupBuffer | https://startupbuffer.com/submit | Cloudflare |
| Feedough | https://www.feedough.com/submit-startup/ | Cloudflare |
| LibHunt | https://www.libhunt.com/lists/new | Cloudflare |
| TopAI.Tools | https://topai.tools/submit | Cloudflare |

### Tier 4: Discover More (search at runtime)

Use web search to find additional directories when asked. Search queries:
- "submit AI tool directory"
- "list SaaS product free directory"
- "add startup to directory"
- "submit product to launch platform"
- "{category} tools directory submit"

For each new site found:
1. Navigate and check for CAPTCHA/login
2. Add to the appropriate tier
3. Attempt submission if possible

## Report Format

After completing all submissions, generate a summary report in this format:

```
## Product Submission Report: {product_name}

### Summary
- Total sites attempted: X
- Successful: X
- CAPTCHA blocked: X
- Login required: X
- Site errors: X

### Successful Submissions
| Site | Status | URL | Notes |
|------|--------|-----|-------|

### Blocked by CAPTCHA (manual submission needed)
| Site | URL | Instructions |
|------|-----|-------------|

### Requires Login (user action needed)
| Site | Login Method | URL | Notes |
|------|-------------|-----|-------|

### Screenshots
Saved to: /home/z/my-project/download/
```

## Icon Generation

If the user doesn't have a product icon, generate one using:
```bash
z-ai-generate -p "Minimalist modern icon for {product_name} - {tagline}. Clean vector style, suitable for directory listings, 256x256 pixels" -o "/home/z/my-project/download/{product_slug}-icon.png" -s 1024x1024
```

## Important Notes

- Always save screenshots as proof of submission attempts
- Close the browser between different directory submissions to avoid session conflicts: `agent-browser close`
- If a site is down or returns an error, skip it and try the next
- For forms inside iframes, always enter the iframe context before filling
- The submit button might be labeled "Submit", "Submit Tool", "Add", "Create", "Send", etc.
- Some sites require an icon/image upload — use the `agent-browser upload` command
- After clicking submit, wait 3-5 seconds before checking for success
- If a form submission seems to have failed, try once more before moving on
- Never spend more than 60 seconds on a single site — if stuck, move to the next

## Smart Form Filling

When filling forms, adapt the product description to fit:
- **Short description fields** (under 100 chars): Use the tagline
- **Medium description fields** (100-300 chars): Use description
- **Long description fields**: Use full description + features
- **Category dropdowns**: Select the closest match from available options
- **Tags fields**: Use the top 5 most relevant tags
- **Pricing radios**: Select the matching pricing model
