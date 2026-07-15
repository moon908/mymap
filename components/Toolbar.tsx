'use client';

import React from 'react';
import { 
  MapPin, 
  Slash, 
  Hexagon, 
  Square, 
  Circle, 
  Ruler, 
  AreaChart, 
  Undo2, 
  Redo2, 
  Trash2 
} from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { DrawingType } from '../types/map';

export default function Toolbar() {
  const { 
    activeDrawingTool, 
    setActiveDrawingTool, 
    clearDrawings, 
    undoDrawing, 
    redoDrawing, 
    undoStack, 
    redoStack,
    drawings
  } = useMapStore();

  const handleToolClick = (tool: DrawingType | 'measure-distance' | 'measure-area') => {
    if (activeDrawingTool === tool) {
      setActiveDrawingTool(null); // Toggle off
    } else {
      setActiveDrawingTool(tool);
    }
  };

  const tools = [
    { id: 'Point' as DrawingType, label: 'Add Point', icon: <MapPin className="w-4 h-4" /> },
    { id: 'LineString' as DrawingType, label: 'Draw Line', icon: <Slash className="w-4 h-4" /> },
    { id: 'Polygon' as DrawingType, label: 'Draw Polygon', icon: <Hexagon className="w-4 h-4" /> },
    { id: 'Rectangle' as DrawingType, label: 'Draw Rectangle', icon: <Square className="w-4 h-4" /> },
    { id: 'Circle' as DrawingType, label: 'Draw Circle', icon: <Circle className="w-4 h-4" /> },
    { id: 'measure-distance' as const, label: 'Measure Distance', icon: <Ruler className="w-4 h-4" /> },
    { id: 'measure-area' as const, label: 'Measure Area', icon: <AreaChart className="w-4 h-4" /> },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2">
      {/* Drawing tools capsule */}
      <div className="glass-panel flex items-center p-1.5 rounded-card-sm shadow-md space-x-1">
        {tools.map((tool) => {
          const isActive = activeDrawingTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`relative group p-2 rounded-button transition-all flex items-center justify-center ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={tool.label}
            >
              {tool.icon}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
                {tool.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Undo/Redo/Clear capsule */}
      <div className="glass-panel flex items-center p-1.5 rounded-card-sm shadow-md space-x-1">
        {/* Undo */}
        <button
          onClick={undoDrawing}
          disabled={undoStack.length === 0}
          className="relative group p-2 rounded-button text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
          title="Undo Drawing"
        >
          <Undo2 className="w-4 h-4" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Undo
          </div>
        </button>

        {/* Redo */}
        <button
          onClick={redoDrawing}
          disabled={redoStack.length === 0}
          className="relative group p-2 rounded-button text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
          title="Redo Drawing"
        >
          <Redo2 className="w-4 h-4" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Redo
          </div>
        </button>

        <div className="w-[1px] h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Delete / Clear */}
        <button
          onClick={clearDrawings}
          disabled={drawings.length === 0}
          className="relative group p-2 rounded-button text-neutral-600 dark:text-neutral-300 hover:text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center justify-center"
          title="Clear All Drawings"
        >
          <Trash2 className="w-4 h-4" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Clear All
          </div>
        </button>
      </div>
    </div>
  );
}
