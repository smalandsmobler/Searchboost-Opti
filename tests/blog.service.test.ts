/**
 * Blog Service Tests
 */

import { BlogService } from '../src/services/blog.service';
import { AbicartClient } from '../src/services/abicart.client';

// Mock Abicart Client
jest.mock('../src/services/abicart.client');

describe('BlogService', () => {
  let blogService: BlogService;
  let mockAbicartClient: jest.Mocked<AbicartClient>;

  beforeEach(() => {
    mockAbicartClient = new AbicartClient({
      apiUrl: 'https://api.abicart.se/v1/',
      apiKey: 'test-key',
      shopId: 'test-shop',
    }) as jest.Mocked<AbicartClient>;

    blogService = new BlogService(mockAbicartClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlogPosts', () => {
    it('should fetch and transform blog posts', async () => {
      const mockPosts = [
        {
          uid: '1',
          name: 'Test Post',
          content: 'Test content',
          created: '2024-01-01',
        },
      ];

      mockAbicartClient.getBlogArticles = jest
        .fn()
        .mockResolvedValue(mockPosts);

      const result = await blogService.getBlogPosts({ limit: 10 });

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].uid).toBe('1');
      expect(result.posts[0].title).toBe('Test Post');
    });

    it('should handle search queries', async () => {
      const mockPosts = [
        {
          uid: '2',
          name: 'Search Result',
          content: 'Found post',
        },
      ];

      mockAbicartClient.searchBlogArticles = jest
        .fn()
        .mockResolvedValue(mockPosts);

      const result = await blogService.getBlogPosts({
        searchQuery: 'test',
        limit: 5,
      });

      expect(mockAbicartClient.searchBlogArticles).toHaveBeenCalledWith(
        'test',
        5
      );
      expect(result.posts).toHaveLength(1);
    });

    it('should use cache for repeated requests', async () => {
      const mockPosts = [{ uid: '1', name: 'Cached Post' }];
      mockAbicartClient.getBlogArticles = jest
        .fn()
        .mockResolvedValue(mockPosts);

      // First call
      await blogService.getBlogPosts({ limit: 10 });

      // Second call (should use cache)
      await blogService.getBlogPosts({ limit: 10 });

      // API should only be called once
      expect(mockAbicartClient.getBlogArticles).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBlogPost', () => {
    it('should fetch single blog post by UID', async () => {
      const mockPost = {
        uid: '123',
        name: 'Single Post',
        content: 'Content here',
      };

      mockAbicartClient.getBlogArticle = jest
        .fn()
        .mockResolvedValue(mockPost);

      const result = await blogService.getBlogPost('123');

      expect(result).not.toBeNull();
      expect(result?.uid).toBe('123');
      expect(result?.title).toBe('Single Post');
    });

    it('should return null for non-existent post', async () => {
      mockAbicartClient.getBlogArticle = jest.fn().mockResolvedValue(null);

      const result = await blogService.getBlogPost('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      expect(() => blogService.clearCache()).not.toThrow();
    });
  });
});
