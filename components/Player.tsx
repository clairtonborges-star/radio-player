import React, { useState, useEffect, useRef } from 'react';
import { RadioStation } from '../types';
import Visualizer from './Visualizer';

interface PlayerProps {
  station: RadioStation | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const Player: React.FC<PlayerProps> = ({ station, isPlaying, setIsPlaying, volume, setVolume }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const retryMode = useRef<'resolved' | 'original' | 'failed'>('resolved');

  // Estados dos controles de áudio
  const [balance, setBalance] = useState(0); // -100 a 100
  const [tone, setTone] = useState(0); // -100 a 100 (Negativo = Graves, Positivo = Agudos)

  // Refs para Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const bassNodeRef = useRef<BiquadFilterNode | null>(null);
  const trebleNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Inicialização do grafo de áudio
  useEffect(() => {
    if (!audioRef.current) return;

    const initAudioContext = () => {
      if (audioCtxRef.current) return;

      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaElementSource(audioRef.current!);
        
        const panner = ctx.createStereoPanner();
        const bass = ctx.createBiquadFilter();
        const treble = ctx.createBiquadFilter();
        const analyser = ctx.createAnalyser();

        analyser.fftSize = 64; // Tamanho ideal para visualizador de 12 barras

        bass.type = 'lowshelf';
        bass.frequency.value = 250;
        
        treble.type = 'highshelf';
        treble.frequency.value = 3500;

        // Conexão do grafo: Source -> Bass -> Treble -> Panner -> Analyser -> Destination
        source.connect(bass);
        bass.connect(treble);
        treble.connect(panner);
        panner.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        pannerNodeRef.current = panner;
        bassNodeRef.current = bass;
        trebleNodeRef.current = treble;
        analyserNodeRef.current = analyser;
      } catch (e) {
        console.warn("Web Audio API não suportada ou bloqueada", e);
      }
    };

    const handleFirstClick = () => {
      initAudioContext();
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  // Atualização dos parâmetros de áudio em tempo real
  useEffect(() => {
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = balance / 100;
    }
  }, [balance]);

  useEffect(() => {
    if (bassNodeRef.current && trebleNodeRef.current) {
      const bassGain = tone < 0 ? (Math.abs(tone) / 100) * 12 : 0;
      const trebleGain = tone > 0 ? (tone / 100) * 12 : 0;
      bassNodeRef.current.gain.setTargetAtTime(bassGain, audioCtxRef.current?.currentTime || 0, 0.1);
      trebleNodeRef.current.gain.setTargetAtTime(trebleGain, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [tone]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [isPlaying]);

  const cleanAudioElement = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src'); 
      audio.load();
      setCurrentUrl('');
    }
  };

  const startPlayback = async (url: string) => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    try {
      setIsLoading(true);
      setError(null);
      setCurrentUrl(url);

      audio.pause();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      audio.load();

      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
      setIsLoading(false);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      handlePlaybackError();
    }
  };

  const handlePlaybackError = () => {
    if (!station) return;
    if (retryMode.current === 'resolved') {
      retryMode.current = 'original';
      const audio = audioRef.current;
      if (audio) audio.removeAttribute('crossOrigin');
      startPlayback(station.url);
    } else {
      retryMode.current = 'failed';
      setIsLoading(false);
      setIsPlaying(false);
      const isMixedContent = window.location.protocol === 'https:' && currentUrl.startsWith('http://');
      setError(isMixedContent ? "Erro: Bloqueio de rádio HTTP." : "Estação offline.");
    }
  };

  useEffect(() => {
    retryMode.current = 'resolved';
    if (!station) {
      cleanAudioElement();
      return;
    }
    const targetUrl = station.url_resolved || station.url;
    if (targetUrl) startPlayback(targetUrl);
    return () => cleanAudioElement();
  }, [station]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !station || !audio.src) return;
    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch(e => { if (e.name !== 'AbortError') handlePlaybackError(); });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => { setIsLoading(false); setError(null); };
    const handleError = () => { if (!audio.src || audio.src === window.location.href) return; handlePlaybackError(); };
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, [currentUrl, station]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-2xl border-t border-slate-800 p-4 z-50 shadow-[0_-10px_50px_rgba(0,0,0,0.6)]">
      {/* Layout Grid de Precisão */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
        
        {/* LADO ESQUERDO: Estação Atual (Largura Determinada) */}
        <div className="flex items-center gap-4 w-full md:w-[280px] flex-shrink-0">
          <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
            {station?.favicon ? (
              <img src={station.favicon} alt={station.name} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3133/3133615.png')} />
            ) : (
              <span className="text-2xl opacity-50">📻</span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-white truncate text-sm">{station ? station.name : "Selecione uma rádio"}</h3>
            <p className="text-xs text-slate-500 truncate">{station?.country || "Pronto para tocar"}</p>
          </div>
        </div>

        {/* BOTÃO PLAY (Âncora Esquerda para os Sliders) */}
        <div className="flex items-center justify-center flex-shrink-0">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!station || isLoading}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${!station ? 'bg-slate-700 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'}`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        </div>

        {/* ÁREA DOS SLIDERS: Container de Preenchimento (flex-1) com Centralização Automática */}
        <div className="hidden lg:flex flex-1 items-center justify-center h-14">
          <div className="flex flex-col justify-center gap-6 w-[420px]">
            {/* Balanço Estéreo - Informações nas Laterais Extremas */}
            <div className="flex items-center gap-4 group">
              <div className="w-24 shrink-0 text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">L / BALANÇO</span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={balance} 
                onChange={(e) => setBalance(Number(e.target.value))} 
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
              />
              <div className="w-24 shrink-0 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">R</span>
                <span className="text-[10px] text-indigo-400 font-bold leading-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {balance > 0 ? `+${balance}` : balance}
                </span>
              </div>
            </div>
            
            {/* Tonalidade Graves/Agudos - Informações nas Laterais Extremas */}
            <div className="flex items-center gap-4 group">
              <div className="w-24 shrink-0 text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">GRAVES / TOM</span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={tone} 
                onChange={(e) => setTone(Number(e.target.value))} 
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
              />
              <div className="w-24 shrink-0 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">AGUDOS</span>
                <span className="text-[10px] text-indigo-400 font-bold leading-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {tone > 0 ? `+${tone}` : tone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Visualizador e Volume (Âncora Direita para os Sliders) */}
        <div className="flex items-center gap-6 flex-shrink-0 md:w-[320px] justify-end">
          {/* Linha Divisória e Visualizador */}
          <div className="hidden lg:flex items-center justify-center w-36 h-10 border-l border-slate-800 pl-4">
            <Visualizer analyserNode={analyserNodeRef.current} isPlaying={isPlaying && !isLoading && !error} />
          </div>
          {/* Controle de Volume */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">VOLUME</span>
            <div className="flex items-center bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
              <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-32 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Exibição de Erro em Overlay Discreta */}
      {error && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-2">
          <span className="text-[10px] text-red-400 font-bold bg-red-950/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-900/50 shadow-lg">{error}</span>
        </div>
      )}
      
      <audio ref={audioRef} preload="none" />
    </div>
  );
};

export default Player;