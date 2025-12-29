import { RadioStation } from '../types';

const APP_NAME = "AIRadioExplorer_v2";

// Lista de espelhos oficiais da Radio Browser API para garantir redundância
// Inclui o ponto de entrada DNS round-robin 'all' para melhor balanceamento
const MIRRORS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info"
];

let currentMirrorIndex = 0;

/**
 * Função principal de busca que tenta múltiplos espelhos em sequência.
 * Se um espelho falhar com 'Failed to fetch' ou timeout, o próximo da lista é tentado automaticamente.
 */
export const fetchStations = async (params: string = "stations/topvote/100"): Promise<RadioStation[]> => {
  // Tenta cada espelho na lista para contornar falhas de rede ou bloqueios de CORS
  for (let i = 0; i < MIRRORS.length; i++) {
    const mirrorIndex = (currentMirrorIndex + i) % MIRRORS.length;
    const baseUrl = MIRRORS[mirrorIndex];
    const separator = params.includes('?') ? '&' : '?';
    const url = `${baseUrl}/json/${params}${separator}hidebroken=true`;
    
    try {
      const controller = new AbortController();
      // Aumentado para 10 segundos para lidar com espelhos mais lentos
      const timeoutId = setTimeout(() => controller.abort(), 10000); 

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sucesso: memoriza este servidor para as próximas chamadas
          currentMirrorIndex = mirrorIndex;
          return data;
        }
      }
    } catch (error) {
      console.warn(`Tentativa falhou no espelho ${baseUrl}. Tentando próximo...`);
    }
  }

  console.error("Todos os espelhos da API de rádio falharam ao responder.");
  return [];
};

export const searchByTag = async (tag: string): Promise<RadioStation[]> => {
  return fetchStations(`stations/bytag/${encodeURIComponent(tag)}?limit=60&order=clickcount&reverse=true`);
};

export const searchByName = async (name: string): Promise<RadioStation[]> => {
  return fetchStations(`stations/byname/${encodeURIComponent(name)}?limit=60&order=votes&reverse=true`);
};

export const searchByCountry = async (country: string): Promise<RadioStation[]> => {
  return fetchStations(`stations/bycountry/${encodeURIComponent(country)}?limit=60&order=votes&reverse=true`);
};
