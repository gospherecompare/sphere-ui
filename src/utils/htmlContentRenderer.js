/**
 * Frontend HTML Content Rendering Guide
 *
 * After the backend fix, HTML content from blog APIs will be properly formatted.
 * This guide shows how to render it correctly in React.
 */

/**
 * CORRECT: Using dangerouslySetInnerHTML (current implementation)
 * This is already properly implemented in NewsStoryArticlePage.jsx
 */
export const BlogContentRender = ({ content, className = "article-body" }) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} className={className} />
  );
};

/**
 * EXAMPLE: Expected Content After Fix
 *
 * BEFORE (broken):
 * "&lt;h3>A Camera-First Strategy&lt;/h3>&lt;p>With the upcoming debut...&lt;/p>"
 *
 * AFTER (fixed):
 * "<h3>A Camera-First Strategy</h3><p>With the upcoming debut...</p>"
 */

/**
 * CSS Styles Already Applied (from NewsStoryArticlePage.jsx)
 * These styles properly format the HTML tags:
 */
const ARTICLE_CONTENT_STYLES = {
  wrapper: `
    text-[16px] leading-7 text-[#4d5868] sm:text-[18px] sm:leading-9
    [&_p]:mb-5 [&_p:last-child]:mb-0 [&_p:first-of-type]:text-[18px]
    [&_h2]:mt-10 [&_h2]:text-[24px] [&_h2]:font-black
    [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-black
    [&_ul]:my-6 [&_ul]:list-disc [&_ol]:my-6 [&_ol]:list-decimal
    [&_table]:my-6 [&_table]:border-collapse [&_table]:w-full
    [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:bg-[#f7faff]
    [&_a]:text-[#1d4ed8] [&_a]:underline
    [&_strong]:font-semibold [&_strong]:text-[#171717]
  `,
};

/**
 * IMPLEMENTATION: Direct usage in React component
 */
export const NewsArticleContent = ({ article }) => {
  const { content_rendered, content_template } = article;

  // Use content_rendered if available (processed template with tokens replaced)
  // Fall back to content_template if rendered version is missing
  const htmlContent = content_rendered || content_template;

  return (
    <article className={ARTICLE_CONTENT_STYLES.wrapper}>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </article>
  );
};

/**
 * VALIDATION: Check if content contains HTML tags
 * (Useful for debugging)
 */
export const hasHtmlContent = (content) => {
  return /<[^>]*>/g.test(String(content || ""));
};

export const isHtmlEncoded = (content) => {
  return /&lt;|&gt;|&quot;|&#39;/g.test(String(content || ""));
};

/**
 * DEBUGGING: Log content state
 */
export const debugContent = (content) => {
  const text = String(content || "");
  console.log({
    hasHtml: hasHtmlContent(text),
    isEncoded: isHtmlEncoded(text),
    preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
  });
};

export default BlogContentRender;
