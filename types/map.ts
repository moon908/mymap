export type MapTheme = 'light' | 'dark';

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  timestamp: string;
  color: string;
}

export interface SavedPlace {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  timestamp: string;
}

export type DrawingType = 'Point' | 'LineString' | 'Polygon' | 'Rectangle' | 'Circle';

export interface DrawingProperties {
  radius?: number; // In meters (for Circle)
  center?: [number, number]; // [lng, lat] (for Circle)
  measurement?: string; // Displayed measurement (e.g. "150 m", "3.2 sq km")
  title?: string;
  timestamp: string;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  coordinates: any; // GeoJSON position representation
  properties: DrawingProperties;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  center: [number, number]; // [lng, lat]
}

export type TravelMode = 'driving' | 'walking' | 'cycling' | 'transit';

export interface RouteOptions {
  avoidTolls: boolean;
  avoidHighways: boolean;
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lng, lat] arrays
  elevation?: number[]; // placeholder values
}

export type BaseLayerType = 'map' | 'satellite' | 'terrain' | 'hybrid' | '3D-buildings';

export interface LayerSettings {
  baseLayer: BaseLayerType;
  showLabels: boolean;
  showTraffic: boolean;
  showTrafficFlow: boolean;
  showTrafficIncidents: boolean;
}

export interface MapState {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
}
