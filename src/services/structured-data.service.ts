/**
 * Schema.org Structured Data Generator
 * Creates rich snippets for better Google search results
 */

import { AbicartBlogPost } from '../types/abicart.types';

export class StructuredDataService {
  /**
   * Generate BlogPosting schema
   */
  generateBlogPostingSchema(post: AbicartBlogPost, baseUrl: string): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.metaDescription,
      image: post.imageUrl,
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
        '@id': post.canonicalUrl || `${baseUrl}/blog/${post.slug}`,
      },
      keywords: post.tags?.join(', ') || post.metaKeywords,
    };
  }

  /**
   * Generate Product schema for furniture
   */
  generateProductSchema(product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    brand: string;
    availability: 'InStock' | 'OutOfStock';
    rating?: number;
    reviewCount?: number;
  }): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: product.currency,
        price: product.price,
        availability: `https://schema.org/${product.availability}`,
      },
    };

    if (product.rating && product.reviewCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      };
    }

    return schema;
  }

  /**
   * Generate FAQ schema
   */
  generateFAQSchema(faqs: { question: string; answer: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate HowTo schema for guides
   */
  generateHowToSchema(guide: {
    name: string;
    description: string;
    image: string;
    totalTime?: string;
    steps: { name: string; text: string; image?: string }[];
  }): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: guide.name,
      description: guide.description,
      image: guide.image,
      totalTime: guide.totalTime,
      step: guide.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        image: step.image,
      })),
    };
  }

  /**
   * Generate Breadcrumb schema
   */
  generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Generate Organization schema
   */
  generateOrganizationSchema(org: {
    name: string;
    url: string;
    logo: string;
    phone?: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    socialMedia?: string[];
  }): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: org.url,
      logo: org.logo,
    };

    if (org.phone) {
      schema.telephone = org.phone;
    }

    if (org.email) {
      schema.email = org.email;
    }

    if (org.address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: org.address.street,
        addressLocality: org.address.city,
        postalCode: org.address.postalCode,
        addressCountry: org.address.country,
      };
    }

    if (org.socialMedia && org.socialMedia.length > 0) {
      schema.sameAs = org.socialMedia;
    }

    return schema;
  }

  /**
   * Generate comprehensive schema for a blog post page
   */
  generateComprehensiveSchema(
    post: AbicartBlogPost,
    baseUrl: string,
    breadcrumbs: { name: string; url: string }[]
  ): any[] {
    return [
      this.generateBlogPostingSchema(post, baseUrl),
      this.generateBreadcrumbSchema(breadcrumbs),
      this.generateOrganizationSchema({
        name: 'Smålandsmöbler',
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
      }),
    ];
  }
}
