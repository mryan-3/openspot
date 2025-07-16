import React from 'react';
import { Box, Typography, Button, CardMedia, Stack } from '@mui/material';

const APP_VERSION = '2.0.2'; // Update as needed or import from package.json

const About: React.FC = () => {
  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#181818' }}>
      <CardMedia
        component="img"
        image="https://i.postimg.cc/LsLmXZTb/main.png"
        alt="OpenSpot Icon"
        sx={{ width: 120, height: 120, borderRadius: 4, mb: 3, boxShadow: 6 }}
      />

      <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
        OpenSpot
      </Typography>

      <Typography variant="body1" sx={{ color: '#b3b3b3', mb: 3, maxWidth: 500, textAlign: 'center' }}>
        OpenSpot is a free and open-source music streaming application designed for a seamless, high-fidelity listening experience. Built with a modern tech stack, it features a beautiful, responsive UI that looks great on any device.
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
          App Version: <b>{APP_VERSION}</b>
        </Typography>
        <Button
          variant="contained"
          color="success"
          href="https://github.com/BlackHatDevX/openspot-music-app/releases"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: 20, fontWeight: 600 }}
        >
          Check for Updates
        </Button>
      </Stack>
    </Box>
  );
};

export default About;
