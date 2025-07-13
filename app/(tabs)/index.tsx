import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Track } from '@/types/music';
import { useSearch } from '@/hooks/useSearch';
import { useMusicQueue } from '@/hooks/useMusicQueue';
import { useLikedSongs } from '@/hooks/useLikedSongs';

// Import components (we'll create these next)
import { TopBar } from '@/components/TopBar';
import { SearchResults } from '@/components/SearchResults';
import { LikedSongs } from '@/components/LikedSongs';
import { Player } from '@/components/Player';
import { QueueDisplay } from '@/components/QueueDisplay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentView, setCurrentView] = useState<'home' | 'search'>('home');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const searchState = useSearch();
  const { query, clearResults } = searchState;
  const musicQueue = useMusicQueue();
  const likedSongs = useLikedSongs();

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (currentView === 'search') {
        // Navigate to home instead of exiting app
        setCurrentView('home');
        clearResults();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentView, clearResults]);

  const handleTrackSelect = (track: Track, trackList?: Track[], startIndex?: number) => {
    console.log('🎵 Track selected:', track.title, 'by', track.artist);
    
    // If the selected track is already the current track, toggle play/pause
    if (musicQueue.currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    
    // Briefly pause playback to ensure clean transition
    setIsPlaying(false);
    
    if (trackList && startIndex !== undefined) {
      // Playing from a list (like liked songs) - set entire queue
      musicQueue.setQueueTracks(trackList, startIndex);
    } else {
      // Single track selection - add to queue or replace
      musicQueue.setQueueTracks([track], 0);
    }
    
    // Start playing after a brief delay to ensure audio is loaded
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  const handleQueueTrackSelect = (track: Track, index: number) => {
    // When selecting from queue, just set the current index
    musicQueue.setCurrentIndex(index);
    setIsPlaying(true);
  };

  const handlePlayingStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleViewChange = (view: 'home' | 'search') => {
    setCurrentView(view);
    if (view === 'home') {
      clearResults();
    }
  };

  const handleSearchClick = () => {
    setCurrentView('search');
  };

  const handleSearchStart = () => {
    setCurrentView('search');
  };

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  const closeQueue = () => {
    setIsQueueOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />
      
      {/* Top Bar */}
      <TopBar
        currentView={currentView}
        onViewChange={handleViewChange}
        onSearchClick={handleSearchClick}
        onSearchStart={handleSearchStart}
        searchState={searchState}
      />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {currentView === 'home' ? (
          <LikedSongs
            onTrackSelect={handleTrackSelect}
            isPlaying={isPlaying}
            currentTrack={musicQueue.currentTrack}
          />
        ) : (
          <SearchResults
            searchState={searchState}
            onTrackSelect={handleTrackSelect}
            isPlaying={isPlaying}
            currentTrack={musicQueue.currentTrack}
          />
        )}
      </View>

      {/* Queue Display */}
      {isQueueOpen && (
        <QueueDisplay
          isOpen={isQueueOpen}
          onClose={closeQueue}
          musicQueue={musicQueue}
          onTrackSelect={handleQueueTrackSelect}
          currentTrack={musicQueue.currentTrack}
        />
      )}

      {/* Player */}
      {musicQueue.currentTrack && (
        <Player
          track={musicQueue.currentTrack}
          isPlaying={isPlaying}
          onPlayingChange={handlePlayingStateChange}
          musicQueue={musicQueue}
          onQueueToggle={toggleQueue}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContent: {
    paddingTop: 16,
    flex: 1,
    paddingHorizontal: 2,
  },
});
