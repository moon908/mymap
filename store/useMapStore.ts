import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  MapTheme, 
  Marker, 
  SavedPlace, 
  Drawing, 
  DrawingType, 
  SearchHistoryItem, 
  TravelMode, 
  RouteResult, 
  LayerSettings, 
  MapState 
} from '../types/map';

export interface RouteState {
  startAddress: string;
  startCoords: [number, number] | null; // [lng, lat]
  endAddress: string;
  endCoords: [number, number] | null; // [lng, lat]
  mode: TravelMode;
  avoidTolls: boolean;
  avoidHighways: boolean;
  routeResult: RouteResult | null;
}

interface MapStore {
  // Config
  theme: MapTheme;
  setTheme: (theme: MapTheme) => void;
  apiKey: string;
  setApiKey: (key: string) => void;

  // Markers
  markers: Marker[];
  addMarker: (marker: Marker) => void;
  deleteMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;

  // Bookmarks / Saved Places
  bookmarks: SavedPlace[];
  addBookmark: (bookmark: SavedPlace) => void;
  deleteBookmark: (id: string) => void;

  // Search History
  searchHistory: SearchHistoryItem[];
  addSearchHistory: (query: string, center: [number, number]) => void;
  clearSearchHistory: () => void;

  // Layer Panel Settings
  layerSettings: LayerSettings;
  updateLayerSettings: (settings: Partial<LayerSettings>) => void;

  // Active Drawing Tool & State
  activeDrawingTool: DrawingType | 'measure-distance' | 'measure-area' | null;
  setActiveDrawingTool: (tool: DrawingType | 'measure-distance' | 'measure-area' | null) => void;
  drawings: Drawing[];
  addDrawing: (drawing: Drawing) => void;
  deleteDrawing: (id: string) => void;
  clearDrawings: () => void;
  
  // Undo/Redo for drawings
  undoStack: Drawing[][];
  redoStack: Drawing[][];
  undoDrawing: () => void;
  redoDrawing: () => void;

  // Routing State
  routeState: RouteState;
  setRouteState: (updates: Partial<RouteState>) => void;
  clearRoute: () => void;

  // Loading indicator states
  isMapLoading: boolean;
  setIsMapLoading: (val: boolean) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  isRouteLoading: boolean;
  setIsRouteLoading: (val: boolean) => void;
  isTrafficLoading: boolean;
  setIsTrafficLoading: (val: boolean) => void;

  // Global Map Viewport State
  mapState: MapState;
  setMapState: (state: Partial<MapState>) => void;
}

const initialLayerSettings: LayerSettings = {
  baseLayer: 'map',
  showLabels: true,
  showTraffic: false,
  showTrafficFlow: false,
  showTrafficIncidents: false,
};

const initialRouteState: RouteState = {
  startAddress: '',
  startCoords: null,
  endAddress: '',
  endCoords: null,
  mode: 'driving',
  avoidTolls: false,
  avoidHighways: false,
  routeResult: null,
};

const initialMapState: MapState = {
  center: [78.9629, 20.5937], // India Center [lng, lat]
  zoom: 5,
  pitch: 0,
  bearing: 0,
};

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      // Theme and Config
      theme: 'light',
      setTheme: () => {
        set({ theme: 'light' });
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('dark');
        }
      },
      apiKey: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || '',
      setApiKey: (apiKey) => set({ apiKey }),

      // Markers state
      markers: [],
      addMarker: (marker) => {
        const currentDrawings = get().drawings;
        set((state) => ({
          markers: [...state.markers, marker],
          selectedMarkerId: marker.id,
        }));
      },
      deleteMarker: (id) => set((state) => ({
        markers: state.markers.filter((m) => m.id !== id),
        selectedMarkerId: state.selectedMarkerId === id ? null : state.selectedMarkerId,
      })),
      updateMarker: (id, updates) => set((state) => ({
        markers: state.markers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      })),
      selectedMarkerId: null,
      setSelectedMarkerId: (selectedMarkerId) => set({ selectedMarkerId }),

      // Bookmarks state
      bookmarks: [],
      addBookmark: (bookmark) => set((state) => {
        if (state.bookmarks.some((b) => b.id === bookmark.id)) return state;
        return { bookmarks: [...state.bookmarks, bookmark] };
      }),
      deleteBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),

      // Search History state
      searchHistory: [],
      addSearchHistory: (query, center) => set((state) => {
        const filtered = state.searchHistory.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
        const newItem: SearchHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          query,
          timestamp: new Date().toISOString(),
          center,
        };
        return { searchHistory: [newItem, ...filtered].slice(0, 10) }; // Cap at 10 items
      }),
      clearSearchHistory: () => set({ searchHistory: [] }),

      // Layer panel settings
      layerSettings: initialLayerSettings,
      updateLayerSettings: (updates) => set((state) => ({
        layerSettings: { ...state.layerSettings, ...updates },
      })),

      // Drawings state
      activeDrawingTool: null,
      setActiveDrawingTool: (activeDrawingTool) => set({ activeDrawingTool }),
      drawings: [],
      addDrawing: (drawing) => {
        const currentDrawings = get().drawings;
        const currentUndoStack = get().undoStack;
        set({
          undoStack: [...currentUndoStack, currentDrawings],
          redoStack: [],
          drawings: [...currentDrawings, drawing],
        });
      },
      deleteDrawing: (id) => {
        const currentDrawings = get().drawings;
        const currentUndoStack = get().undoStack;
        set({
          undoStack: [...currentUndoStack, currentDrawings],
          redoStack: [],
          drawings: currentDrawings.filter((d) => d.id !== id),
        });
      },
      clearDrawings: () => {
        const currentDrawings = get().drawings;
        const currentUndoStack = get().undoStack;
        set({
          undoStack: [...currentUndoStack, currentDrawings],
          redoStack: [],
          drawings: [],
        });
      },

      // Undo/Redo mechanisms
      undoStack: [],
      redoStack: [],
      undoDrawing: () => {
        const currentUndo = get().undoStack;
        if (currentUndo.length === 0) return;
        
        const previousState = currentUndo[currentUndo.length - 1];
        const newUndo = currentUndo.slice(0, -1);
        const currentDrawings = get().drawings;

        set({
          undoStack: newUndo,
          redoStack: [...get().redoStack, currentDrawings],
          drawings: previousState,
        });
      },
      redoDrawing: () => {
        const currentRedo = get().redoStack;
        if (currentRedo.length === 0) return;

        const nextState = currentRedo[currentRedo.length - 1];
        const newRedo = currentRedo.slice(0, -1);
        const currentDrawings = get().drawings;

        set({
          undoStack: [...get().undoStack, currentDrawings],
          redoStack: newRedo,
          drawings: nextState,
        });
      },

      // Routing state
      routeState: initialRouteState,
      setRouteState: (updates) => set((state) => ({
        routeState: { ...state.routeState, ...updates },
      })),
      clearRoute: () => set({ routeState: initialRouteState }),

      // Loading states
      isMapLoading: false,
      setIsMapLoading: (isMapLoading) => set({ isMapLoading }),
      isSearching: false,
      setIsSearching: (isSearching) => set({ isSearching }),
      isRouteLoading: false,
      setIsRouteLoading: (isRouteLoading) => set({ isRouteLoading }),
      isTrafficLoading: false,
      setIsTrafficLoading: (isTrafficLoading) => set({ isTrafficLoading }),

      // Viewport settings
      mapState: initialMapState,
      setMapState: (updates) => set((state) => ({
        mapState: { ...state.mapState, ...updates },
      })),
    }),
    {
      name: 'gis-map-storage',
      // Persist only markers, bookmarks, searchHistory, theme, mapState, and apiKey
      partialize: (state) => ({
        theme: state.theme,
        apiKey: state.apiKey,
        markers: state.markers,
        bookmarks: state.bookmarks,
        searchHistory: state.searchHistory,
        mapState: state.mapState,
      }),
    }
  )
);
