import { useMemo } from "react";

/**
 * Hook: Safely process and validate blog HTML content
 *
 * Ensures content is properly formatted for rendering with dangerouslySetInnerHTML
 */
export const useBlogHtmlContent = (blog) => {
  return useMemo(() => {
    if (!blog) return { content: "", isValid: false, isEncoded: false };

    const content = String(
      blog.content_rendered || blog.content_template || "",
    );

    // Check if content is HTML-encoded (broken)
    const isEncoded = /&lt;|&gt;|&quot;|&#39;/g.test(content);

    // Check if content has proper HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);

    // Content is valid if it has HTML and is not encoded
    const isValid = hasHtmlTags && !isEncoded;

    return {
      content,
      isValid,
      isEncoded,
      hasHtmlTags,
      preview: content.substring(0, 150) + (content.length > 150 ? "..." : ""),
    };
  }, [blog]);
};

/**
 * Hook: Get properly formatted content for rendering
 *
 * Returns content safe for use with dangerouslySetInnerHTML
 */
export const useArticleHtml = (article) => {
  return useMemo(() => {
    if (!article) return "";

    // Prefer rendered content over template
    let content = article.content_rendered || article.content_template || "";

    // Ensure it's a string
    content = String(content);

    // If we detect encoding issue, log it (backend should have fixed this)
    if (/&lt;|&gt;/g.test(content)) {
      console.warn(
        "[BlogContent] Detected HTML-encoded content. Backend decoding may have failed.",
        { article: article.id, slug: article.slug },
      );
    }

    return content;
  }, [article]);
};

/**
 * Hook: Validate article content quality
 *
 * Returns metrics about the article content
 */
export const useArticleContentMetrics = (article) => {
  return useMemo(() => {
    if (!article) {
      return {
        hasContent: false,
        hasStructure: false,
        isFormatted: false,
        warningCount: 0,
      };
    }

    const content = String(
      article.content_rendered || article.content_template || "",
    );

    const metrics = {
      hasContent: content.length > 0,
      hasStructure: /<(h[2-3]|p|ul|ol|table|blockquote)>/i.test(content),
      isFormatted: /<h[2-3]>/i.test(content), // Has headings
      wordCount: content.split(/\s+/).length,
      warningCount: 0,
    };

    // Check for encoding issues
    if (/&lt;|&gt;|&quot;|&#39;/g.test(content)) {
      metrics.warningCount++;
      console.warn("[ArticleMetrics] Content appears to be HTML-encoded");
    }

    // Check for missing content
    if (!metrics.hasContent) {
      metrics.warningCount++;
    }

    // Check for missing structure
    if (!metrics.hasStructure) {
      metrics.warningCount++;
      console.warn("[ArticleMetrics] Content lacks proper HTML structure");
    }

    return metrics;
  }, [article]);
};

export default useBlogHtmlContent;
