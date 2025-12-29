
export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  votes: number;
  clickcount: number;
  codec: string;
  bitrate: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  searchQuery: string;
  stations: RadioStation[];
  isLoading: boolean;
  favorites: string[];
}
