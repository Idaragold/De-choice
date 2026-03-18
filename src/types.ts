export interface MenuItem {
  id: string;
  name: string;
  category: 'Rice' | 'Local' | 'Fast Food' | 'Proteins' | 'Drinks';
  description: string;
  price?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
