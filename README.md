# Hello World

An original English-teaching resource website built specifically for this repository. The design uses muted plum, lavender, warm beige, grey, and a lime accent.

## Run

Serve this directory with any static web server, for example `python3 -m http.server 8000`, then open http://localhost:8000. No dependencies or build step are required.

## Included

- Responsive landing page with semantic navigation and reduced-motion support
- Six original A1–C1 lessons with reading passages, speaking tasks, and answer keys
- Level/topic filters, text search, and browser-local favourites
- Template-based lesson planner with printable and downloadable plans
- Reading quiz, speaking prompts, timer, and vocabulary flashcards

The planner does not call an AI service. Accounts, billing, email delivery, and cross-device storage are not implemented. No analytics or tracking are installed. Google Fonts supplies typography; system fonts are used as fallbacks.

## Hosting

The root is ready for static hosting. For GitHub Pages, select **Settings → Pages → Deploy from a branch → main → /(root)**. No custom domain is configured.

## Validation

Run `node --check app.js` to check JavaScript syntax. Browser checks should cover search, filters, saving, lesson planning, quiz scoring, and mobile navigation.
