import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import StationCard from './components/StationCard';
import { RadioStation } from './types';
import { fetchStations, searchByTag, searchByName } from './services/radioApi';

const App: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para persistência de favoritos
  const [favoriteStations, setFavoriteStations] = useState<RadioStation[]>(() => {
    const saved = localStorage.getItem('airadio_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar favoritos sempre que houver mudança
  useEffect(() => {
    localStorage.setItem('airadio_favorites', JSON.stringify(favoriteStations));
  }, [favoriteStations]);

  // Efeito para atualizar o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sincronizar visualização de favoritos se estiver ativa
  useEffect(() => {
    if (activeCategory === 'favorites') {
      setStations(favoriteStations);
    }
  }, [favoriteStations, activeCategory]);

  // Função para buscar o conjunto expandido de rádios (Preservando as 339 originais + Novas)
  const fetchExpandedStations = useCallback(async () => {
    try {
      const [
        topGlobal, topBrazil, topGermany, topJapan, // Originais (339 aprox)
        topUSA, topUK, topMexico, topCanada,         // Novas (+100)
        topSpain, topPortugal, topItaly, topNetherlands
      ] = await Promise.all([
        fetchStations("stations/topvote/100"),
        fetchStations("stations/bycountry/brazil?limit=80&order=votes&reverse=true"),
        fetchStations("stations/bycountry/germany?limit=80&order=votes&reverse=true"),
        fetchStations("stations/bycountry/japan?limit=80&order=votes&reverse=true"),
        // Expansão Curada
        fetchStations("stations/bycountry/united states?limit=30&order=votes&reverse=true"),
        fetchStations("stations/bycountry/united kingdom?limit=30&order=votes&reverse=true"),
        fetchStations("stations/bycountry/mexico?limit=25&order=votes&reverse=true"),
        fetchStations("stations/bycountry/canada?limit=25&order=votes&reverse=true"),
        fetchStations("stations/bycountry/spain?limit=25&order=votes&reverse=true"),
        fetchStations("stations/bycountry/portugal?limit=25&order=votes&reverse=true"),
        fetchStations("stations/bycountry/italy?limit=25&order=votes&reverse=true"),
        fetchStations("stations/bycountry/netherlands?limit=25&order=votes&reverse=true"),
      ]);
      
      const combined = [
        ...topGlobal, ...topBrazil, ...topGermany, ...topJapan,
        ...topUSA, ...topUK, ...topMexico, ...topCanada,
        ...topSpain, ...topPortugal, ...topItaly, ...topNetherlands
      ];

      // Deduplicação por stationuuid mantendo a ordem de inserção 
      // (Isso garante que as rádios originais permaneçam no topo e intactas)
      const uniqueMap = new Map();
      combined.forEach(s => {
        if (!uniqueMap.has(s.stationuuid)) {
          uniqueMap.set(s.stationuuid, s);
        }
      });
      
      return Array.from(uniqueMap.values());
    } catch (e) {
      console.error("Erro ao buscar rádios expandidas:", e);
      return [];
    }
  }, []);

  const loadInitialStations = useCallback(async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      const data = await fetchExpandedStations();
      if (data && data.length > 0) {
        setStations(data);
      } else {
        setApiError(true);
      }
    } catch (e) {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchExpandedStations]);

  useEffect(() => {
    loadInitialStations();
  }, [loadInitialStations]);

  const handleCategorySelect = async (id: string) => {
    setActiveCategory(id);
    setIsLoading(true);
    setApiError(false);
    try {
      let data;
      if (id === 'favorites') {
        data = favoriteStations;
      } else if (id === 'top') {
        data = await fetchExpandedStations();
      } else {
        data = await searchByTag(id);
      }
      setStations(data || []);
      if (id !== 'favorites' && (!data || data.length === 0)) setApiError(true);
    } catch (e) {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTags = async (tags: string[]) => {
    setActiveCategory('');
    setIsLoading(true);
    setApiError(false);
    try {
      const tag = tags[0] || 'music';
      const data = await searchByTag(tag);
      setStations(data || []);
      if (!data || data.length === 0) setApiError(true);
    } catch (e) {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setApiError(false);
    try {
      const data = await searchByName(searchQuery);
      setStations(data || []);
      if (!data || data.length === 0) setApiError(true);
    } catch (e) {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayStation = (station: RadioStation) => {
    if (currentStation?.stationuuid === station.stationuuid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const handleToggleFavorite = (station: RadioStation) => {
    setFavoriteStations(prev => {
      const isFav = prev.find(s => s.stationuuid === station.stationuuid);
      if (isFav) {
        return prev.filter(s => s.stationuuid !== station.stationuuid);
      }
      return [...prev, station];
    });
  };

  // Formatação da data e hora
  const formattedDateTime = `${currentTime.toLocaleDateString('pt-BR')} - ${currentTime.toLocaleTimeString('pt-BR')}`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar 
        onCategorySelect={handleCategorySelect} 
        onSearchTags={handleSearchTags}
        activeCategory={activeCategory}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleManualSearch} className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar rádio..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2.5 px-5 pl-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
            <p className="text-sm italic text-slate-500 mt-2 px-5">Copyright by CLAIRTON BORGES</p>
          </div>
          <div className="flex items-center gap-4 ml-6">
             <div className="hidden md:flex flex-col text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status da API</span>
                <span className={`text-sm font-bold ${apiError ? 'text-red-400' : 'text-green-400'}`}>
                  {apiError ? 'Desconectado' : 'Online'}
                </span>
                <span className="text-xs text-slate-500 mt-1 font-mono tabular-nums whitespace-nowrap">
                  {formattedDateTime}
                </span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">
                {activeCategory ? (
                  activeCategory === 'top' ? 'Populares' : 
                  activeCategory === 'favorites' ? 'Meus Favoritos' : 
                  `Gênero: ${activeCategory}`
                ) : 'Resultados'}
              </h2>
              <span className="text-sm text-slate-500 font-medium">{stations.length} estações</span>
            </div>

            {apiError && !isLoading && (
              <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Parece que o serviço de rádio está com instabilidade. Tentando reconectar automaticamente...
                <button onClick={loadInitialStations} className="ml-auto underline font-bold">Tentar agora</button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-900/50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : stations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.map(station => (
                  <StationCard 
                    key={station.stationuuid} 
                    station={station}
                    isActive={currentStation?.stationuuid === station.stationuuid}
                    isPlaying={isPlaying}
                    isFavorite={favoriteStations.some(s => s.stationuuid === station.stationuuid)}
                    onPlay={handlePlayStation}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <p>{activeCategory === 'favorites' ? 'Você ainda não adicionou favoritos.' : 'Nenhuma rádio encontrada.'}</p>
                <button onClick={loadInitialStations} className="mt-4 text-indigo-400 hover:underline">Recarregar</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Player 
        station={currentStation} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
};

export default App;