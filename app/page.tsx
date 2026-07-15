'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMapStore } from '../store/useMapStore';

// Dynamically import components to prevent SSR window reference errors
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
});
const Sidebar = dynamic(() => import('../components/Sidebar'), {
  ssr: false,
});
const Toolbar = dynamic(() => import('../components/Toolbar'), {
  ssr: false,
});
const MapControls = dynamic(() => import('../components/MapControls'), {
  ssr: false,
});
const LoadingScreen = dynamic(() => import('../components/LoadingScreen'), {
  ssr: false,
});

export default function Home() {
  const {
    theme,
    isMapLoading,
    isRouteLoading,
    isSearching,
    isTrafficLoading,
    mapState,
  } = useMapStore();

  const [hasMounted, setHasMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);

  // Sync mounting and global theme class
  useEffect(() => {
    setHasMounted(true);
    
    // Always force light theme (remove dark class)
    const root = window.document.documentElement;
    root.classList.remove('dark');

    // Monitor browser native fullscreen changes (e.g. Esc button)
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Monitor locating event triggers
    const handleLocatingState = (e: any) => {
      setIsLocating(!!e.detail);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('map-locating-state' as any, handleLocatingState);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('map-locating-state' as any, handleLocatingState);
    };
  }, [theme]);

  // Dispatch events to communicate with decoupled MapComponent
  const handleZoomIn = () => {
    window.dispatchEvent(new CustomEvent('map-zoom-in'));
  };

  const handleZoomOut = () => {
    window.dispatchEvent(new CustomEvent('map-zoom-out'));
  };

  const handleResetNorth = () => {
    window.dispatchEvent(new CustomEvent('map-reset-north'));
  };

  const handleLocateUser = () => {
    window.dispatchEvent(new CustomEvent('map-locate-user'));
  };

  const handleToggle3D = () => {
    window.dispatchEvent(new CustomEvent('map-toggle-3d'));
  };

  const handleFlyTo = (lng: number, lat: number, zoom?: number) => {
    window.dispatchEvent(
      new CustomEvent('map-fly-to', {
        detail: { lng, lat, zoom },
      })
    );
  };

  const handleToggleFullscreen = () => {
    const container = document.documentElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getLoadingMessage = () => {
    if (isMapLoading) return 'Initializing map engine & layers';
    if (isRouteLoading) return 'Calculating directions path';
    if (isSearching) return 'Searching geographic databases';
    if (isTrafficLoading) return 'Polling real-time traffic details';
    return 'Loading spatial resources';
  };

  const isGlobalLoading = isMapLoading || isRouteLoading || isSearching;

  if (!hasMounted) {
    return <LoadingScreen isVisible={true} message="Booting spatial dashboard" />;
  }

  return (
    <main className="relative w-screen h-screen flex overflow-hidden bg-background text-foreground select-none font-sans">
      {/* 1. Global Loading Overlay Screen */}
      <LoadingScreen isVisible={isGlobalLoading} message={getLoadingMessage()} />

      {/* 2. Left Collapsible sidebar panel */}
      <Sidebar onFlyTo={handleFlyTo} mapBbox={bbox} />

      {/* 3. Primary Map Interface Layer */}
      <div className="flex-grow h-full relative">
        {/* Floating Drawings / Measures tools */}
        <Toolbar />

        {/* The Core TomTom Map viewport wrapper */}
        <MapComponent onBboxChange={setBbox} />

        {/* Floating Right Side navigation buttons */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onLocateUser={handleLocateUser}
          onToggleFullscreen={handleToggleFullscreen}
          onToggle3D={handleToggle3D}
          is3D={mapState.pitch > 10}
          isFullscreen={isFullscreen}
          isLocating={isLocating}
        />
      </div>
    </main>
  );
}
