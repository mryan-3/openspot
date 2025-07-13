import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

import { Track } from '../types/music';
import { MusicAPI } from '../lib/music-api';
import { FullScreenPlayer } from './FullScreenPlayer';
import { useLikedSongs } from '../hooks/useLikedSongs';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  musicQueue: any; // We'll type this properly later
  onQueueToggle: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function Player({
  track,
  isPlaying,
  onPlayingChange,
  musicQueue,
  onQueueToggle,
}: PlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Download modal states
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string>('');
  
  const { isLiked, toggleLike } = useLikedSongs();
  const rotationValue = useRef(new Animated.Value(0)).current;
  const rotationAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);
  const downloadTimeoutRef = useRef<number | null>(null);
  const currentTrackIdRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      currentTrackIdRef.current = null;
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
      // Ensure audio is stopped and cleaned up on unmount
      if (sound) {
        console.log('🧹 Component unmounting - cleaning up audio');
        // Use a more robust cleanup approach
        sound.getStatusAsync()
          .then(status => {
            if (status.isLoaded) {
              return sound.stopAsync().then(() => sound.unloadAsync());
            } else {
              return sound.unloadAsync();
            }
          })
          .catch(error => {
            console.log('⚠️ Error during component unmount cleanup:', error);
            // Try to unload anyway as a last resort
            sound.unloadAsync().catch(console.error);
          });
      }
    };
  }, []); // Only run on unmount

  // Debug: Monitor musicQueue state changes
  useEffect(() => {
    console.log('🎵 MusicQueue state:', {
      isShuffled: musicQueue.isShuffled,
      repeatMode: musicQueue.repeatMode,
      currentIndex: musicQueue.currentIndex,
      tracksLength: musicQueue.tracks?.length || 0
    });
  }, [musicQueue.isShuffled, musicQueue.repeatMode, musicQueue.currentIndex, musicQueue.tracks]);

  // Reset rotation when track changes
  useEffect(() => {
    console.log('🎵 Track changed, resetting rotation for:', track.title);
    rotationValue.setValue(0);
  }, [track.id]); // Only depend on track.id

  // Handle rotation animation based on playing state
  useEffect(() => {
    if (isPlaying) {
      // Small delay to ensure any track change effects have completed
      setTimeout(() => {
        if (rotationAnimationRef.current) {
          rotationAnimationRef.current.stop();
        }
        
        rotationAnimationRef.current = Animated.loop(
          Animated.timing(rotationValue, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          { iterations: -1 }
        );
        
        rotationAnimationRef.current.start();
        console.log('🎵 Rotation animation started/restarted');
      }, 50);
    } else {
      // Stop rotation when not playing
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
        rotationAnimationRef.current = null;
        console.log('🎵 Rotation animation stopped');
      }
    }

    return () => {
      // Cleanup rotation on effect cleanup
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
        rotationAnimationRef.current = null;
      }
    };
  }, [isPlaying, rotationValue]); // Separate effect for rotation based on playing state

  // Configure audio session on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to configure audio session:', error);
      }
    };

    configureAudio();
  }, []);

  useEffect(() => {
    loadAudio();
  }, [track.id]);

  useEffect(() => {
    if (sound) {
      sound.getStatusAsync().then(status => {
        if (status.isLoaded) {
          if (isPlaying) {
            sound.playAsync().catch(console.error);
          } else {
            sound.pauseAsync().catch(console.error);
          }
        } else {
          console.log('⚠️ Sound not loaded, skipping play/pause in useEffect');
        }
      }).catch(console.error);
    }
  }, [isPlaying, sound]);

  const loadAudio = async () => {
    // Prevent multiple concurrent loadAudio calls
    if (isLoading) {
      console.log('🎵 Audio already loading, skipping duplicate call');
      return;
    }
    
    // Check if we're loading the same track - if so, don't reload
    if (currentTrackIdRef.current === track.id && sound) {
      console.log('🎵 Same track, skipping reload');
      return;
    }
    
    setIsLoading(true);
    currentTrackIdRef.current = track.id;
    
    try {
      // Stop and unload any existing sound first
      if (sound) {
        console.log('🛑 Stopping and unloading previous sound');
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          console.log('⚠️ Error checking/stopping previous sound:', error);
          // Try to unload anyway in case it's in a weird state
          try {
            await sound.unloadAsync();
          } catch (unloadError) {
            console.log('⚠️ Error unloading previous sound:', unloadError);
          }
        }
        setSound(null);
      }

      // Reset player state for new track
      setPosition(0);
      setDuration(0);

      // Get the actual streaming URL from the API
      console.log('🎵 Loading stream URL for track:', track.id);
      const audioUrl = await MusicAPI.getStreamUrl(track.id.toString());
      console.log('🔗 Stream URL received:', audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false, 
          isLooping: false, 
          volume: volume,
          // Reduce update frequency to prevent performance issues
          progressUpdateIntervalMillis: 1000, // Update every 1 second instead of default 250ms
          positionMillis: 0
        }
      );

      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // Only update position if user is not currently seeking and enough time has passed since last seek
          const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current;
          if (!isSeeking && timeSinceLastSeek > 200 && status.positionMillis !== undefined) {
            setPosition(status.positionMillis);
          }
          
          // Always update duration
          if (status.durationMillis !== undefined) {
            setDuration(status.durationMillis);
          }
          
          if (status.didJustFinish) {
            console.log('🎵 Track finished - calling handleNext(), repeatMode:', musicQueue.repeatMode);
            handleNext();
          }
        }
      });

    } catch (error) {
      console.error('Error loading audio:', error);
      // Show user-friendly error message
      Alert.alert('Playback Error', 'Failed to load audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
          } else {
            await sound.playAsync();
          }
          onPlayingChange(!isPlaying);
        } else {
          console.log('⚠️ Sound not loaded, cannot play/pause');
        }
      } catch (error) {
        console.error('Error in handlePlayPause:', error);
      }
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    console.log('🎵 handleNext called - repeatMode:', musicQueue.repeatMode);
    
    // Check if we're in repeat one mode
    if (musicQueue.repeatMode === 'one') {
      // For repeat one, restart the current track without calling musicQueue.playNext()
      console.log('🔁 Repeat One: Restarting current track');
      if (sound) {
        sound.getStatusAsync().then(status => {
          if (status.isLoaded) {
            sound.setPositionAsync(0).catch(console.error);
            sound.playAsync().catch(console.error);
            onPlayingChange(true);
          } else {
            console.log('⚠️ Sound not loaded, cannot restart track');
          }
        }).catch(console.error);
      }
      return;
    }
    
    // Normal next track logic
    const nextTrack = musicQueue.playNext();
    if (nextTrack) {
      console.log('⏭️ Playing next track:', nextTrack.title);
      onPlayingChange(true);
    } else {
      // End of queue, stop playback
      console.log('⏹️ End of queue, stopping playback');
      onPlayingChange(false);
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevTrack = musicQueue.playPrevious();
    if (prevTrack) {
      onPlayingChange(true);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          // Immediately update the position state for instant visual feedback
          setPosition(value);
          // Then seek the audio to that position
          await sound.setPositionAsync(value);
          // Record the seek time to prevent immediate position updates from status callback
          lastSeekTimeRef.current = Date.now();
        } else {
          console.log('⚠️ Sound not loaded, cannot seek');
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const handleSliderStart = () => {
    setIsSeeking(true);
  };

  const handleSliderComplete = async (value: number) => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          // Immediately update the position state for instant visual feedback
          setPosition(value);
          // Then seek the audio to that position
          await sound.setPositionAsync(value);
          // Record the seek time to prevent immediate position updates from status callback
          lastSeekTimeRef.current = Date.now();
        } else {
          console.log('⚠️ Sound not loaded, cannot seek in slider complete');
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
    setIsSeeking(false);
  };

  const handleSliderChange = (value: number) => {
    // Always update position during seeking for smooth UI
    if (isSeeking) {
      setPosition(value);
    }
  };

  const handleVolumeChange = async (value: number) => {
    const newVolume = value / 100;
    setVolume(newVolume);
    if (sound) {
      await sound.setVolumeAsync(newVolume);
    }
  };

  const handleMuteToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (sound) {
      await sound.setVolumeAsync(newMutedState ? 0 : volume);
    }
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newShuffleState = musicQueue.toggleShuffle();
    console.log('🔀 Shuffle toggled:', newShuffleState);
  };

  const handleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newRepeatMode = musicQueue.toggleRepeat();
    console.log('🔁 Repeat mode changed:', newRepeatMode);
  };

  const handleDownload = async () => {
    // Prevent multiple simultaneous downloads
    if (downloadStatus === 'downloading') {
      console.log('📥 Download already in progress, ignoring request');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Auto-pause the music when download starts
    if (isPlaying && sound) {
      await sound.pauseAsync();
      onPlayingChange(false);
      console.log('🎵 Music paused for download');
    }
    
    // Reset download state
    if (isMountedRef.current) {
      setDownloadProgress(0);
      setDownloadStatus('idle');
      setDownloadError('');
      setIsDownloadModalOpen(true);
    }
    
    try {
      // Request permissions
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      
      if (mediaLibraryStatus !== 'granted') {
        if (isMountedRef.current) {
          setDownloadError('Media library permission is required to save music files');
          setDownloadStatus('error');
        }
        return;
      }
      
      if (isMountedRef.current) {
        setDownloadStatus('downloading');
      }
      console.log('📥 Starting download for track:', track.title);
      
      // Get the streaming URL
      const audioUrl = await MusicAPI.getStreamUrl(track.id.toString());
      
      // Create a safe filename
      const safeFileName = `${track.title.replace(/[^a-zA-Z0-9\s]/g, '')}_${track.artist.replace(/[^a-zA-Z0-9\s]/g, '')}.mp3`;
      const fileUri = FileSystem.documentDirectory + safeFileName;
      
      // Start the download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        audioUrl,
        fileUri,
        {},
        (downloadProgress) => {
          if (isMountedRef.current) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(Math.round(progress * 100));
            console.log(`📥 Download progress: ${Math.round(progress * 100)}%`);
          }
        }
      );
      
      const downloadResult = await downloadResumable.downloadAsync();
      
      if (downloadResult) {
        console.log('📥 Download completed:', downloadResult.uri);
        
        // For production builds, save to media library
        if (mediaLibraryStatus === 'granted') {
          try {
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            
            // Try to create or get the OpenSpot album
            let album = await MediaLibrary.getAlbumAsync('OpenSpot');
            if (!album) {
              album = await MediaLibrary.createAlbumAsync('OpenSpot', asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            
            console.log('📥 File saved to media library in OpenSpot album');
          } catch (mediaError) {
            console.log('📥 File saved to app documents, media library save failed:', mediaError);
            // Don't throw error, just log it - file is still saved to documents
          }
        }
        
        try {
          if (isMountedRef.current) {
            setDownloadStatus('success');
            
            // Clear any existing timeout
            if (downloadTimeoutRef.current) {
              clearTimeout(downloadTimeoutRef.current);
            }
            
            // Auto-close modal after 3 seconds with proper cleanup
            downloadTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                try {
                  setIsDownloadModalOpen(false);
                  downloadTimeoutRef.current = null;
                } catch (error) {
                  console.error('Error closing download modal:', error);
                }
              }
            }, 3000);
          }
        } catch (stateError) {
          console.error('Error updating download state:', stateError);
          // Fallback: close modal immediately on error
          if (isMountedRef.current) {
            try {
              setIsDownloadModalOpen(false);
            } catch (closeError) {
              console.error('Error closing modal on fallback:', closeError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      if (isMountedRef.current) {
        try {
          setDownloadError('Download failed. Please check your internet connection and try again.');
          setDownloadStatus('error');
        } catch (stateError) {
          console.error('Error updating error state:', stateError);
        }
      }
    }
  };

  const handleCloseDownloadModal = () => {
    try {
      // Clear any pending timeout
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = null;
      }
      
      if (isMountedRef.current) {
        setIsDownloadModalOpen(false);
      }
    } catch (error) {
      console.error('Error closing download modal:', error);
    }
  };

  const handlePlayerClick = () => {
    setIsFullScreenOpen(true);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#000', '#000']}
        style={styles.gradient}
      >
        {/* Progress Bar */}
        <TouchableOpacity onPress={handlePlayerClick} style={styles.progressTouchArea}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarWithTime}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Slider
                value={position}
                minimumValue={0}
                maximumValue={duration}
                onValueChange={handleSliderChange}
                onSlidingStart={handleSliderStart}
                onSlidingComplete={handleSliderComplete}
                thumbTintColor="#1DB954"
                minimumTrackTintColor="#888"
                maximumTrackTintColor="#333"
                style={styles.progressFill}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleDownload}
          >
            <Ionicons
              name="download"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePrevious}
            disabled={!musicQueue.hasPrevious()}
          >
            <Ionicons
              name="play-skip-back"
              size={24}
              color={musicQueue.hasPrevious() ? "#fff" : "#444"}
            />
          </TouchableOpacity>

          <View style={styles.playButtonContainer}>
            <Animated.View style={[styles.rotatingAlbumArt, { transform: [{ rotate: spin }] }]}>
              <Image
                source={{ uri: MusicAPI.getOptimalImage(track.images) }}
                style={styles.albumArtBehindPlay}
                contentFit="cover"
              />
            </Animated.View>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={24} color="#000" />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#000"
                />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            disabled={!musicQueue.hasNext()}
          >
            <Ionicons
              name="play-skip-forward"
              size={24}
              color={musicQueue.hasNext() ? "#fff" : "#444"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={(e) => {
              e.stopPropagation();
              onQueueToggle();
            }}
          >
            <Ionicons
              name="menu"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Download Modal */}
      <Modal
        visible={isDownloadModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDownloadModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.downloadModal}>
            <LinearGradient
              colors={['#1a1a1a', '#2a2a2a']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Ionicons name="download" size={24} color="#1DB954" />
                <Text style={styles.modalTitle}>Download</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseDownloadModal}
                >
                  <Ionicons name="close" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.modalContent}>
                {/* Track Info */}
                <View style={styles.trackInfo}>
                  <Image
                    source={{ uri: MusicAPI.getOptimalImage(track.images) }}
                    style={styles.modalAlbumArt}
                    contentFit="cover"
                  />
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                </View>

                {/* Status Content */}
                <View style={styles.statusContainer}>
                  {downloadStatus === 'idle' && (
                    <Text style={styles.statusText}>Preparing download...</Text>
                  )}
                  
                  {downloadStatus === 'downloading' && (
                    <>
                      <ActivityIndicator size="large" color="#1DB954" style={styles.spinner} />
                      <Text style={styles.statusText}>Downloading...</Text>
                      <View style={styles.downloadProgressContainer}>
                        <View style={styles.downloadProgressBar}>
                          <View style={[styles.progressFillBar, { width: `${downloadProgress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{downloadProgress}%</Text>
                      </View>
                    </>
                  )}
                  
                  {downloadStatus === 'success' && (
                    <>
                      <Ionicons name="checkmark-circle" size={48} color="#1DB954" style={styles.successIcon} />
                      <Text style={styles.successText}>Download Complete!</Text>
                      <Text style={styles.successSubtext}>
                        Saved to your music library
                      </Text>
                    </>
                  )}
                  
                  {downloadStatus === 'error' && (
                    <>
                      <Ionicons name="alert-circle" size={48} color="#ff4444" style={styles.errorIcon} />
                      <Text style={styles.errorText}>Download Failed</Text>
                      <Text style={styles.errorSubtext}>{downloadError}</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                          handleCloseDownloadModal();
                          setTimeout(() => handleDownload(), 300);
                        }}
                      >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
      
      {/* Full Screen Player */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        track={track}
        isPlaying={isPlaying}
        onPlayingChange={onPlayingChange}
        position={position}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onMuteToggle={handleMuteToggle}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onShuffle={handleShuffle}
        onRepeat={handleRepeat}
        onDownload={handleDownload}
        musicQueue={musicQueue}
        onQueueToggle={onQueueToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
  gradient: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressTouchArea: {
    paddingBottom: 4,
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 1.5,
  },
  progressFill: {
    flex: 1,
    height: 40,
    marginHorizontal: 6,
  },
  progressBarWithTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  controlButton: {
    padding: 8,
  },
  activeControlButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
  },
  playButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatingAlbumArt: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  albumArtBehindPlay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.4,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    width: 42,
    textAlign: 'center',
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  downloadModal: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    paddingVertical: 10,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalAlbumArt: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
    color: '#888',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  spinner: {
    marginBottom: 10,
  },
  downloadProgressContainer: {
    alignItems: 'center',
  },
  downloadProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFillBar: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  successIcon: {
    marginBottom: 10,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 5,
  },
  successSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 5,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 