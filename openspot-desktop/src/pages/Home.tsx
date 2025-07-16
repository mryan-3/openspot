import React, { useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
} from '@mui/material';
import { PlayArrow, Favorite, MoreVert, QueueMusic, Pause, FavoriteBorder } from '@mui/icons-material';
import { useMusic, Track } from '../contexts/MusicContext';

const Home: React.FC = () => {
  const { state, dispatch } = useMusic();
  const likedRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  // Dynamic greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  if (hour >= 18 && hour < 22) return 'Good evening';
  return 'Good night';
};
var greeting = getGreeting();

  // Mix liked and recently played, remove duplicates, shuffle, pick 20 (only once per mount)
  const mixedTracks = useMemo(() => {
    const allTracks = [...state.likedTracks, ...state.recentlyPlayed];
    const uniqueTracksMap = new Map();
    allTracks.forEach(track => {
      if (!uniqueTracksMap.has(track.id)) {
        uniqueTracksMap.set(track.id, track);
      }
    });
    let mixed = Array.from(uniqueTracksMap.values());
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    return mixed.slice(0, 20);
  }, [state.likedTracks, state.recentlyPlayed]);

  // Shuffle recently played and play
  const handlePlaySomething = () => {
    if (mixedTracks.length > 0) {
      dispatch({ type: 'SET_QUEUE', payload: mixedTracks });
      dispatch({ type: 'SET_CURRENT_TRACK', payload: mixedTracks[0] });
      dispatch({ type: 'ADD_TO_RECENTLY_PLAYED', payload: mixedTracks[0] });
    }
  };

  const handlePlayPauseTrack = (track: Track) => {
    if (state.currentTrack?.id === track.id) {
      dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
    } else {
      dispatch({ type: 'SET_CURRENT_TRACK', payload: track });
      dispatch({ type: 'SET_QUEUE', payload: mixedTracks });
      dispatch({ type: 'ADD_TO_RECENTLY_PLAYED', payload: track });
    }
  };

  const handleToggleLike = (track: Track) => {
    dispatch({ type: 'TOGGLE_LIKE_TRACK', payload: track });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ padding: '24px', paddingBottom: '100px' }}>
      {/* Welcome Section */}
      <Box sx={{ marginBottom: '48px' }}>
        <Typography
          variant="h3"
          sx={{
            color: '#ffffff',
            fontWeight: 700,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {greeting}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#b3b3b3',
            marginBottom: '32px',
          }}
        >
          Welcome back to OpenSpot Music
        </Typography>
        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            sx={{
              backgroundColor: '#1db954',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#1ed760' },
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
            }}
            onClick={handlePlaySomething}
          >
            Play Something
          </Button>
        </Box>
      </Box>
      {/* Mixed Songs Grid */}
      <Box>
        <Grid container spacing={2}>
          {mixedTracks.length === 0 && (
            <Typography sx={{ color: '#b3b3b3', ml: 2 }}>No liked or recently played songs yet.</Typography>
          )}
          {mixedTracks.map(track => (
            <Grid item xs={12} sm={6} md={6} lg={6} key={track.id}>
              <Card sx={{ backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', p: 1, minHeight: 96, minWidth: 0, boxSizing: 'border-box' }}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleLike(track)}
                  sx={{ color: state.likedTracks.some(t => t.id === track.id) ? '#1db954' : '#b3b3b3', mr: 1 }}
                >
                  {state.likedTracks.some(t => t.id === track.id) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <CardMedia
                  component="img"
                  sx={{ width: 64, height: 64, borderRadius: '4px', mr: 2, flexShrink: 0, objectFit: 'cover' }}
                  image={track.coverUrl}
                  alt={track.title}
                />
                <CardContent sx={{ flex: 1, p: 0 }}>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>{track.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>{track.artist} • {track.album}</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>{formatTime(track.duration)}</Typography>
                </CardContent>
                <IconButton
                  size="medium"
                  onClick={() => handlePlayPauseTrack(track)}
                  sx={{ background: state.currentTrack?.id === track.id && state.isPlaying ? '#1db954' : '#232323', color: '#fff', ml: 2 }}
                >
                  {state.currentTrack?.id === track.id && state.isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Home; 