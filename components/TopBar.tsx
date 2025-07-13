import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: any[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  searchTracks: (searchQuery: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
}

interface TopBarProps {
  currentView: 'home' | 'search';
  onViewChange: (view: 'home' | 'search') => void;
  onSearchClick: () => void;
  onSearchStart: () => void;
  searchState: UseSearchReturn;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TopBar({
  currentView,
  onViewChange,
  onSearchClick,
  onSearchStart,
  searchState,
}: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { query, setQuery, searchTracks, clearResults } = searchState;

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      searchTracks(text);
      onSearchStart();
    } else {
      clearResults();
    }
  };

  const handleBackPress = () => {
    onViewChange('home');
    clearResults();
    setQuery('');
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    onSearchClick();
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  const handleGitHubClick = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL('https://github.com/BlackHatDevX/openspot-music-app');
    } catch (error) {
      console.error('Failed to open GitHub URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {currentView === 'search' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {currentView === 'home' && (
          <TouchableOpacity
            style={styles.githubButton}
            onPress={handleGitHubClick}
          >
            <Ionicons name="logo-github" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.centerContent}>
          {currentView === 'home' ? (
            <Text style={styles.title}>OpenSpot</Text>
          ) : (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for songs, artists..."
                placeholderTextColor="#888"
                value={query}
                onChangeText={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                autoFocus={currentView === 'search'}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => handleSearchChange('')}
                >
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {currentView === 'home' && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchClick}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  githubButton: {
    marginLeft: 16,
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1DB954',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 40,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  searchButton: {
    marginLeft: 16,
    padding: 8,
  },
}); 