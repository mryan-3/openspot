import React, { useContext } from 'react'
import { View, StyleSheet, StatusBar, Text, ScrollView, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSearch } from '@/hooks/useSearch'
import { TopBar } from '@/components/TopBar'
import { MusicPlayerContext } from './_layout'
//
import { useLikedSongs } from '@/hooks/useLikedSongs'
import { HorizontalTrackList } from '@/components/HorizontalTrackList'
import { useRouter } from 'expo-router'
import { useTrending } from '@/hooks/useTrending'

// removed country constants; using global-only trending

// Trending moved into useTrending hook
const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function HomeScreen() {
  const [currentView, setCurrentView] = React.useState<'home' | 'search'>(
    'home',
  )
  const searchState = useSearch()
  const { query, clearResults } = searchState
  const { handleTrackSelect, isPlaying, currentTrack } =
    useContext(MusicPlayerContext)
  const { tracks: trendingTracks, isLoading: trendingLoading } = useTrending()
  const { getLikedSongsAsTrack } = useLikedSongs()
  const likedTracks = getLikedSongsAsTrack()

  const handleViewChange = (view: 'home' | 'search') => {
    setCurrentView(view)
    if (view === 'home') {
      clearResults()
    }
  }

  const handleSearchClick = () => {
    // setCurrentView('search');
    const router = useRouter()
    router.push('/search')
  }

  const handleSearchStart = () => {
    setCurrentView('search')
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle='light-content'
        backgroundColor='#000'
        translucent={false}
      />
      <TopBar
        currentView={currentView}
        onViewChange={handleViewChange}
        onSearchClick={handleSearchClick}
        onSearchStart={handleSearchStart}
        searchState={searchState}
      />
      <View style={styles.mainContent}>
        {currentView === 'home' ? (
          <ScrollView>
            <HorizontalTrackList
              title={`Trending globally`}
              tracks={trendingTracks}
              onTrackSelect={handleTrackSelect}
              isPlaying={isPlaying}
              currentTrack={currentTrack}
            />
            {trendingTracks.length === 0 && !trendingLoading && (
              <Text
                style={{ color: '#888', textAlign: 'center', marginTop: 24 }}
              >
                Finding global hits...
              </Text>
            )}
            <HorizontalTrackList
              title='Liked Songs'
              tracks={likedTracks}
              onTrackSelect={handleTrackSelect}
              isPlaying={isPlaying}
              currentTrack={currentTrack}
            />
            <View style={{ height: 170 * 2 + 24 }} />
          </ScrollView>
        ) : (
          <></>
        )}
      </View>
    </SafeAreaView>
  )
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
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  horizontalList: {
    paddingLeft: 8,
    paddingBottom: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 8,
    marginRight: 12,
    padding: 8,
    width: SCREEN_WIDTH * 0.7,
    maxWidth: 320,
  },
  currentTrackItem: {
    backgroundColor: '#1a1a1a',
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  currentTrackText: {
    color: '#1DB954',
  },
})
