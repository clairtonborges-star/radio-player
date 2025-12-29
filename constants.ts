
export const RADIO_API_BASE = "https://all.api.radio-browser.info/json";

export const CATEGORIES = [
  { id: 'top', label: 'Mais Votadas', icon: '🔥' },
  { id: 'jazz', label: 'Jazz', icon: '🎷' },
  { id: 'rock', label: 'Rock', icon: '🎸' },
  { id: 'lofi', label: 'Lofi', icon: '☕' },
  { id: 'classical', label: 'Clássica', icon: '🎻' },
  { id: 'electronic', label: 'Eletrônica', icon: '🎹' },
  { id: 'pop', label: 'Pop', icon: '🎵' },
  { id: 'news', label: 'Notícias', icon: '📻' },
];

export const DJ_PROMPT = `Você é o AI Radio DJ, um especialista em música global. 
Sua tarefa é ajudar o usuário a encontrar as melhores estações de rádio online usando a Radio Browser API.
Quando o usuário pedir recomendações:
1. Analise o humor, gênero ou contexto.
2. Sugira 2-3 tags de busca curtas e eficientes (ex: 'jazz', 'chillout', '80s').
3. Seja breve, animado e fale em Português do Brasil.
A saída DEVE ser um JSON seguindo o esquema fornecido.`;
