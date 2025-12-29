import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

/**
 * Visualizer funcional que reage ao áudio em tempo real.
 * Utiliza o AnalyserNode do Web Audio API para extrair dados de frequência.
 */
const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 12;
    // Buffer para os dados de frequência (metade do fftSize)
    const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 32);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Se pausado, limpa o array para as barras baixarem suavemente
        dataArray.fill(0);
      }

      const barWidth = (canvas.width / barCount) - 2;
      
      for (let i = 0; i < barCount; i++) {
        // Mapeia os bins de frequência para as 12 barras (pula os bins mais altos que costumam ser vazios)
        const val = dataArray[i * 2] || 0;
        // Normaliza o valor (0-255) para a altura do canvas (32px)
        const barHeight = (val / 255) * canvas.height;
        
        const x = i * (barWidth + 2);
        
        // Gradiente Colorido Vibrante (Indigo -> Purple -> Pink)
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#4f46e5'); // Indigo
        gradient.addColorStop(0.5, '#c084fc'); // Purple
        gradient.addColorStop(1, '#f472b6'); // Pink
        
        ctx.fillStyle = gradient;
        
        // Desenha a barra com uma altura mínima de 2px para estética
        const finalHeight = Math.max(2, barHeight);
        ctx.fillRect(x, canvas.height - finalHeight, barWidth, finalHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, analyserNode]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={32} 
      className="w-full h-full opacity-90 pointer-events-none"
    />
  );
};

export default Visualizer;