'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bookmark, 
  Navigation, 
  Activity, 
  Layers, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  History, 
  ExternalLink, 
  Copy, 
  Compass
} from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { searchAddressOrPoi, SearchResult } from '../lib/search';
import RoutingPanel from './RoutingPanel';
import { fetchTrafficIncidents, TrafficIncident } from '../lib/traffic';

interface SidebarProps {
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
  mapBbox: [number, number, number, number] | null;
}

export default function Sidebar({ onFlyTo, mapBbox }: SidebarProps) {
  const {
    apiKey,
    setApiKey,
    markers,
    addMarker,
    deleteMarker,
    bookmarks,
    deleteBookmark,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    layerSettings,
    updateLayerSettings,
    setSelectedMarkerId,
    setRouteState,
  } = useMapStore();

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'route' | 'traffic' | 'layers' | 'settings'>('search');

  // Search input states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Settings states
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  // Traffic list state
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [isTrafficLoading, setIsTrafficLoading] = useState(false);

  // Listen for external sidebar tab switch events
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('switch-sidebar-tab' as any, handleSwitchTab);
    return () => {
      window.removeEventListener('switch-sidebar-tab' as any, handleSwitchTab);
    };
  }, []);

  const handleGetDirections = (item: SearchResult) => {
    setRouteState({
      endAddress: item.name + ', ' + item.address,
      endCoords: [item.lng, item.lat],
    });
    setActiveTab('route');
  };

  // Sync API Key state
  useEffect(() => {
    setTempApiKey(apiKey);
  }, [apiKey]);

  // Fetch incidents in bbox when traffic tab is open or incidents layers are toggled
  useEffect(() => {
    if (activeTab === 'traffic' && mapBbox && apiKey && layerSettings.showTrafficIncidents) {
      const getIncidents = async () => {
        setIsTrafficLoading(true);
        const results = await fetchTrafficIncidents(mapBbox, apiKey);
        setIncidents(results);
        setIsTrafficLoading(false);
      };
      getIncidents();
    }
  }, [activeTab, mapBbox, apiKey, layerSettings.showTrafficIncidents]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchAddressOrPoi(searchQuery, apiKey);
    setSearchResults(results);
    setIsSearching(false);

    if (results.length > 0) {
      addSearchHistory(searchQuery, [results[0].lng, results[0].lat]);
    }
  };

  const handleSelectSearchResult = (item: SearchResult) => {
    onFlyTo(item.lng, item.lat, 14);
    
    // Check if a marker for this exact location already exists to avoid duplicates
    const exists = markers.some(
      (m) => m.lat.toFixed(6) === item.lat.toFixed(6) && m.lng.toFixed(6) === item.lng.toFixed(6)
    );
    
    if (!exists) {
      const newMarkerId = `search-${Date.now()}`;
      addMarker({
        id: newMarkerId,
        lat: item.lat,
        lng: item.lng,
        title: item.name,
        description: item.address || 'Searched Location',
        timestamp: new Date().toISOString(),
        color: '#007AFF', // Design system Primary (Vibrant Blue)
      });
      setSelectedMarkerId(newMarkerId);
    } else {
      // If it exists, find it and select it to highlight it
      const existing = markers.find(
        (m) => m.lat.toFixed(6) === item.lat.toFixed(6) && m.lng.toFixed(6) === item.lng.toFixed(6)
      );
      if (existing) {
        setSelectedMarkerId(existing.id);
      }
    }
  };

  const handleSaveSettings = () => {
    setApiKey(tempApiKey);
    alert('Settings saved successfully!');
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    alert('Coordinates copied to clipboard!');
  };

  const menuItems = [
    { id: 'search' as const, icon: <Search className="w-4 h-4" />, label: 'Search' },
    { id: 'saved' as const, icon: <Bookmark className="w-4 h-4" />, label: 'Saved' },
    { id: 'route' as const, icon: <Navigation className="w-4 h-4" />, label: 'Directions' },
    { id: 'traffic' as const, icon: <Activity className="w-4 h-4" />, label: 'Traffic' },
    { id: 'layers' as const, icon: <Layers className="w-4 h-4" />, label: 'Layers' },
    { id: 'settings' as const, icon: <Settings className="w-4 h-4" />, label: 'Config' },
  ];

  return (
    <div className="relative h-full z-20 flex font-sans">
      {/* Sidebar container */}
      <div
        className={`h-full bg-white dark:bg-[#121214] border-r border-neutral-200 dark:border-neutral-800 shadow-xl transition-all duration-300 flex ${
          isOpen ? 'w-80 md:w-96' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Navigation capsule (left side inside sidebar) */}
        <div className="w-16 flex-shrink-0 bg-neutral-50 dark:bg-[#0c0a09] border-r border-neutral-200 dark:border-neutral-850 py-4 flex flex-col items-center justify-between">
          <div className="flex flex-col items-center space-y-4 w-full px-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5 text-primary animate-pulse" />
            </div>

            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-10 h-10 rounded-button flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-secondary text-primary shadow-sm font-semibold'
                      : 'text-neutral-500 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>

          <div className="text-[9px] font-mono tracking-wider text-neutral-400 rotate-270 uppercase my-4">
            GIS Core v1.5
          </div>
        </div>

        {/* Tab content area */}
        <div className="flex-grow flex flex-col min-w-0 bg-white dark:bg-[#121214] p-4 overflow-y-auto">
          {/* Active Tab Header */}
          <div className="mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground capitalize tracking-tight">
              {activeTab === 'route' ? 'Directions Finder' : activeTab === 'saved' ? 'Saved Places' : activeTab + ' Panel'}
            </h2>
            {activeTab === 'search' && searchResults.length > 0 && (
              <button
                onClick={() => setSearchResults([])}
                className="text-[10px] text-neutral-400 hover:text-foreground"
              >
                Clear Results
              </button>
            )}
          </div>

          {/* TAB 1: SEARCH */}
          {activeTab === 'search' && (
            <div className="flex-grow flex flex-col space-y-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cities, landmarks..."
                  className="w-full bg-[#F2F2F7] dark:bg-neutral-900 border-none outline-none text-sm p-3 pl-10 rounded-card-sm text-foreground shadow-inner focus:ring-1 focus:ring-primary/30"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-primary text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-button hover:bg-primary/95 transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Autocomplete / Results */}
              <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                {isSearching ? (
                  <div className="text-xs text-neutral-400 text-center py-6">Searching database...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSearchResult(item)}
                      className="group p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-card-sm hover:border-primary/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-semibold text-foreground truncate max-w-[80%]">
                          {item.name}
                        </h4>
                        <span className="text-[9px] font-mono text-neutral-400 capitalize bg-neutral-200/50 dark:bg-neutral-800 px-1 rounded">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-1 truncate">
                        {item.address}
                      </p>
                      <div className="flex justify-between items-center mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCoords(item.lat, item.lng);
                          }}
                          className="text-[9px] font-mono text-primary flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Coords</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(item);
                          }}
                          className="text-[9px] text-primary flex items-center gap-1 hover:underline font-medium"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-neutral-450 hover:text-foreground flex items-center gap-1"
                        >
                          <span>Open in Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  // Search History / Recents
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        <span>Recent Searches</span>
                      </span>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearSearchHistory}
                          className="text-[9px] text-neutral-450 hover:text-tertiary"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="space-y-1.5">
                        {searchHistory.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onFlyTo(item.center[0], item.center[1], 10)}
                            className="w-full text-left p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-card-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-all flex items-center justify-between text-xs text-foreground"
                          >
                            <span className="truncate max-w-[80%]">{item.query}</span>
                            <span className="text-[9px] text-neutral-400 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-450 text-center py-8">
                        No recent searches found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SAVED PLACES */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {/* Markers List */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block px-1">
                  Active Markers ({markers.length})
                </span>

                {markers.length > 0 ? (
                  <div className="space-y-2">
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => onFlyTo(m.lng, m.lat, 14)}
                        className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-card-sm cursor-pointer hover:border-neutral-250 dark:hover:border-neutral-750 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shadow-sm"
                              style={{ backgroundColor: m.color || '#007AFF' }}
                            />
                            <h4 className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                              {m.title || 'Untitled Marker'}
                            </h4>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMarker(m.id);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-850 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Marker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {m.description && (
                          <p className="text-[10px] text-neutral-450 mt-1 line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2.5 text-[9px] font-mono text-neutral-400">
                          <span>
                            {m.lat.toFixed(5)}, {m.lng.toFixed(5)}
                          </span>
                          <span>
                            {new Date(m.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-450 text-center py-6 bg-neutral-50 dark:bg-neutral-900 rounded-card-sm border border-dashed border-neutral-200 dark:border-neutral-850">
                    Click anywhere on the map to drop a marker.
                  </div>
                )}
              </div>

              {/* Bookmarks */}
              <div className="space-y-2.5 mt-6">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block px-1">
                  Bookmarked Places ({bookmarks.length})
                </span>

                {bookmarks.length > 0 ? (
                  <div className="space-y-1.5">
                    {bookmarks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onFlyTo(b.lng, b.lat, 12)}
                        className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-card-sm cursor-pointer hover:border-primary/20 transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-foreground truncate">{b.title}</div>
                          <div className="text-[9px] text-neutral-400 truncate mt-0.5">{b.description || 'Saved location'}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBookmark(b.id);
                          }}
                          className="p-1 text-neutral-450 hover:text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded"
                          title="Delete Bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-455 text-center py-4 text-neutral-450">
                    No bookmarks saved yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECTIONS/ROUTE */}
          {activeTab === 'route' && <RoutingPanel />}

          {/* TAB 4: TRAFFIC */}
          {activeTab === 'traffic' && (
            <div className="space-y-4">
              {/* Layer Toggles */}
              <div className="bg-neutral-100/50 dark:bg-neutral-800/40 p-3.5 rounded-card-sm border border-neutral-200/50 dark:border-neutral-850/50 space-y-3">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block">
                  Traffic Visibility Options
                </span>

                <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                  <span>Show Traffic Overlay</span>
                  <input
                    type="checkbox"
                    checked={layerSettings.showTraffic}
                    onChange={(e) => updateLayerSettings({ showTraffic: e.target.checked })}
                    className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                  <span>Show Flow (Relative Speeds)</span>
                  <input
                    type="checkbox"
                    checked={layerSettings.showTrafficFlow}
                    onChange={(e) => updateLayerSettings({ showTrafficFlow: e.target.checked })}
                    className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                  <span>Show Incident Icons</span>
                  <input
                    type="checkbox"
                    checked={layerSettings.showTrafficIncidents}
                    onChange={(e) => updateLayerSettings({ showTrafficIncidents: e.target.checked })}
                    className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>
              </div>

              {/* Traffic Legend */}
              <div className="p-3 bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-850/50 rounded-card-sm space-y-2">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block">
                  Speed Legend
                </span>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-mono">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-1 bg-[#34c759] rounded-sm mb-1" />
                    <span>Free Flow</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-1 bg-[#ffcc00] rounded-sm mb-1" />
                    <span>Moderate</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-1 bg-[#ff9500] rounded-sm mb-1" />
                    <span>Heavy</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-1 bg-[#ff3b30] rounded-sm mb-1" />
                    <span>Blocked</span>
                  </div>
                </div>
              </div>

              {/* Viewport Incidents */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block px-1">
                  Incidents in Viewport ({incidents.length})
                </span>

                {!layerSettings.showTrafficIncidents ? (
                  <div className="text-[11px] text-neutral-450 text-center py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-card-sm">
                    Enable "Show Incident Icons" to query details.
                  </div>
                ) : isTrafficLoading ? (
                  <div className="text-xs text-neutral-450 text-center py-6">Polling incident data...</div>
                ) : incidents.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {incidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => onFlyTo(inc.coordinates[0], inc.coordinates[1], 13)}
                        className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-card-sm cursor-pointer hover:border-neutral-250 dark:hover:border-neutral-750 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-foreground truncate max-w-[70%]">
                            {inc.roadName}
                          </h4>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded capitalize ${
                            inc.magnitude === 4 ? 'bg-[#ff3b30]/20 text-[#ff453a]' :
                            inc.magnitude === 3 ? 'bg-[#ff9500]/20 text-[#ff9f0a]' :
                            inc.magnitude === 2 ? 'bg-[#ffcc00]/20 text-[#ffd60a]' :
                            'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                          }`}>
                            {inc.magnitude === 4 ? 'Blocked' : inc.magnitude === 3 ? 'Major' : inc.magnitude === 2 ? 'Moderate' : 'Minor'}
                          </span>
                        </div>

                        <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-1 leading-relaxed">
                          {inc.eventText}
                        </p>
                        
                        {(inc.from || inc.to) && (
                          <div className="text-[9px] text-neutral-400 mt-1.5 truncate">
                            {inc.from} {inc.to ? `➔ ${inc.to}` : ''}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-850/50 text-[9px] font-mono text-neutral-400">
                          {inc.delay > 0 ? (
                            <span className="text-tertiary">
                              Delay: {Math.round(inc.delay / 60)} min
                            </span>
                          ) : (
                            <span>No delay</span>
                          )}
                          {inc.length > 0 && (
                            <span>
                              Queue: {(inc.length / 1000).toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-450 text-center py-6">
                    No traffic incidents detected in this area.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: LAYERS SELECTOR */}
          {activeTab === 'layers' && (
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block px-1">
                Base Layer Selection
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'map' as const, label: 'Vector Map', desc: 'Standard street view' },
                  { id: 'satellite' as const, label: 'Satellite', desc: 'True imagery' },
                  { id: 'hybrid' as const, label: 'Hybrid', desc: 'Imagery + Streets' },
                  { id: 'terrain' as const, label: 'Terrain', desc: 'Physiography' },
                  { id: '3D-buildings' as const, label: '3D Buildings', desc: 'Vector extrusion' },
                ].map((layer) => {
                  const isActive = layerSettings.baseLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => updateLayerSettings({ baseLayer: layer.id })}
                      className={`p-3 text-left rounded-card-sm border transition-all flex flex-col justify-between h-20 ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {layer.label}
                      </span>
                      <span className="text-[9px] text-neutral-450">
                        {layer.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-neutral-100/50 dark:bg-neutral-800/40 p-3.5 rounded-card-sm border border-neutral-200/50 dark:border-neutral-850/50 space-y-3 mt-4">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block">
                  Map Annotations
                </span>

                <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
                  <span>Display Labels & Boundaries</span>
                  <input
                    type="checkbox"
                    checked={layerSettings.showLabels}
                    onChange={(e) => updateLayerSettings({ showLabels: e.target.checked })}
                    className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIG / SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block">
                  TomTom API Key
                </label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Enter API Key..."
                    className="flex-grow bg-[#F2F2F7] dark:bg-neutral-900 border-none outline-none text-xs p-2.5 rounded-button text-foreground focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="bg-primary text-white text-xs font-semibold py-2 px-3 rounded-button hover:bg-primary/95 transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[9px] text-neutral-450 leading-normal">
                  The API key is required to query maps, flow traffic, routing navigation, and reverse geocode searches. Kept safely in your browser local storage.
                </p>
              </div>

              <div className="bg-neutral-105 dark:bg-neutral-900 p-3.5 rounded-card-sm border border-neutral-200 dark:border-neutral-850 space-y-3">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block">
                  Default Startup Target
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-neutral-400 block">Latitude</span>
                    <span className="font-mono font-semibold">20.5937 (India)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 block">Longitude</span>
                    <span className="font-mono font-semibold">78.9629 (India)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                  Developer Resources
                </span>
                <a
                  href="https://developer.tomtom.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-xs text-primary bg-primary/5 hover:bg-primary/10 p-2.5 rounded-button transition-colors font-semibold"
                >
                  <span>Request free TomTom API Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar toggle button (floating edge) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 left-full transform -translate-y-1/2 translate-x-[-1px] w-6 h-12 bg-white dark:bg-[#121214] text-neutral-500 hover:text-foreground border border-l-0 border-neutral-200 dark:border-neutral-800 rounded-r-md flex items-center justify-center shadow-md hover:scale-y-[1.03] transition-all cursor-pointer"
        title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
