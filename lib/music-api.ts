import axios, { AxiosResponse } from 'axios';
import { SearchResponse, SearchParams, Track } from '../types/music';

const API_BASE_URL = 'https://dab.yeet.su/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export class MusicAPI {
  // Separate caches for different types of requests to prevent interference
  private static searchCache = new Map<string, Promise<any>>();
  private static streamCache = new Map<string, Promise<any>>();
  
  static async search(params: SearchParams): Promise<SearchResponse> {
    const { q, offset = 0, type = 'track' } = params;
    
    const searchParams = new URLSearchParams({
      q,
      offset: offset.toString(),
      type,
    });

    // Create a unique cache key for this search request
    const cacheKey = `search_${searchParams.toString()}`;
    
    // If the same search request is already in progress, return the existing promise
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    const requestPromise = this.performSearch(searchParams);
    
    // Store the promise in search cache
    this.searchCache.set(cacheKey, requestPromise);
    
    // Clean up cache after request completes (success or failure)
    requestPromise.finally(() => {
      this.searchCache.delete(cacheKey);
    });

    return requestPromise;
  }

  private static async performSearch(searchParams: URLSearchParams): Promise<SearchResponse> {
    try {
      const response: AxiosResponse<SearchResponse> = await apiClient.get(`/search?${searchParams}`);
      return response.data;
    } catch (error) {
      console.error('Search API error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed with status ${error.response?.status || 'unknown'}: ${error.message}`);
      }
      throw new Error('Search request failed');
    }
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static getOptimalImage(images: { small: string; thumbnail: string; large: string }): string {
    return images.large || images.small || images.thumbnail;
  }

  static async searchTracks(query: string, offset: number = 0, limit: number = 20): Promise<SearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        offset: offset.toString(),
        type: 'track'
      });

      const response: AxiosResponse<SearchResponse> = await apiClient.get(`/search?${searchParams}`);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP error! status: ${error.response?.status || 'unknown'}: ${error.message}`);
      }
      throw error;
    }
  }

  static async getStreamUrl(trackId: string): Promise<string> {
    const cacheKey = `stream_${trackId}`;
    
    // Check if stream request is already in progress - use separate cache
    if (this.streamCache.has(cacheKey)) {
      return this.streamCache.get(cacheKey);
    }

    const requestPromise = this.performStreamRequest(trackId);
    
    // Store the promise in stream cache
    this.streamCache.set(cacheKey, requestPromise);
    
    // Clean up cache after request completes (success or failure)
    requestPromise.finally(() => {
      this.streamCache.delete(cacheKey);
    });

    return requestPromise;
  }

  private static async performStreamRequest(trackId: string): Promise<string> {
    try {
      // Use the same endpoint format as the Next.js version
      const response: AxiosResponse<{ url: string }> = await apiClient.get(`/stream?trackId=${trackId}`, {
        timeout: 15000 // 15 second timeout for streams
      });
      
      if (!response.data.url) {
        throw new Error('No stream URL received');
      }
      
      return response.data.url;
    } catch (error) {
      console.error('Stream URL error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Stream request failed with status ${error.response?.status || 'unknown'}: ${error.message}`);
      }
      throw error;
    }
  }

  static async getPopularTracks(): Promise<Track[]> {
    try {
      const response = await this.search({ q: 'popular', type: 'track' });
      return response.tracks.slice(0, 10); // Return top 10 popular tracks
    } catch (error) {
      console.error('Error fetching popular tracks:', error);
      return [];
    }
  }

  static async getRecentlyPlayed(): Promise<Track[]> {
    // For now, return empty array - this would typically come from user's play history
    return [];
  }

  static async getMadeForYou(): Promise<Track[]> {
    try {
      const response = await this.search({ q: 'recommended', type: 'track' });
      return response.tracks.slice(0, 10); // Return top 10 recommended tracks
    } catch (error) {
      console.error('Error fetching made for you tracks:', error);
      return [];
    }
  }

  static getTrackUrl(track: Track): string {
    return `${API_BASE_URL}/stream/${track.id}`;
  }

  static isHighQuality(track: Track): boolean {
    return track.audioQuality.isHiRes || track.audioQuality.maximumBitDepth >= 24;
  }

  static getQualityBadge(track: Track): string | null {
    if (track.audioQuality.isHiRes) return 'Hi-Res';
    if (track.audioQuality.maximumBitDepth >= 24) return 'HD';
    return null;
  }

  static clearCache(): void {
    this.searchCache.clear();
    this.streamCache.clear();
  }

  static clearSearchCache(): void {
    this.searchCache.clear();
  }

  static clearStreamCache(): void {
    this.streamCache.clear();
  }
} 