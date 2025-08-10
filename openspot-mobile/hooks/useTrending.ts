import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MusicAPI } from '@/lib/music-api'
import { Track } from '@/types/music'

interface UseTrendingReturn {
  tracks: Track[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

const TRENDING_URL =
  'https://raw.githubusercontent.com/BlackHatDevX/trending-music-os/refs/heads/main/trending.json'
const TRENDING_TRACKS_CACHE_KEY = 'TRENDING_TRACKS_CACHE_V1'
const MAX_TRENDING = 10

export function useTrending(): UseTrendingReturn {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState<number>(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const loadTrending = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Load cache
        let cache: Record<string, Track> = {}
        try {
          const cacheStr = await AsyncStorage.getItem(TRENDING_TRACKS_CACHE_KEY)
          if (cacheStr) cache = JSON.parse(cacheStr)
        } catch {}

        // Fetch global trending list
        const res = await fetch(TRENDING_URL)
        const data = await res.json()
        const globalList: string[] = Array.isArray(data?.global) ? data.global : []
        const limitedList = globalList.slice(0, MAX_TRENDING)

        // Show cached immediately (preserve order)
        const initial: Track[] = []
        for (const entry of limitedList) {
          if (cache[entry]) initial.push(cache[entry])
        }
        if (isMountedRef.current) setTracks(initial)

        // Resolve missing concurrently
        const missing = limitedList.filter((e) => !cache[e])
        if (missing.length > 0) {
          const results = await Promise.allSettled(
            missing.map((entry) =>
              MusicAPI.searchTracks(entry).then((res) => ({ entry, res }))
            ),
          )
          let cacheChanged = false
          for (const r of results) {
            if (r.status === 'fulfilled') {
              const { entry, res } = r.value as { entry: string; res: any }
              const first = res?.tracks?.[0]
              if (first) {
                cache[entry] = first
                cacheChanged = true
              }
            }
          }
          // Merge in order
          const merged: Track[] = []
          for (const entry of limitedList) {
            if (cache[entry]) merged.push(cache[entry])
          }
          if (isMountedRef.current) setTracks(merged)
          if (cacheChanged) {
            try {
              await AsyncStorage.setItem(
                TRENDING_TRACKS_CACHE_KEY,
                JSON.stringify(cache),
              )
            } catch {}
          }
        }
      } catch (e: any) {
        if (isMountedRef.current) setError('Failed to load trending.')
      } finally {
        if (isMountedRef.current) setIsLoading(false)
      }
    }
    loadTrending()
  }, [refreshNonce])

  return {
    tracks,
    isLoading,
    error,
    refresh: () => setRefreshNonce((n) => n + 1),
  }
}


