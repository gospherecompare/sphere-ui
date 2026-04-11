// News Components Index
// =====================
// Central export point for all news and article components

export { default as NewsArticleCard } from "./NewsArticleCard";
export { default as SocialShareButtons } from "./SocialShareButtons";
export { default as NewsHighlights } from "./NewsHighlights";
export {
  default as TrendingProductsWidget,
  TrendingProductCard,
} from "./TrendingProductsWidget";

/**
 * NEWS COMPONENTS DOCUMENTATION
 *
 * 1. NewsArticleCard
 *    - Component for displaying individual article cards
 *    - Props:
 *      * article: { title, summary, image, author, publishedAt, label, slug }
 *      * featured: boolean - render as featured article (full width)
 *      * compact: boolean - render in compact mode
 *      * className: string - additional Tailwind classes
 *    - Usage:
 *      <NewsArticleCard
 *        article={article}
 *        featured={false}
 *      />
 *
 * 2. SocialShareButtons
 *    - Component for social media sharing
 *    - Props:
 *      * title: string - Article title
 *      * url: string - Share URL
 *      * description: string - Article summary
 *    - Features:
 *      * Supports: Facebook, Twitter, LinkedIn, Reddit, Email
 *      * Copy link to clipboard functionality
 *      * Visual feedback for copy action
 *    - Usage:
 *      <SocialShareButtons
 *        title={article.title}
 *        url="https://tryhook.shop/news/article-slug"
 *        description={article.summary}
 *      />
 *
 * 3. NewsHighlights
 *    - Component for displaying key highlights/key points
 *    - Props:
 *      * highlights: string[] | { text: string, icon: string }[]
 *      * variant: 'full' | 'badges' - full box with icons or simple badges
 *    - Icons: 'check' (default), 'lightbulb', 'fire', 'star'
 *    - Usage:
 *      // Variant 1: Simple string array
 *      <NewsHighlights
 *        highlights={['Fast charging', 'AMOLED display', 'AI camera']}
 *        variant="badges"
 *      />
 *
 *      // Variant 2: With custom icons
 *      <NewsHighlights
 *        highlights={[
 *          { text: 'Groundbreaking feature', icon: 'star' },
 *          { text: 'Industry first', icon: 'fire' },
 *          { text: 'Native support', icon: 'check' }
 *        ]}
 *        variant="full"
 *      />
 *
 * 4. TrendingProductsWidget
 *    - Sidebar widget for displaying trending products
 *    - Props:
 *      * title: string - Widget title (default: 'Trending Products')
 *      * products: array - Array of product objects
 *    - Product object: { name, price, image, store, storeUrl, specs, badge, category }
 *    - Features:
 *      * Shows top 4 products with rank badges (1st, 2nd, 3rd)
 *      * Product images with hover effects
 *      * Direct store/buy links
 *      * Responsive grid
 *    - Usage:
 *      <TrendingProductsWidget
 *        title="Trending Phones"
 *        products={[
 *          {
 *            name: 'iPhone 15',
 *            price: '₹79,999',
 *            image: 'url',
 *            store: 'Amazon',
 *            storeUrl: 'https://...',
 *            specs: ['5G', '12MP Camera'],
 *            badge: 'NEW'
 *          }
 *        ]}
 *      />
 *
 * INTEGRATION EXAMPLES
 * ====================
 *
 * In NewsStoryPage (Article Detail):
 *   - SocialShareButtons: Below article title for sharing
 *   - NewsHighlights: Sidebar component with key points
 *   - TrendingProductsWidget: Sidebar component with promoted products
 *
 * In NewsArticlesPage (Article Listing):
 *   - NewsArticleCard: Featured article at top
 *   - NewsArticleCard: Grid of regular articles below
 *
 * STYLING NOTES
 * ==============
 * - All components use Tailwind CSS
 * - Color scheme: Blue accents with slate grays
 * - Responsive: Mobile-first design
 * - Icons: React Icons (FaIcon names)
 *
 * EXAMPLE: Full Article Page Layout
 * ===================================
 *
 * <main className="grid lg:grid-cols-[1fr_300px] gap-6">
 *   <article>
 *     <h1>{article.title}</h1>
 *
 *     <NewsHighlights
 *       highlights={article.highlights}
 *       variant="badges"
 *     />
 *
 *     <SocialShareButtons
 *       title={article.title}
 *       url={articleUrl}
 *       description={article.summary}
 *     />
 *
 *     <div>{article.content}</div>
 *   </article>
 *
 *   <aside>
 *     <NewsHighlights
 *       highlights={article.highlights}
 *       variant="full"
 *     />
 *
 *     <TrendingProductsWidget
 *       products={trendingProducts}
 *     />
 *   </aside>
 * </main>
 */
