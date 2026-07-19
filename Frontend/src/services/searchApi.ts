const API_URL = 'http://localhost:8000';

export interface SearchResult {
  id: string;
  type: 'note' | 'chat' | 'project' | 'task' | 'document' | 'goal' | 'fact';
  title: string;
  snippet: string;
  similarity: number;
  conversation_id?: string;
}

export const searchApi = {
  searchAll: async (query: string): Promise<SearchResult[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Search request failed');
    }
    
    return await response.json();
  }
};
