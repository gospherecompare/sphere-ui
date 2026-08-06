# Hooks Storefront — Complete Redesign Brief

## Objective

Transform Hooks from a collection of individually styled screens into one coherent product-discovery and editorial platform. The redesign keeps existing routes, APIs, filters, comparisons, publishing logic, and Git history intact while improving presentation, information hierarchy, accessibility, internal navigation, dark mode, and technical SEO.

## Repository audit

The review covered the application shell, route definitions, shared utilities, homepage modules, category listings, dormant laptop views, product details, comparison tools, popular comparisons, news/editorial views, company/legal pages, mobile navigation, schema generators, canonical utilities, and indexing verification scripts.

The source contains 130 JavaScript/JSX modules. The redesigned system is intentionally implemented through shared tokens and route-aware classes so large product/detail files inherit a consistent experience without duplicating styles or changing their data logic.

## Experience principles

1. **Decision first:** lead with compare, discover, price, trend, and editorial actions instead of decorative content.
2. **Dense but readable:** specifications remain detailed, while hierarchy, spacing, grouping, and sticky controls reduce scanning effort.
3. **Editorial confidence:** news presentation uses stronger story hierarchy, contextual summaries, and clearer routes back to products and comparisons.
4. **One visual system:** cards, forms, tables, filters, modals, breadcrumbs, navigation, and static pages share the same tokens.
5. **Theme parity:** light and dark modes are both first-class presentations and persist across sessions.
6. **SEO without stuffing:** titles are descriptive, canonical URLs are clean, and structured data is emitted only from real page data.

## Route and page updates

| Area | Improvements |
| --- | --- |
| Global shell | Route-aware presentation, persistent theme context, no-flash theme bootstrap, shared canvas, focus states, responsive behavior |
| Header | Refined wordmark, glass navigation, desktop/mobile theme controls, clearer action hierarchy |
| Homepage | Fully rebuilt with a centralized live-data layer, product stage, decision paths, trending bento, real brand index, launch timeline, budget intelligence board, comparison arena, editorial newsroom, and non-duplicative research directory |
| Product listings | Shared category hero, visual product-card system, elevated filters, clearer headings, responsive density for phones, TVs, networking, trending, and future laptop routes |
| Product details | Shared detail-page surface, improved specification cards, themed tables/forms, stronger visual grouping for phones, TVs, networking, and laptop templates |
| Compare | Stronger compare header, polished selector cards/modals, rounded action controls, clearer side-by-side purpose and share flow |
| Popular comparisons | Rebuilt editorial hero, stronger search/filter presentation, upgraded comparison cards |
| News | Newsroom hero, editorial artwork, retained story carousel/grid behavior, themed story cards and empty states |
| Breadcrumbs | Route-aware labels, product/article heading resolution, accessible current-page state, canonical links, BreadcrumbList JSON-LD |
| About | Rewritten mission, methodology, trust, revenue, and correction content with internal discovery links |
| Contact | Purpose-based contact channels, correction guidance, expected details, support routing |
| Privacy | Rewritten, structured policy with effective date, data categories, purposes, cookies, sharing, retention, rights, security, children, and updates |
| Terms | Rewritten usage, accuracy, pricing, affiliate, content, availability, responsible-use, liability, and change terms |
| Careers | Shared company-page presentation, clearer employer message, consistent metadata |
| 404 | Advanced themed recovery page with useful product and trend links |
| Footer | Product, comparison, editorial, and company link groups plus trust/clarity callout |

## Homepage live-data redesign

The homepage now has a dedicated provider (`HomeDataContext.jsx`) that makes each product request once and distributes unique data sets to its child sections. This prevents repeated network calls and repeated products across the page.

- Hero: one live trending product plus catalogue totals and search suggestions.
- Trending bento: the next unique products from the public trending feed.
- Brand index: active brands returned by the existing Redux/API catalogue.
- Launch desk: unique products from the public new-smartphones feed.
- Budget board: real published catalogue prices filtered into interactive budget bands.
- Comparison arena: real rows from the most-compared endpoint, with catalogue fallback.
- Newsroom: latest published stories from the existing public news hook.
- Research directory: grouped crawlable internal links, intentionally styled differently from the decision paths to avoid duplicated UI.

The old homepage components contained overlapping carousels and repeated normalization/fetch logic. Those direct children were replaced with smaller, shared components and one scoped stylesheet (`home-v2.css`).

## Design system

The new `src/styles/design-system.css` defines:

- semantic light/dark color tokens;
- shared radii and shadows;
- route-aware backgrounds and surfaces;
- card, form, table, modal, breadcrumb, footer, and navigation treatments;
- homepage artwork and decision modules;
- product, comparison, newsroom, company, policy, contact, careers, and error-page patterns;
- dark-mode compatibility for legacy Tailwind utility and arbitrary-color classes;
- responsive and reduced-motion behavior.

## SEO and internal linking

- Canonical URLs now remove query strings and fragments and consistently use trailing slashes for document routes.
- Page titles preserve useful punctuation and use readable separators rather than stripping commas and dashes.
- Obsolete meta-keyword output was removed.
- Default Open Graph/Twitter metadata and `en-IN` locale defaults were improved.
- Product, ItemList, CollectionPage, NewsArticle, WebPage, Organization, WebSite, and BreadcrumbList schemas remain connected to actual route data.
- Breadcrumbs, homepage decision links, footer navigation, and the internal-link hub create crawlable paths among categories, comparisons, trends, news, and company pages.
- Existing route-level indexing verification scripts were preserved.

## Important implementation files

- `src/context/ThemeContext.jsx`
- `src/components/ThemeToggle.jsx`
- `src/components/ui/RouteExperience.jsx`
- `src/components/ui/SectionHeading.jsx`
- `src/components/ui/InternalLinkHub.jsx`
- `src/components/ui/CompanyPageShell.jsx`
- `src/components/Home/DecisionStudio.jsx`
- `src/styles/design-system.css`
- `src/components/Breadcrumbs.jsx`
- `src/utils/publicUrl.js`
- `src/utils/seoTitle.js`

## Validation completed

- Parsed all 130 JavaScript/JSX source files with Babel: no syntax failures.
- Parsed the complete shared CSS file with PostCSS: no syntax failures.
- Ran `git diff --check`: no whitespace errors.
- Tested canonical output for listing, detail, comparison, tracking-query, and fragment cases.

A full Vite bundle could not be completed inside the Linux sandbox because the uploaded repository includes Windows-native optional build packages and the available package mirror does not provide the matching Linux Rollup package. The final archive excludes `node_modules`; run a clean `npm install` on the target machine before `npm run build`.

## Git comparison workflow

The uploaded state was preserved first in commit:

`c0ba4a1 chore: preserve existing news indexing work before complete redesign`

The redesign lives on branch:

`ui/complete-redesign`

Use these commands after extraction:

```bash
git log --oneline --decorate -5
git diff --stat c0ba4a1..HEAD
git diff c0ba4a1..HEAD
git switch fix/news-indexing   # preserved prior branch
git switch ui/complete-redesign
```

## Legal-content note

The Privacy Policy and Terms are product-ready drafts written to improve clarity and user experience. They should still be reviewed by qualified legal counsel against the business's actual data collection, advertising, affiliate, jurisdiction, and retention practices before publication.

## Homepage newsroom and smart-device art update

The `ui/homepage-smartdevice-art-newsroom` branch adds a reusable inline-SVG illustration system in `src/components/Home/SmartDeviceArt.jsx`. The artwork is code-based, theme-aware, responsive, and requires no additional image requests.

Each homepage area now uses a different device-related visual language:

- hero: connected phone, watch, audio, and computing ecosystem;
- decision studio: search, budget, comparison, and newsroom illustrations;
- trending: chipset and performance signal art;
- brand index: device ecosystem and brand-node art;
- launch desk: launch-orbit and release art;
- budget desk: price-ticket and value-chart art;
- comparison arena: dual-device comparison art;
- newsroom: digital publication and mobile-reporting art.

The homepage newsroom now de-duplicates stories by slug/ID/title before assigning them to the cover story, feature grid, headline ticker, and rapid-briefing ledger. All counts, topic labels, authors, dates, read times, linked-product signals, and story cards come from the published public news feed.

## Editorial Navigation Refresh

- Replaced the repeated grid-texture mega menu with a publication-style discovery panel.
- Added distinct research-path, brand, budget and comparison modules instead of three identical link columns.
- Restyled the desktop navigation as a cleaner editorial header with underline-based active states.
- Rebuilt the mobile drawer as a responsive device-research index with a compact welcome area, horizontal quick actions, independent accordion cards and theme-aware styling.
- Removed grid textures from the desktop mega menu and mobile drawer; both now use solid surfaces, soft colour fields and device-focused visual accents.
- Mobile submenu layouts use one column for long price/device links and two columns for shorter brand/feature links.
