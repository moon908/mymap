'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  UserRound, 
  Bike, 
  MapPin, 
  Compass, 
  Loader2, 
  Navigation2, 
  ArrowLeftRight, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { calculateRoute } from '../lib/routing';
import { getAutocompleteSuggestions, SearchResult } from '../lib/search';

export default function RoutingPanel() {
  const { 
    apiKey, 
    routeState, 
    setRouteState, 
    clearRoute, 
    isRouteLoading, 
    setIsRouteLoading 
  } = useMapStore();

  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  
  const [startSuggestions, setStartSuggestions] = useState<SearchResult[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<SearchResult[]>([]);

  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle autocomplete search
  useEffect(() => {
    const fetchStart = async () => {
      if (startInput.length < 2 || activeInput !== 'start') {
        setStartSuggestions([]);
        return;
      }
      const results = await getAutocompleteSuggestions(startInput, apiKey);
      setStartSuggestions(results);
    };

    const timer = setTimeout(fetchStart, 300);
    return () => clearTimeout(timer);
  }, [startInput, apiKey, activeInput]);

  useEffect(() => {
    const fetchEnd = async () => {
      if (endInput.length < 2 || activeInput !== 'end') {
        setEndSuggestions([]);
        return;
      }
      const results = await getAutocompleteSuggestions(endInput, apiKey);
      setEndSuggestions(results);
    };

    const timer = setTimeout(fetchEnd, 300);
    return () => clearTimeout(timer);
  }, [endInput, apiKey, activeInput]);

  // Sync inputs with selected coordinates (e.g. if set from map)
  useEffect(() => {
    if (routeState.startAddress) {
      setStartInput(routeState.startAddress);
    }
  }, [routeState.startAddress]);

  useEffect(() => {
    if (routeState.endAddress) {
      setEndInput(routeState.endAddress);
    }
  }, [routeState.endAddress]);

  const handleSelectSuggestion = (item: SearchResult, type: 'start' | 'end') => {
    if (type === 'start') {
      setRouteState({
        startAddress: item.name + ', ' + item.address,
        startCoords: [item.lng, item.lat],
      });
      setStartInput(item.name);
      setStartSuggestions([]);
    } else {
      setRouteState({
        endAddress: item.name + ', ' + item.address,
        endCoords: [item.lng, item.lat],
      });
      setEndInput(item.name);
      setEndSuggestions([]);
    }
    setActiveInput(null);
  };

  const handleCalculate = async () => {
    setErrorMsg('');
    const { startCoords, endCoords, mode, avoidTolls, avoidHighways } = routeState;
    if (!startCoords || !endCoords) {
      setErrorMsg('Please specify both start and destination points.');
      return;
    }

    setIsRouteLoading(true);
    try {
      const result = await calculateRoute(
        startCoords,
        endCoords,
        apiKey,
        mode,
        avoidTolls,
        avoidHighways
      );

      if (result) {
        setRouteState({ routeResult: result });
      } else {
        setErrorMsg('Could not find a valid route between these locations.');
      }
    } catch {
      setErrorMsg('Error calculating route. Please verify your API Key.');
    } finally {
      setIsRouteLoading(false);
    }
  };

  const handleSwap = () => {
    const { startAddress, startCoords, endAddress, endCoords } = routeState;
    setRouteState({
      startAddress: endAddress,
      startCoords: endCoords,
      endAddress: startAddress,
      endCoords: startCoords,
    });
    setStartInput(endAddress);
    setEndInput(startAddress);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs} hr ${remainingMins} mins`;
  };

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* Route Inputs Panel */}
      <div className="relative space-y-3 bg-neutral-100/50 dark:bg-neutral-800/40 p-3.5 rounded-card-sm border border-neutral-200/50 dark:border-neutral-850/50">
        
        {/* Swap button */}
        <button 
          onClick={handleSwap}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 p-2 bg-white dark:bg-neutral-800 text-neutral-500 hover:text-primary rounded-full shadow-sm border border-neutral-200 dark:border-neutral-700 z-10 hover:scale-105 transition-all"
          title="Swap Start and Destination"
        >
          <ArrowLeftRight className="w-4 h-4 rotate-90" />
        </button>

        {/* Start Point Input */}
        <div className="relative">
          <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block mb-1">
            Start Location
          </label>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-primary absolute left-3 top-[32px]" />
            <input
              type="text"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              onFocus={() => setActiveInput('start')}
              placeholder="Search origin..."
              className="w-full bg-white dark:bg-neutral-900 border-none outline-none text-sm p-2.5 pl-9 rounded-button shadow-sm"
            />
          </div>

          {/* Autocomplete list */}
          {activeInput === 'start' && startSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-card-sm shadow-lg max-h-48 overflow-y-auto z-20">
              {startSuggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item, 'start')}
                  className="w-full text-left p-2 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-xs border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  <div className="font-semibold text-foreground truncate">{item.name}</div>
                  <div className="text-neutral-400 truncate text-[10px]">{item.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div className="relative">
          <label className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 block mb-1">
            Destination
          </label>
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-secondary absolute left-3 top-[32px]" />
            <input
              type="text"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              onFocus={() => setActiveInput('end')}
              placeholder="Search destination..."
              className="w-full bg-white dark:bg-neutral-900 border-none outline-none text-sm p-2.5 pl-9 pr-10 rounded-button shadow-sm"
            />
          </div>

          {/* Autocomplete list */}
          {activeInput === 'end' && endSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-card-sm shadow-lg max-h-48 overflow-y-auto z-20">
              {endSuggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item, 'end')}
                  className="w-full text-left p-2 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-xs border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  <div className="font-semibold text-foreground truncate">{item.name}</div>
                  <div className="text-neutral-400 truncate text-[10px]">{item.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Travel Modes (Segmented control) */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-card-sm">
        {[
          { id: 'driving' as const, icon: <Car className="w-4 h-4" />, label: 'Drive' },
          { id: 'walking' as const, icon: <UserRound className="w-4 h-4" />, label: 'Walk' },
          { id: 'cycling' as const, icon: <Bike className="w-4 h-4" />, label: 'Bike' },
        ].map((mode) => {
          const isActive = routeState.mode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setRouteState({ mode: mode.id })}
              className={`py-2 px-2.5 rounded-button text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-secondary text-primary font-semibold shadow-sm'
                  : 'text-neutral-500 hover:text-foreground'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Avoid Options */}
      <div className="flex items-center space-x-4 px-1 py-1">
        <label className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={routeState.avoidTolls}
            onChange={(e) => setRouteState({ avoidTolls: e.target.checked })}
            className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
          />
          <span>Avoid Tolls</span>
        </label>

        <label className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={routeState.avoidHighways}
            onChange={(e) => setRouteState({ avoidHighways: e.target.checked })}
            className="rounded text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
          />
          <span>Avoid Highways</span>
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleCalculate}
          disabled={isRouteLoading}
          className="flex-grow bg-primary text-white py-2.5 px-4 rounded-button text-xs font-semibold hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md"
        >
          {isRouteLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <Navigation2 className="w-4 h-4 fill-white" />
              <span>Get Directions</span>
            </>
          )}
        </button>

        {(routeState.routeResult || routeState.startCoords || routeState.endCoords) && (
          <button
            onClick={() => {
              clearRoute();
              setStartInput('');
              setEndInput('');
            }}
            className="bg-neutral-200 dark:bg-neutral-800 text-foreground py-2.5 px-3.5 rounded-button text-xs font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center space-x-2 p-2 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-card-sm text-xs text-[#ff453a]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Route Results Summary Panel */}
      {routeState.routeResult && (
        <div className="bg-neutral-100/50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-800/50 p-4 rounded-card-md space-y-4">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
              Directions Summary
            </h4>
            <span className="text-[10px] font-mono text-neutral-400 capitalize bg-neutral-200/50 dark:bg-neutral-900/60 px-1.5 py-0.5 rounded">
              {routeState.mode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                Distance
              </span>
              <p className="text-lg font-bold text-primary font-sans leading-none">
                {formatDistance(routeState.routeResult.distance)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                Duration
              </span>
              <p className="text-lg font-bold text-primary font-sans leading-none">
                {formatDuration(routeState.routeResult.duration)}
              </p>
            </div>
          </div>

          {/* Elevation Profile Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Simulated Elevation Profile</span>
              </span>
              <span className="text-[9px] font-mono text-neutral-400">
                100m - 160m
              </span>
            </div>
            
            {/* Simple sparkline profile representation using CSS background gradient or SVG */}
            <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-950/80 rounded-card-sm overflow-hidden relative flex items-end">
              <svg className="w-full h-full text-secondary opacity-35" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  d="M0,20 Q15,5 30,12 T60,2 T85,15 L100,20 Z"
                  fill="currentColor"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[9px] font-mono text-neutral-500 tracking-wide">
                  Elevation profile loaded
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
