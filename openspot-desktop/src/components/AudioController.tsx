import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../contexts/MusicContext';
import { getStreamUrl } from '../lib/music-api';

const AudioController: React.FC = () => {
  const { state, dispatch } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stream URL when track changes
  useEffect(() => {
    const fetchStream = async () => {
      if (state.currentTrack) {
        setLoading(true);
        setError(null);
        try {
          const url = await getStreamUrl(state.currentTrack.id);
          setStreamUrl(url);
        } catch (err: any) {
          setError('Failed to load stream.');
          setStreamUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setStreamUrl(null);
      }
    };
    fetchStream();
  }, [state.currentTrack]);

  // Set audio src when streamUrl changes and force reload
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const fetchAndPlay = async () => {
      if (streamUrl) {
        try {
          const response = await fetch(streamUrl);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          audio.src = objectUrl;
          audio.load();
          if (state.isPlaying) {
            await audio.play();
          }
        } catch (error) {
          setError('Streaming failed.');
        }
      } else {
        audio.src = '';
      }
    };
  
    fetchAndPlay();
  }, [streamUrl, state.isPlaying]);
  
  // Play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.isPlaying) {
      if (audio.src) audio.play();
    } else {
      audio.pause();
    }
  }, [state.isPlaying, streamUrl]);

  // Volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.volume;
  }, [state.volume]);

  // Seek
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - state.currentTime) > 1) {
      audio.currentTime = state.currentTime;
    }
  }, [state.currentTime]);

  // Listen for time updates and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
    };
    const updateDuration = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration || 0 });
    };
    const onEnded = () => {
      if (state.repeatMode === 'track') {
        audio.currentTime = 0;
        audio.play();
      } else {
        dispatch({ type: 'NEXT_TRACK' });
      }
    };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [dispatch, state.repeatMode]);

  return <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />;
};

export default AudioController; 