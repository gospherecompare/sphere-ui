# Smartphone Detail UI Redesign

Updated the smartphone detail route while preserving the existing SEO, data normalization, launch-status, variant, store-price, comparison, news, discovery, and FAQ logic.

## Main changes

- Added a responsive sticky page navigator and a desktop floating section navigator.
- Added section-aware scrolling for Overview, Key Specs, Competitors, Specifications, Explore, News, and FAQs.
- Improved product gallery with responsive thumbnails while retaining the existing carousel behavior.
- Corrected launch copy to show “Expected launch” for upcoming products.
- Added explicit market-status treatment based on existing launch logic.
- Rebuilt competitor cards around existing advantages, disadvantages, similarities, match score, price, and compare routes.
- Added a key-specification jump panel and sticky specification category navigation.
- Restyled latest news, discovery, and FAQ child components.
- Added a Recently Viewed section using the existing local-storage history.

## Validation

All modified JSX files passed Babel JSX syntax parsing. The full Vite build could not be completed in the container because the available dependency cache is missing Rollup's Linux optional binary.
