'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import maplibregl from 'maplibre-gl';
import { createRoot, Root } from 'react-dom/client';
import { useMapStore } from '../store/useMapStore';
import { Marker, Drawing } from '../types/map';
import MarkerPopup from './MarkerPopup';
import { getHaversineDistance, getPathLength, getPolygonArea, getCirclePoints } from '../utils/geo';
import ErrorOverlay, { ErrorType } from './ErrorOverlay';

interface MapComponentProps {
  onBboxChange: (bbox: [number, number, number, number] | null) => void;
}

export default function MapComponent({ onBboxChange }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const {
    apiKey,
    markers,
    addMarker,
    deleteMarker,
    updateMarker,
    bookmarks,
    addBookmark,
    layerSettings,
    activeDrawingTool,
    setActiveDrawingTool,
    drawings,
    addDrawing,
    routeState,
    isMapLoading,
    setIsMapLoading,
    mapState,
    setMapState,
  } = useMapStore();

  // Error States
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Local state for active drawing vertices
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [, setIsLocating] = useState(false);
  const [, setUserLocation] = useState<[number, number] | null>(null);

  // References to map elements for cleanup
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const rootsRef = useRef<{ [id: string]: Root }>({});
  const routeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize TomTom map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!apiKey) {
      setErrorType('api-limit');
      setErrorMessage('TomTom API Key is missing. Please configure it in Settings or your environment variable.');
      return;
    }

    setIsMapLoading(true);
    setErrorType(null);

    try {
      // 1. Config API Key
      TomTomConfig.instance.put({ apiKey });

      // 2. Instantiate TomTomMap
      const map = new TomTomMap({
        mapLibre: {
          container: mapContainerRef.current,
          center: mapState.center,
          zoom: mapState.zoom,
          pitch: mapState.pitch,
          bearing: mapState.bearing,
          hash: false,
        },
      });

      mapInstanceRef.current = map;

      // 3. Set theme styling once style loads
      map.mapLibreMap.on('load', () => {
        setIsMapLoading(false);
        setupLayers(map.mapLibreMap);
        updateBaseLayer(map.mapLibreMap, layerSettings.baseLayer);
        updateTrafficLayers(map.mapLibreMap);
        updateDrawingsOnMap(map.mapLibreMap, drawings);
        updateRouteOnMap(map.mapLibreMap);
      });

      // 4. Set map viewport updates
      map.mapLibreMap.on('moveend', () => {
        const center = map.mapLibreMap.getCenter();
        const zoom = map.mapLibreMap.getZoom();
        const bearing = map.mapLibreMap.getBearing();
        const pitch = map.mapLibreMap.getPitch();
        
        setMapState({
          center: [center.lng, center.lat],
          zoom,
          bearing,
          pitch,
        });

        // Trigger bbox update for traffic query
        const bounds = map.mapLibreMap.getBounds();
        if (bounds) {
          onBboxChange([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ]);
        }
      });

      // 5. Drawing mouse listeners
      map.mapLibreMap.on('click', handleMapClick);
      map.mapLibreMap.on('mousemove', handleMapMouseMove);

      return () => {
        map.mapLibreMap.remove();
        mapInstanceRef.current = null;
        // Clean up React roots
        Object.values(rootsRef.current).forEach((r) => r.unmount());
        rootsRef.current = {};
      };
    } catch (err: any) {
      console.error('Error loading TomTom Map:', err);
      setErrorType('general');
      setErrorMessage(err.message || 'Unable to load map engine. Check network or key permissions.');
      setIsMapLoading(false);
    }
  }, [apiKey]);

  // Set up standard sources & layers (Drawings, routing paths, location layers)
  const setupLayers = (m: maplibregl.Map) => {
    // 1. Setup drawings sources & styling layers
    m.addSource('drawings-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: 'drawings-fill',
      type: 'fill',
      source: 'drawings-source',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': '#5856D6',
        'fill-opacity': 0.15,
      },
    });

    m.addLayer({
      id: 'drawings-line',
      type: 'line',
      source: 'drawings-source',
      filter: ['in', '$type', 'LineString', 'Polygon'],
      paint: {
        'line-color': '#5856D6',
        'line-width': 3,
        'line-opacity': 0.85,
      },
    });

    m.addLayer({
      id: 'drawings-point',
      type: 'circle',
      source: 'drawings-source',
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-color': '#D75800',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // 2. Setup Route path layer
    m.addSource('route-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: 'route-layer',
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#007AFF',
        'line-width': 6,
        'line-opacity': 0.85,
      },
    });

    // 3. User Location accuracy circle source
    m.addSource('user-location-accuracy', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: 'user-accuracy-layer',
      type: 'fill',
      source: 'user-location-accuracy',
      paint: {
        'fill-color': '#007AFF',
        'fill-opacity': 0.15,
      },
    });

    // 4. Temporary active drawing preview source (dashed path / polygon)
    m.addSource('drawing-preview-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: 'drawing-preview-fill',
      type: 'fill',
      source: 'drawing-preview-source',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': '#5856D6',
        'fill-opacity': 0.1,
      },
    });

    m.addLayer({
      id: 'drawing-preview-line',
      type: 'line',
      source: 'drawing-preview-source',
      filter: ['in', '$type', 'LineString', 'Polygon'],
      paint: {
        'line-color': '#5856D6',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });

    // 5. Setup Raster Base Source (for Satellite, Terrain, Hybrid overlays)
    m.addSource('raster-base-source', {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    });

    // Load raster layer at bottom index so vector roads/labels render on top
    m.addLayer({
      id: 'raster-base-layer',
      type: 'raster',
      source: 'raster-base-source',
      paint: { 'raster-opacity': 0 },
    });
  };

  // Base layers toggling
  const updateBaseLayer = (m: maplibregl.Map, layer: string) => {
    if (!m.getSource('raster-base-source')) return;

    if (layer === 'map' || layer === '3D-buildings') {
      m.setPaintProperty('raster-base-layer', 'raster-opacity', 0);
      // Toggle 3D building heights extrusion
      if (layer === '3D-buildings') {
        if (m.getLayer('building')) {
          m.setPaintProperty('building', 'fill-extrusion-height', ['get', 'height']);
        }
      } else {
        if (m.getLayer('building')) {
          m.setPaintProperty('building', 'fill-extrusion-height', 0);
        }
      }
    } else {
      let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      if (layer === 'terrain') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
      }
      
      // Update raster tiles source
      m.removeLayer('raster-base-layer');
      m.removeSource('raster-base-source');
      
      m.addSource('raster-base-source', {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
      });

      // Re-add layer at bottom index
      const layers = m.getStyle().layers;
      const firstLayerId = layers && layers.length > 0 ? layers[0].id : undefined;

      m.addLayer({
        id: 'raster-base-layer',
        type: 'raster',
        source: 'raster-base-source',
        paint: {
          'raster-opacity': 1,
        },
      }, firstLayerId);

      // Hybrid road overlay controls
      if (layer === 'hybrid') {
        // Keeps roads visible, but dims background landfills
        const landuseLayers = ['landuse', 'park', 'water', 'sand', 'glacier'];
        landuseLayers.forEach((id) => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none');
        });
      } else {
        const landuseLayers = ['landuse', 'park', 'water', 'sand', 'glacier'];
        landuseLayers.forEach((id) => {
          if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'visible');
        });
      }
    }
  };

  // Add/remove traffic overlay layers
  const updateTrafficLayers = (m: maplibregl.Map) => {
    // Toggles Traffic Flow Layer
    if (layerSettings.showTraffic || layerSettings.showTrafficFlow) {
      if (!m.getSource('traffic-flow-source')) {
        m.addSource('traffic-flow-source', {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${apiKey}&thickness=10`],
          tileSize: 256,
        });
        m.addLayer({
          id: 'traffic-flow-layer',
          type: 'raster',
          source: 'traffic-flow-source',
        });
      }
    } else {
      if (m.getLayer('traffic-flow-layer')) m.removeLayer('traffic-flow-layer');
      if (m.getSource('traffic-flow-source')) m.removeSource('traffic-flow-source');
    }

    // Toggles Traffic Incidents Layer
    if (layerSettings.showTrafficIncidents) {
      if (!m.getSource('traffic-incidents-source')) {
        m.addSource('traffic-incidents-source', {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256,
        });
        m.addLayer({
          id: 'traffic-incidents-layer',
          type: 'raster',
          source: 'traffic-incidents-source',
        });
      }
    } else {
      if (m.getLayer('traffic-incidents-layer')) m.removeLayer('traffic-incidents-layer');
      if (m.getSource('traffic-incidents-source')) m.removeSource('traffic-incidents-source');
    }
  };

  // Synchronize base layer & traffic overlays when settings change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.mapLibreMap.loaded()) {
      updateBaseLayer(map.mapLibreMap, layerSettings.baseLayer);
    }
  }, [layerSettings.baseLayer]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.mapLibreMap.loaded()) {
      updateTrafficLayers(map.mapLibreMap);
    }
  }, [layerSettings.showTraffic, layerSettings.showTrafficFlow, layerSettings.showTrafficIncidents]);

  // Synchronize vector drawings
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.mapLibreMap.loaded()) {
      updateDrawingsOnMap(map.mapLibreMap, drawings);
    }
  }, [drawings]);

  const updateDrawingsOnMap = (m: maplibregl.Map, items: Drawing[]) => {
    const source: any = m.getSource('drawings-source');
    if (!source) return;

    const features = items.map((draw) => {
      // Map circle custom property to standard Polygon coordinates
      if (draw.type === 'Circle' && draw.properties.center && draw.properties.radius) {
        const circleCoords = getCirclePoints(draw.properties.center, draw.properties.radius);
        return {
          type: 'Feature' as const,
          id: draw.id,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [circleCoords],
          },
          properties: {
            title: draw.properties.title,
            measurement: draw.properties.measurement,
          },
        };
      }

      return {
        type: 'Feature' as const,
        id: draw.id,
        geometry: {
          type: draw.type as any,
          coordinates: draw.coordinates,
        },
        properties: {
          title: draw.properties.title,
          measurement: draw.properties.measurement,
        },
      };
    });

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  // Synchronize route display
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && map.mapLibreMap.loaded()) {
      updateRouteOnMap(map.mapLibreMap);
    }
  }, [routeState.routeResult]);

  const updateRouteOnMap = (m: maplibregl.Map) => {
    const source: any = m.getSource('route-source');
    if (!source) return;

    // Remove old route pins
    routeMarkersRef.current.forEach((marker) => marker.remove());
    routeMarkersRef.current = [];

    if (!routeState.routeResult || routeState.routeResult.coordinates.length === 0) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const { coordinates } = routeState.routeResult;

    // Draw route path line
    source.setData({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {},
    });

    // Drop start and end custom markers
    const startCoord = coordinates[0];
    const endCoord = coordinates[coordinates.length - 1];

    // Start Pin (Green)
    const elStart = document.createElement('div');
    elStart.className = 'w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md cursor-pointer hover:scale-110 transition-transform';
    elStart.innerHTML = 'A';
    const startMarker = new maplibregl.Marker(elStart)
      .setLngLat(startCoord)
      .addTo(m);

    // End Pin (Red)
    const elEnd = document.createElement('div');
    elEnd.className = 'w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md cursor-pointer hover:scale-110 transition-transform';
    elEnd.innerHTML = 'B';
    const endMarker = new maplibregl.Marker(elEnd)
      .setLngLat(endCoord)
      .addTo(m);

    routeMarkersRef.current = [startMarker, endMarker];

    // Zoom fit route bounds
    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach((coord) => bounds.extend(coord));
    m.fitBounds(bounds, { padding: 100, maxZoom: 14 });
  };

  // Synchronize React Markers overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.mapLibreMap.loaded()) return;

    const mInstance = map.mapLibreMap;

    // 1. Delete markers removed from state
    const markerIds = new Set(markers.map((m) => m.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!markerIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        if (rootsRef.current[id]) {
          rootsRef.current[id].unmount();
          delete rootsRef.current[id];
        }
      }
    });

    // 2. Drop or update markers in state
    markers.forEach((item) => {
      const isBookmarked = bookmarks.some((b) => b.id === item.id);
      
      const onSaveBookmark = (marker: Marker) => {
        addBookmark({
          id: marker.id,
          lat: marker.lat,
          lng: marker.lng,
          title: marker.title,
          description: marker.description,
          timestamp: new Date().toISOString(),
        });
      };

      const handleUpdateMarker = (id: string, updates: Partial<Marker>) => {
        updateMarker(id, updates);
        // Refresh color style on element directly
        if (updates.color && markersRef.current[id]) {
          const pinDot = markersRef.current[id].getElement().querySelector('.pin-dot');
          if (pinDot) (pinDot as HTMLDivElement).style.backgroundColor = updates.color;
        }
      };

      // If marker already on map, update its popup content
      if (markersRef.current[item.id]) {
        // Re-render popup node
        const root = rootsRef.current[item.id];
        if (root) {
          root.render(
            <MarkerPopup
              marker={item}
              apiKey={apiKey}
              onUpdate={handleUpdateMarker}
              onDelete={deleteMarker}
              onSaveBookmark={onSaveBookmark}
              isBookmarked={isBookmarked}
            />
          );
        }
        return;
      }

      // Drop new Marker
      const el = document.createElement('div');
      el.className = 'cursor-pointer hover:scale-110 transition-transform relative flex flex-col items-center';
      el.innerHTML = `
        <div class="pin-dot w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${item.color || '#007AFF'}"></div>
        <div class="w-1.5 h-1.5 bg-white border border-neutral-300 rounded-full mt-[-2px] shadow-sm"></div>
      `;

      // Custom React popup portal creation
      const popupEl = document.createElement('div');
      const root = createRoot(popupEl);
      rootsRef.current[item.id] = root;
      root.render(
        <MarkerPopup
          marker={item}
          apiKey={apiKey}
          onUpdate={handleUpdateMarker}
          onDelete={deleteMarker}
          onSaveBookmark={onSaveBookmark}
          isBookmarked={isBookmarked}
        />
      );

      const popup = new maplibregl.Popup({ offset: 15, maxWidth: '300px' })
        .setDOMContent(popupEl);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .setPopup(popup)
        .addTo(mInstance);

      markersRef.current[item.id] = marker;
    });
  }, [markers, bookmarks, apiKey]);

  // Intercept click events to drop markers or append drawing vertices
  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;

    // Drawing Active Tool Logic
    if (activeDrawingTool) {
      const newPoint: [number, number] = [lng, lat];
      const updated = [...drawingPoints, newPoint];

      if (activeDrawingTool === 'Point') {
        const newDrawing: Drawing = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Point',
          coordinates: newPoint,
          properties: {
            title: 'Point Coordinate',
            measurement: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            timestamp: new Date().toISOString(),
          },
        };
        addDrawing(newDrawing);
        setActiveDrawingTool(null);
        setDrawingPoints([]);
      } else if (activeDrawingTool === 'Rectangle' || activeDrawingTool === 'Circle') {
        if (updated.length === 1) {
          // Centered or first corner anchor set
          setDrawingPoints(updated);
        } else {
          // Completed
          const start = updated[0];
          const end = updated[1];

          let newDrawing: Drawing;

          if (activeDrawingTool === 'Rectangle') {
            // Rect coordinates: Polygon loop [bottom-left, bottom-right, top-right, top-left, bottom-left]
            const coords: [number, number][] = [
              [start[0], start[1]],
              [end[0], start[1]],
              [end[0], end[1]],
              [start[0], end[1]],
              [start[0], start[1]],
            ];
            const area = getPolygonArea(coords);
            const areaStr = area > 1000000 
              ? `${(area / 1000000).toFixed(2)} sq km` 
              : `${Math.round(area)} sq m`;

            newDrawing = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'Polygon',
              coordinates: [coords],
              properties: {
                title: 'Rectangle Area',
                measurement: areaStr,
                timestamp: new Date().toISOString(),
              },
            };
          } else {
            // Circle
            const radius = getHaversineDistance(start, end);
            const area = Math.PI * radius * radius;
            const areaStr = area > 1000000 
              ? `${(area / 1000000).toFixed(2)} sq km` 
              : `${Math.round(area)} sq m`;

            newDrawing = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'Circle',
              coordinates: start,
              properties: {
                title: 'Circle Zone',
                radius,
                center: start,
                measurement: `R: ${Math.round(radius)}m // ${areaStr}`,
                timestamp: new Date().toISOString(),
              },
            };
          }

          addDrawing(newDrawing);
          setActiveDrawingTool(null);
          setDrawingPoints([]);
          
          // Clear active preview layer
          const previewSource: any = mapInstanceRef.current.mapLibreMap.getSource('drawing-preview-source');
          if (previewSource) {
            previewSource.setData({ type: 'FeatureCollection', features: [] });
          }
        }
      } else {
        // Multi-point draw (Lines / Polygons / Measurement rules)
        setDrawingPoints(updated);
      }
      return;
    }

    // Default Marker drop click (when no active drawing tools)
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      lat,
      lng,
      title: 'Dropped Pin',
      description: '',
      timestamp: new Date().toISOString(),
      color: '#007AFF', // Primary color
    };
    addMarker(newMarker);
  };

  // Complete drawing polygons / paths on double-click
  useEffect(() => {
    const handleDblClick = (e: any) => {
      if (!activeDrawingTool || drawingPoints.length < 2) return;
      e.preventDefault();

      let newDrawing: Drawing;
      
      if (activeDrawingTool === 'LineString' || activeDrawingTool === 'measure-distance') {
        const length = getPathLength(drawingPoints);
        const lengthStr = length > 1000 
          ? `${(length / 1000).toFixed(2)} km` 
          : `${Math.round(length)} m`;

        newDrawing = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'LineString',
          coordinates: drawingPoints,
          properties: {
            title: activeDrawingTool === 'measure-distance' ? 'Measured Path' : 'Line vector',
            measurement: lengthStr,
            timestamp: new Date().toISOString(),
          },
        };
      } else if (activeDrawingTool === 'Polygon' || activeDrawingTool === 'measure-area') {
        // Close the loop for polygon
        const closedPoints = [...drawingPoints, drawingPoints[0]];
        const area = getPolygonArea(closedPoints);
        const areaStr = area > 1000000 
          ? `${(area / 1000000).toFixed(2)} sq km` 
          : `${Math.round(area)} sq m`;

        newDrawing = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'Polygon',
          coordinates: [closedPoints],
          properties: {
            title: activeDrawingTool === 'measure-area' ? 'Measured Boundary' : 'Polygon shape',
            measurement: areaStr,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        return;
      }

      addDrawing(newDrawing);
      setActiveDrawingTool(null);
      setDrawingPoints([]);

      // Clear preview source
      const previewSource: any = mapInstanceRef.current.mapLibreMap.getSource('drawing-preview-source');
      if (previewSource) {
        previewSource.setData({ type: 'FeatureCollection', features: [] });
      }
    };

    const map = mapInstanceRef.current;
    if (map) {
      map.mapLibreMap.on('dblclick', handleDblClick);
    }
    return () => {
      if (map) {
        map.mapLibreMap.off('dblclick', handleDblClick);
      }
    };
  }, [activeDrawingTool, drawingPoints]);

  // Live mouse movement previews for drawings
  const handleMapMouseMove = (e: maplibregl.MapMouseEvent) => {
    if (!activeDrawingTool || drawingPoints.length === 0) return;
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    const currentPos: [number, number] = [lng, lat];

    const previewSource: any = mapInstanceRef.current.mapLibreMap.getSource('drawing-preview-source');
    if (!previewSource) return;

    if (activeDrawingTool === 'LineString' || activeDrawingTool === 'measure-distance') {
      const lineCoords = [...drawingPoints, currentPos];
      previewSource.setData({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: lineCoords,
        },
        properties: {},
      });
    } else if (activeDrawingTool === 'Polygon' || activeDrawingTool === 'measure-area') {
      const polyCoords = [...drawingPoints, currentPos, drawingPoints[0]];
      previewSource.setData({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polyCoords],
        },
        properties: {},
      });
    } else if (activeDrawingTool === 'Rectangle') {
      const start = drawingPoints[0];
      const end = currentPos;
      const rectCoords = [
        [start[0], start[1]],
        [end[0], start[1]],
        [end[0], end[1]],
        [start[0], end[1]],
        [start[0], start[1]],
      ];
      previewSource.setData({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [rectCoords],
        },
        properties: {},
      });
    } else if (activeDrawingTool === 'Circle') {
      const start = drawingPoints[0];
      const end = currentPos;
      const radius = getHaversineDistance(start, end);
      const circleCoords = getCirclePoints(start, radius);
      
      previewSource.setData({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [circleCoords],
        },
        properties: {},
      });
    }
  };

  // Event Driven API for floating map controls (zoom, reset bearing, geolocate)
  useEffect(() => {
    const handleZoomIn = () => {
      mapInstanceRef.current?.mapLibreMap.zoomIn({ duration: 300 });
    };

    const handleZoomOut = () => {
      mapInstanceRef.current?.mapLibreMap.zoomOut({ duration: 300 });
    };

    const handleResetNorth = () => {
      mapInstanceRef.current?.mapLibreMap.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 800,
      });
    };

    const handleLocateUser = () => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setErrorType('location');
        setErrorMessage('Geolocation is not supported by your browser.');
        return;
      }

      setIsLocating(true);
      setErrorType(null);

      // Trigger locating loader state on right float control
      window.dispatchEvent(new CustomEvent('map-locating-state', { detail: true }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setIsLocating(false);
          window.dispatchEvent(new CustomEvent('map-locating-state', { detail: false }));

          const map = mapInstanceRef.current;
          if (map) {
            map.mapLibreMap.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              essential: true,
              duration: 1500,
            });

            // Update user location state
            setUserLocation([longitude, latitude]);

            // Draw accuracy circle
            const accuracyCoords = getCirclePoints([longitude, latitude], accuracy);
            const accuracySource: any = map.mapLibreMap.getSource('user-location-accuracy');
            if (accuracySource) {
              accuracySource.setData({
                type: 'Feature' as const,
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [accuracyCoords],
                },
                properties: {},
              });
            }

            // Draw blue dot marker
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.remove();
            }

            const el = document.createElement('div');
            el.className = 'relative flex items-center justify-center w-6 h-6';
            el.innerHTML = `
              <div class="absolute w-6 h-6 rounded-full bg-primary/20 animate-ping"></div>
              <div class="absolute w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md"></div>
            `;

            userLocationMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(map.mapLibreMap);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          window.dispatchEvent(new CustomEvent('map-locating-state', { detail: false }));
          setErrorType('location');
          setErrorMessage('Permission denied or location is currently unavailable.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    const handleToggle3D = () => {
      const map = mapInstanceRef.current?.mapLibreMap;
      if (!map) return;

      const currentPitch = map.getPitch();
      if (currentPitch > 10) {
        // Toggle off 3D (go to 2D)
        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000,
        });

        // Sync store's baseLayer back to map if it's 3D-buildings
        if (useMapStore.getState().layerSettings.baseLayer === '3D-buildings') {
          useMapStore.getState().updateLayerSettings({ baseLayer: 'map' });
        }
      } else {
        // Toggle on 3D (go to 3D)
        map.easeTo({
          pitch: 60,
          bearing: -15,
          duration: 1000,
        });

        // Sync store's baseLayer to 3D-buildings if it's map
        if (useMapStore.getState().layerSettings.baseLayer === 'map') {
          useMapStore.getState().updateLayerSettings({ baseLayer: '3D-buildings' });
        }
      }
    };

    const handleFlyTo = (event: CustomEvent) => {
      const { lng, lat, zoom } = event.detail;
      mapInstanceRef.current?.mapLibreMap.flyTo({
        center: [lng, lat],
        zoom: zoom || 11,
        essential: true,
        duration: 1500,
      });
    };

    window.addEventListener('map-zoom-in' as any, handleZoomIn);
    window.addEventListener('map-zoom-out' as any, handleZoomOut);
    window.addEventListener('map-reset-north' as any, handleResetNorth);
    window.addEventListener('map-locate-user' as any, handleLocateUser);
    window.addEventListener('map-toggle-3d' as any, handleToggle3D);
    window.addEventListener('map-fly-to' as any, handleFlyTo);

    return () => {
      window.removeEventListener('map-zoom-in' as any, handleZoomIn);
      window.removeEventListener('map-zoom-out' as any, handleZoomOut);
      window.removeEventListener('map-reset-north' as any, handleResetNorth);
      window.removeEventListener('map-locate-user' as any, handleLocateUser);
      window.removeEventListener('map-toggle-3d' as any, handleToggle3D);
      window.removeEventListener('map-fly-to' as any, handleFlyTo);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Mapbox Map Container */}
      <div ref={mapContainerRef} className="w-full h-full cursor-default" />

      {/* Drawing Instruction overlay prompt */}
      {activeDrawingTool && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-neutral-900/90 text-white text-xs px-4 py-2 rounded-card-sm border border-neutral-700/50 shadow-md font-mono tracking-wide">
          {activeDrawingTool === 'Rectangle' || activeDrawingTool === 'Circle'
            ? 'Click to set anchor point, move cursor, and click again to complete shape.'
            : 'Left-click to add points. Double-click to finish shape.'}
          <button
            onClick={() => {
              setActiveDrawingTool(null);
              setDrawingPoints([]);
              const previewSource: any = mapInstanceRef.current.mapLibreMap.getSource('drawing-preview-source');
              if (previewSource) {
                previewSource.setData({ type: 'FeatureCollection', features: [] });
              }
            }}
            className="ml-3 hover:text-tertiary font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating coordinates dashboard */}
      <div className="absolute left-4 bottom-4 z-10 glass-panel p-2 rounded-card-sm font-mono text-[9px] text-neutral-500 flex flex-col space-y-1">
        <div>
          LNG: <span className="font-semibold text-foreground">{mapState.center[0].toFixed(6)}</span>
        </div>
        <div>
          LAT: <span className="font-semibold text-foreground">{mapState.center[1].toFixed(6)}</span>
        </div>
        <div>
          ZOOM: <span className="font-semibold text-foreground">{mapState.zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Map loader */}
      {isMapLoading && (
        <div className="absolute inset-0 bg-[#0c0a09]/50 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
        </div>
      )}

      {/* Error Overlay handler */}
      <ErrorOverlay
        errorType={errorType}
        message={errorMessage}
        onClose={() => setErrorType(null)}
      />
    </div>
  );
}
