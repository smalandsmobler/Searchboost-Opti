/**
 * Internal Linking Service
 * Automatically suggests and creates internal links between blog posts
 */

import { AbicartBlogPost } from '../types/abicart.types';

export interface InternalLinkSuggestion {
  sourcePostId: string;
  sourcePostTitle: string;
  targetPostId: string;
  targetPostTitle: string;
  anchorText: string;
  relevanceScore: number;
  reason: string;
}

export class InternalLinkingService {
  /**
   * Find relevant keywords in a text
   */
  private extractKeywords(text: string): string[] {
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, ' ');

    // Convert to lowercase and split into words
    const words = cleanText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4); // Only words longer than 4 chars

    // Remove common Swedish stop words
    const stopWords = new Set([
      'detta',
      'denna',
      'dessa',
      'också',
      'eller',
      'efter',
      'innan',
      'under',
      'mellan',
      'genom',
      'omkring',
      'skulle',
      'kunna',
      'måste',
      'dessa',
      'vilka',
      'vilket',
      'andra',
      'själv',
      'själva',
    ]);

    const keywords = words.filter((word) => !stopWords.has(word));

    // Count frequency
    const frequency = new Map<string, number>();
    keywords.forEach((word) => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    // Return top keywords by frequency
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Calculate relevance score between two posts
   */
  private calculateRelevance(
    post1Keywords: string[],
    post2Keywords: string[]
  ): number {
    const set1 = new Set(post1Keywords);
    const set2 = new Set(post2Keywords);

    // Count common keywords
    let commonCount = 0;
    set1.forEach((keyword) => {
      if (set2.has(keyword)) {
        commonCount++;
      }
    });

    // Calculate Jaccard similarity
    const unionSize = set1.size + set2.size - commonCount;
    return commonCount / unionSize;
  }

  /**
   * Suggest internal links between blog posts
   */
  suggestInternalLinks(
    posts: AbicartBlogPost[]
  ): InternalLinkSuggestion[] {
    const suggestions: InternalLinkSuggestion[] = [];

    // Extract keywords for all posts
    const postKeywords = new Map<string, string[]>();
    posts.forEach((post) => {
      const keywords = this.extractKeywords(post.content + ' ' + post.title);
      postKeywords.set(post.uid, keywords);
    });

    // Compare each post with every other post
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const post1 = posts[i];
        const post2 = posts[j];

        const keywords1 = postKeywords.get(post1.uid) || [];
        const keywords2 = postKeywords.get(post2.uid) || [];

        const relevance = this.calculateRelevance(keywords1, keywords2);

        // Only suggest if relevance is above threshold
        if (relevance > 0.1) {
          // Find common keywords for anchor text
          const commonKeywords = keywords1.filter((k) =>
            keywords2.includes(k)
          );

          if (commonKeywords.length > 0) {
            // Suggestion: Link from post1 to post2
            suggestions.push({
              sourcePostId: post1.uid,
              sourcePostTitle: post1.title,
              targetPostId: post2.uid,
              targetPostTitle: post2.title,
              anchorText: commonKeywords[0], // Use most common keyword
              relevanceScore: relevance,
              reason: `Common keywords: ${commonKeywords.slice(0, 3).join(', ')}`,
            });

            // Suggestion: Link from post2 to post1
            suggestions.push({
              sourcePostId: post2.uid,
              sourcePostTitle: post2.title,
              targetPostId: post1.uid,
              targetPostTitle: post1.title,
              anchorText: commonKeywords[0],
              relevanceScore: relevance,
              reason: `Common keywords: ${commonKeywords.slice(0, 3).join(', ')}`,
            });
          }
        }
      }
    }

    // Sort by relevance score
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Automatically insert internal link in blog post content
   */
  insertInternalLink(
    content: string,
    anchorText: string,
    targetUrl: string
  ): string {
    // Find first occurrence of anchor text (case insensitive)
    const regex = new RegExp(`\\b${anchorText}\\b`, 'i');
    const match = content.match(regex);

    if (!match) {
      return content; // Anchor text not found
    }

    // Replace first occurrence with link
    const link = `<a href="${targetUrl}" class="internal-link">${match[0]}</a>`;
    return content.replace(regex, link);
  }

  /**
   * Generate sitemap with internal linking structure
   */
  generateSitemap(posts: AbicartBlogPost[]): string {
    const links = this.suggestInternalLinks(posts);

    // Group by source post
    const linksByPost = new Map<string, InternalLinkSuggestion[]>();
    links.forEach((link) => {
      if (!linksByPost.has(link.sourcePostId)) {
        linksByPost.set(link.sourcePostId, []);
      }
      linksByPost.get(link.sourcePostId)!.push(link);
    });

    // Generate sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    posts.forEach((post) => {
      const postLinks = linksByPost.get(post.uid) || [];

      sitemap += '  <url>\n';
      sitemap += `    <loc>${post.canonicalUrl || ''}</loc>\n`;
      sitemap += `    <lastmod>${post.modifiedDate || post.publishedDate}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';

      // Add internal links as annotations
      if (postLinks.length > 0) {
        sitemap += '    <!-- Internal Links -->\n';
        postLinks.slice(0, 5).forEach((link) => {
          sitemap += `    <!-- Link to: ${link.targetPostTitle} -->\n`;
        });
      }

      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    return sitemap;
  }
}
