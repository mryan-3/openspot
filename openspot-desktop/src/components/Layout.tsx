import React, { ReactNode, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LibraryMusic, ExploreOutlined, Favorite, QueueMusic, Info } from '@mui/icons-material';
import Player from './Player';
import FullScreenPlayer from './FullScreenPlayer';
import AudioController from './AudioController';
import { useMusic } from '../contexts/MusicContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { dispatch } = useMusic();
  
  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Search', icon: <Search />, path: '/search' },
    { text: 'Liked Songs', icon: <Favorite />, path: '/liked' },
    { text: 'Recently Played', icon: <QueueMusic />, path: '/recent' },
    { text: 'About', icon: <Info />, path: '/about' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(itemPath);
  };

  const drawerWidth = 240;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      // Spacebar (play/pause)
      if (e.code === 'Space') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
      }
      // Media play/pause key (if supported)
      if (e.code === 'MediaPlayPause') {
        dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Draggable Top Bar for Electron window */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: 32,
          zIndex: 2000,
          WebkitAppRegion: 'drag',
          background: 'rgba(0,0,0,0.01)',
          userSelect: 'none',
        }}
      />
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          zIndex: 100, // Lower than player
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#000000',
            borderRight: '1px solid #2a2a2a',
            paddingTop: '24px',
            zIndex: 100, // Lower than player
            userSelect: 'none',
            WebkitAppRegion: 'no-drag',
          },
        }}
      >
        <Box sx={{ padding: '0 24px', marginBottom: '32px', userSelect: 'none', WebkitAppRegion: 'no-drag' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="OpenSpot"
            sx={{
              height: 32,
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              userSelect: 'none',
              WebkitAppRegion: 'no-drag',
            }}
            onError={(e) => {
              // Fallback to text if logo doesn't exist
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = 'none';
              const next = img.nextElementSibling as HTMLElement | null;
              if (next) {
                next.style.display = 'block';
              }
            }}
          />
          <Box
            sx={{
              display: 'none',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1db954',
              marginTop: '16px',
              userSelect: 'none',
              WebkitAppRegion: 'no-drag',
            }}
          >
            OpenSpot
          </Box>
        </Box>
        
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                color: isActive(item.path) ? '#ffffff' : '#b3b3b3',
                textDecoration: 'none',
                '&:hover': {
                  color: '#ffffff',
                },
                paddingLeft: '24px',
                paddingRight: '24px',
                background: isActive(item.path) ? 'rgba(29,185,84,0.08)' : 'none',
                borderRadius: isActive(item.path) ? '8px' : 0,
                userSelect: 'none',
                WebkitAppRegion: 'no-drag',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: '40px',
                  userSelect: 'none',
                  WebkitAppRegion: 'no-drag',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '14px',
                    fontWeight: 500,
                  },
                  userSelect: 'none',
                  WebkitAppRegion: 'no-drag',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <AudioController />
        {/* Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: '#121212',
            marginBottom: '90px', // Space for player
          }}
        >
          {children}
        </Box>
        
        {/* Player */}
        <Player sx={{ zIndex: 1200, position: 'fixed', left: drawerWidth, right: 0 }} />
        <FullScreenPlayer />
      </Box>
    </Box>
  );
};

export default Layout; 