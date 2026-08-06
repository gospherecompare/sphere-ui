# Hooks Newsroom UI implementation

The `/news` route now uses the advanced Hooks newsroom design.

## Updated files

- `src/App.jsx` — hides the global breadcrumb on `/news` routes.
- `src/components/Static/NewsArticlesPage.jsx` — adds the advanced hero, live topic rail, editorial feature board, trending panel, follow panel, and quick briefs.
- `src/components/Static/news-listing.css` — responsive light/dark styling for the new newsroom layout.

The existing news API hooks, URLs, taxonomy routing, SEO metadata, structured data, and article-detail logic are preserved.

## Run locally

```bash
npm install
npm run dev
```

For a production check:

```bash
npm run build
```
