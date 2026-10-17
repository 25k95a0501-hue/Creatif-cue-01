# Creatif Cue — Phase 1: Navbar + Hero

Responsive Next.js prototype inspired by the editorial layout and interaction patterns of MadeByShape. All project artwork is original CSS-based placeholder design; **no MadeByShape client imagery or website assets are included**.

## Run locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production check:

Development outputs use `.next-dev`; production outputs use `.next`, so a build
does not overwrite the running development server's cache. Run one development
server per checkout. If a generated cache becomes stale, stop that server before
removing `.next-dev`, then restart it. On Windows PowerShell, use `npm.cmd` if
the execution policy blocks `npm.ps1`.

```bash
npm run build
npm start
```

## Integrate into your existing Next.js repository

Copy `components/Navbar.tsx`, `components/Hero.tsx`, and the styles from `app/globals.css` into the matching folders in your project. Install `gsap` and `lucide-react`. Merge the sample metadata and layout as needed. If you already use Tailwind, these CSS classes can coexist with Tailwind.

## Included

- Floating pill navigation with scroll-dependent shadow and positioning
- Keyboard-accessible mobile drawer, real in-page anchor links
- Functional site-wide light/dark toggle
- Oversized editorial hero heading and reveal sequence powered by GSAP
- Portfolio collage with custom animated CSS artwork and hover responses
- Responsive tablet and mobile compositions
- Scroll targets for Work, About, Services, Contact (the latter three are intentionally minimal section placeholders)
- Reduced motion support; page metadata

## Before launch

1. Replace the text treatment `creatifcue.` with your **original exact logo SVG**.
2. Confirm your actual logo colors and update the provisional CSS theme tokens.
3. Configure the server-side contact delivery and rate-limit environment variables described below; neither service is configured by default.
4. Replace all collage tiles with **your own portfolio imagery and real project links**.
5. Add your real services, approved copy, business information, and privacy information.
6. Test Lighthouse, accessibility, and analytics before publishing.

## Contact enquiry delivery

The `/contact` form validates submissions on the server and sends them through
Resend only when delivery is configured. Without the delivery variables, the API
returns an explicit unavailable response; it does not store or claim to send
enquiries. The browser never receives the Resend API key.

Set these variables in the server environment (never in `NEXT_PUBLIC_*`):

- `RESEND_API_KEY` — server-side Resend API key.
- `CONTACT_TO_EMAIL` — verified inbox that should receive enquiries.
- `CONTACT_FROM_EMAIL` — sender address on a domain verified with Resend.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST
  credentials for the shared production rate limit (five requests per
  connection per 15 minutes).

Production submissions fail closed when the shared rate-limit store is missing
or unavailable. Local development uses a process-local limiter; its counts do
not carry across restarts or multiple server instances.

## Chat project enquiry handoff

Cue keeps a guided enquiry in component state until the visitor chooses
**Continue to Contact**. That action writes a versioned draft to
`sessionStorage` for up to 15 minutes and navigates to `/contact`; it does not
submit the enquiry. The contact page reads and removes the draft on its first
client load, prefills the existing name, email, phone, and editable message
fields, and leaves the required privacy-consent checkbox unchecked. Expired or
invalid drafts are removed without being used. The visitor must review the
form, provide consent, and explicitly submit it through the existing contact
handler.

The temporary draft schema, expiry, project choices, and indicative budget
ranges are centralized in `lib/chatbot/projectEnquiry.ts`. The budget options
are for enquiry context only, not quoted prices or minimum fees. Personal
details are not placed in the URL or saved in `localStorage`.

## Cue AI assistant

Cue uses the server-side OpenAI Responses API route at `/api/chat`. Install
dependencies, copy `.env.example` to `.env.local` (PowerShell:
`Copy-Item .env.example .env.local`), and set `OPENAI_API_KEY`.
Optionally set `OPENAI_MODEL`; it defaults to `gpt-4.1-mini`, a lower-cost text
model. The key is read only on the server and must never use a `NEXT_PUBLIC_`
prefix. Without a key, Cue clearly identifies itself as a rule-based guide and
uses `lib/chatbot/knowledge.ts` and the local response matcher instead.

The AI endpoint accepts at most eight recent messages of up to 1,500 characters
each, limits input body size to 12 KB and output to 400 model tokens, disables
provider response storage, times out after 20 seconds, and limits each visitor
IP to 20 requests per 15 minutes. Production AI requests require
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; without the persistent
rate-limit store the AI route fails closed. Local development uses an
in-memory limiter. Configure usage budgets, model-specific spend limits and
alerts in the OpenAI project dashboard as well as the application limits above.
Requests and provider failures do not log chat contents.

The interface reports **AI mode configured** when a server key is present,
not that the key has been authenticated. It reports an AI connection only
after a successful Responses API reply. A real authenticated test requires
valid deployment credentials and is not performed by the production build.

## Scope

This package implements phase 1 only (navbar + hero). The remaining page sections are lightweight anchor targets, not completed pages. Font files are not bundled; Google Fonts load online with local fallbacks.
