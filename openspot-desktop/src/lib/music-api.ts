import axios, { AxiosResponse } from 'axios';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  liked?: boolean;
  // Add any other fields as needed
}

export interface SearchResponse {
  tracks: Track[];
  total: number;
}

const API_BASE_URL = process.env.ELECTRON_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function searchTracks(query: string, offset = 0, limit = 20): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    offset: offset.toString(),
    type: 'track',
  });
  const response: AxiosResponse<SearchResponse> = await apiClient.get(`/search?${params}`);
  return response.data;
}

export async function getStreamUrl(trackId: string): Promise<string> {
  const response: AxiosResponse<{ url: string }> = await apiClient.get(`/stream?trackId=${trackId}`);
  if (!response.data.url) throw new Error('No stream URL received');
  return response.data.url;
}

export function getOptimalImage(images: { small: string; thumbnail: string; large: string }): string {
  return images?.large || images?.small || images?.thumbnail || '';
} 