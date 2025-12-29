import React from 'react';
import { RadioStation } from '../types';

interface StationCardProps {
  station: RadioStation;
  isActive: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, isActive, isPlaying, isFavorite, onPlay, onToggleFavorite }) => {
  return (
    <div 
      onClick={() => onPlay(station)}
      className={`group relative bg-slate-800/40 border p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-800/60 hover:-translate-y-1 ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700'}`}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(station);
        }}
        className="absolute top-3 right-3 z-10 p-1.5 transition-transform active:scale-90"
      >
        <svg 
          className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-slate-500 hover:text-slate-300'}`} 
          fill={isFavorite ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 relative">
          {station.favicon ? (
            <img 
              src={station.favicon} 
              alt={station.name} 
              className="w-full h-full object-cover" 
              onError={(e) => (e.currentTarget.src = 'https://picsum.photos/100/100')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📻</div>
          )}
          
          <div className={`absolute inset-0 bg-indigo-600/40 flex items-center justify-center transition-opacity ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isActive && isPlaying ? (
               <div className="flex gap-1 items-end h-4">
                  <div className="w-1 bg-white animate-[bounce_0.6s_infinite]"></div>
                  <div className="w-1 bg-white animate-[bounce_0.8s_infinite]"></div>
                  <div className="w-1 bg-white animate-[bounce_1s_infinite]"></div>
               </div>
            ) : (
              <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-bold text-white truncate text-sm">{station.name}</h3>
          <p className="text-xs text-slate-400 truncate mt-1">{station.country} • {station.tags?.split(',').slice(0, 2).join(', ') || 'Global'}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-slate-500 uppercase tracking-tighter">
            <span className="bg-slate-700 px-1.5 py-0.5 rounded">{station.codec}</span>
            <span className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              {station.votes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationCard;