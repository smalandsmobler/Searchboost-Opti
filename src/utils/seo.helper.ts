/**
 * SEO Helper Functions
 * Generate SEO-optimized metadata for blog posts
 */

import { AbicartBlogPost } from '../types/abicart.types';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
  structuredData: Record<string, unknown>;
}

/**
 * Generate comprehensive SEO metadata for a blog post
 */
export function generateSEOMetadata(
  post: AbicartBlogPost,
  baseUrl: string
): SEOMetadata {
  const url = `${baseUrl}/blog/${post.slug || post.uid}`;
  const title = post.seoTitle || post.title || post.name;
  const description =
    post.metaDescription || post.excerpt || generateDescription(post.content);
  const keywords = post.metaKeywords || generateKeywords(post);
  const image = post.imageUrl || `${baseUrl}/images/default-blog.jpg`;

  return {
    // Basic SEO
    title: `${title} | Smålandsmöbler`,
    description: truncateText(description, 160),
    keywords,
    canonical: post.canonicalUrl || url,

    // Open Graph (Facebook, LinkedIn)
    ogTitle: title,
    ogDescription: truncateText(description, 200),
    ogImage: image,
    ogUrl: url,
    ogType: 'article',

    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: truncateText(description, 200),
    twitterImage: image,

    // Structured Data (Schema.org JSON-LD)
    structuredData: generateStructuredData(post, url, baseUrl),
  };
}

/**
 * Generate Schema.org structured data for blog post
 */
function generateStructuredData(
  post: AbicartBlogPost,
  url: string,
  baseUrl: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title || post.name,
    description: post.excerpt || generateDescription(post.content),
    image: post.imageUrl || `${baseUrl}/images/default-blog.jpg`,
    author: {
      '@type': 'Organization',
      name: post.author || 'Smålandsmöbler',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Smålandsmöbler',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
      },
    },
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate || post.publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: post.tags?.join(', ') || '',
  };
}

/**
 * Generate description from content if not provided
 */
function generateDescription(content: string, maxLength = 160): string {
  if (!content) return '';
  const text = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  return truncateText(text, maxLength);
}

/**
 * Generate keywords from post data
 */
function generateKeywords(post: AbicartBlogPost): string {
  const keywords: string[] = [];

  if (post.tags && post.tags.length > 0) {
    keywords.push(...post.tags);
  }

  if (post.categories && post.categories.length > 0) {
    keywords.push(...post.categories);
  }

  // Add default keywords
  keywords.push('smålandsmöbler', 'baby', 'barnmöbler', 'blogg');

  return [...new Set(keywords)].join(', ');
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Generate HTML meta tags for SEO
 */
export function generateMetaTags(metadata: SEOMetadata): string {
  return `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="title" content="${escapeHtml(metadata.title)}">
    <meta name="description" content="${escapeHtml(metadata.description)}">
    <meta name="keywords" content="${escapeHtml(metadata.keywords)}">
    <link rel="canonical" href="${escapeHtml(metadata.canonical)}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${metadata.ogType}">
    <meta property="og:url" content="${escapeHtml(metadata.ogUrl)}">
    <meta property="og:title" content="${escapeHtml(metadata.ogTitle)}">
    <meta property="og:description" content="${escapeHtml(metadata.ogDescription)}">
    ${metadata.ogImage ? `<meta property="og:image" content="${escapeHtml(metadata.ogImage)}">` : ''}

    <!-- Twitter -->
    <meta property="twitter:card" content="${metadata.twitterCard}">
    <meta property="twitter:url" content="${escapeHtml(metadata.ogUrl)}">
    <meta property="twitter:title" content="${escapeHtml(metadata.twitterTitle)}">
    <meta property="twitter:description" content="${escapeHtml(metadata.twitterDescription)}">
    ${metadata.twitterImage ? `<meta property="twitter:image" content="${escapeHtml(metadata.twitterImage)}">` : ''}

    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(metadata.structuredData, null, 2)}
    </script>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
