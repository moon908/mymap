'use client';

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Trash2, 
  MapPin, 
  CloudSun, 
  Car, 
  Compass, 
  ExternalLink, 
  Save, 
  Check,
  Navigation
} from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { Marker } from '../types/map';
import { reverseGeocode } from '../lib/geocode';

interface MarkerPopupProps {
  marker: Marker;
  apiKey: string;
  onUpdate: (id: string, updates: Partial<Marker>) => void;
  onDelete: (id: string) => void;
  onSaveBookmark: (marker: Marker) => void;
  isBookmarked: boolean;
}

const colors = [
  '#007AFF', // Primary Blue
  '#5856D6', // Royal Purple
  '#D75800', // Amber Orange
  '#ff3b30', // Red
  '#34c759', // Green
  '#ff9500', // Orange
  '#000000', // Black
];

export default function MarkerPopup({
  marker,
  apiKey,
  onUpdate,
  onDelete,
  onSaveBookmark,
  isBookmarked,
}: MarkerPopupProps) {
  const { setRouteState } = useMapStore();
  const [title, setTitle] = useState(marker.title || '');
  const [description, setDescription] = useState(marker.description || '');
  
  const handleDirections = () => {
    setRouteState({
      endAddress: marker.title || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`,
      endCoords: [marker.lng, marker.lat],
    });
    window.dispatchEvent(new CustomEvent('switch-sidebar-tab', { detail: 'route' }));
  };
  const [color, setColor] = useState(marker.color || '#007AFF');
  const [address, setAddress] = useState('Fetching address...');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch reverse geocode address
  useEffect(() => {
    let active = true;
    const fetchAddress = async () => {
      const addr = await reverseGeocode(marker.lat, marker.lng, apiKey);
      if (active) {
        setAddress(addr || 'Unknown Address');
      }
    };
    fetchAddress();
    return () => {
      active = false;
    };
  }, [marker.lat, marker.lng, apiKey]);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdate = () => {
    onUpdate(marker.id, { title, description, color });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="w-72 p-3 font-sans text-neutral-800 dark:text-neutral-100 flex flex-col space-y-3">
      {/* Header Coordinate Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center space-x-1 text-xs text-neutral-450 dark:text-neutral-400">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px]">
            {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
          </span>
        </div>
        <button
          onClick={handleCopyCoords}
          className="p-1 rounded text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Copy Coordinates"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Inputs Section */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Marker Title..."
          className="w-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-900 border-none outline-none p-2 rounded-button text-foreground focus:ring-1 focus:ring-primary/20"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description..."
          rows={2}
          className="w-full text-[10px] bg-neutral-100 dark:bg-neutral-900 border-none outline-none p-2 rounded-button text-foreground resize-none focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Address & Road */}
      <div className="space-y-1 text-[9px] text-neutral-500 dark:text-neutral-400 font-sans bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-card-sm">
        <div className="truncate" title={address}>
          <strong>Address:</strong> {address}
        </div>
        <div className="flex items-center space-x-1 text-neutral-400 mt-1">
          <Compass className="w-3 h-3 text-secondary" />
          <span>Nearest Road: NH-44 (Primary Highway)</span>
        </div>
      </div>

      {/* Placeholders (Weather / Traffic) */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-neutral-900/50 p-1.5 rounded-card-sm">
          <CloudSun className="w-3.5 h-3.5 text-amber-500" />
          <span>28°C // Clear</span>
        </div>
        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-neutral-900/50 p-1.5 rounded-card-sm">
          <Car className="w-3.5 h-3.5 text-primary" />
          <span>Light Traffic</span>
        </div>
      </div>

      {/* Color Selector */}
      <div className="flex items-center space-x-1.5 py-0.5">
        <span className="text-[9px] font-mono text-neutral-400">Accent:</span>
        <div className="flex items-center space-x-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                color === c 
                  ? 'border-white ring-1 ring-primary scale-110' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex space-x-1">
          {/* Save Button */}
          <button
            onClick={handleUpdate}
            className="flex items-center space-x-1 bg-primary text-white py-1 px-2.5 rounded-button text-[10px] font-semibold hover:bg-primary/95 transition-colors"
          >
            {isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            <span>Save</span>
          </button>

          {/* Save to Bookmarks */}
          <button
            onClick={() => onSaveBookmark(marker)}
            disabled={isBookmarked}
            className={`py-1 px-2.5 rounded-button text-[10px] font-semibold border transition-all ${
              isBookmarked
                ? 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-400'
                : 'border-neutral-200 dark:border-neutral-700 text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>

        <div className="flex space-x-1">
          {/* Directions Button */}
          <button
            onClick={handleDirections}
            className="p-1.5 rounded text-neutral-450 hover:text-primary hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
            title="Get Directions"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Open Google Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded text-neutral-450 hover:text-foreground hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Delete Marker */}
          <button
            onClick={() => onDelete(marker.id)}
            className="p-1.5 rounded text-neutral-450 hover:text-tertiary hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
            title="Delete Marker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
