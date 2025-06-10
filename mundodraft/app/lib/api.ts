const API_BASE_URL = 'https://23.88.176.69:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: unknown[];
  timestamp?: string;
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  tags: string[];
  info: {
    difficulty: number;
    attack: number;
    defense: number;
    magic: number;
  };
  image: {
    url: string;
  };
  pick_rate?: number;
  ban_rate?: number;
  win_rate?: number;
}

export interface DraftSession {
  id: string;
  unique_id: string;
  creator_id: string;
  status: 'WAITING' | 'DRAFTING' | 'COMPLETED' | 'CANCELLED';
  current_turn: number;
  current_team: 'BLUE' | 'RED';
  current_phase: string;
  Teams: Team[];
}

export interface Team {
  side: 'BLUE' | 'RED';
  name: string;
  players: {
    TOP?: string;
    JUNGLE?: string;
    MID?: string;
    ADC?: string;
    SUPPORT?: string;
  };
}

export interface Selection {
  turn: number;
  team: 'BLUE' | 'RED';
  action: 'BAN' | 'PICK';
  champion: Champion;
  role?: string;
  time_taken?: number;
}

export interface DraftStatus {
  id: string;
  status: 'WAITING' | 'DRAFTING' | 'COMPLETED' | 'CANCELLED';
  currentTurn: number;
  currentTeam: 'BLUE' | 'RED';
  currentPhase: string;
  timerEnd?: string;
  teams: {
    blue: {
      name: string;
      side: 'BLUE';
      totalPicks: number;
      totalBans: number;
    };
    red: {
      name: string;
      side: 'RED';
      totalPicks: number;
      totalBans: number;
    };
  };
  selections: Selection[];
}

export interface ChampionsResponse {
  champions: Champion[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Draft endpoints
  async getDraft(draftId: string): Promise<ApiResponse<DraftSession>> {
    return this.request<DraftSession>(`/drafts/${draftId}`);
  }

  async getDraftStatus(draftId: string): Promise<ApiResponse<DraftStatus>> {
    return this.request<DraftStatus>(`/drafts/${draftId}/status`);
  }

  async startDraft(draftId: string, token?: string): Promise<ApiResponse<{ message: string }>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request<{ message: string }>(`/drafts/${draftId}/start`, {
      method: 'POST',
      headers,
    });
  }

  async selectChampion(
    draftId: string,
    championId: string,
    actionType: 'BAN' | 'PICK',
    token?: string
  ): Promise<ApiResponse<{ message: string }>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request<{ message: string }>(`/drafts/${draftId}/select`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        championId,
        actionType,
      }),
    });
  }

  // Champion endpoints
  async getChampions(params?: {
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ChampionsResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/champions${query ? `?${query}` : ''}`;
    
    return this.request<ChampionsResponse>(endpoint);
  }

  async getChampion(championId: string): Promise<ApiResponse<Champion>> {
    return this.request<Champion>(`/champions/${championId}`);
  }

  async searchChampions(query: string, limit?: number): Promise<ApiResponse<{
    query: string;
    champions: Champion[];
    count: number;
  }>> {
    const searchParams = new URLSearchParams({ limit: (limit || 10).toString() });
    return this.request(`/champions/search/${encodeURIComponent(query)}?${searchParams.toString()}`);
  }

  // Queue endpoints
  async getGuildQueue(guildId: string, queueType?: string): Promise<ApiResponse<{
    queues: Record<string, unknown[]>;
    stats: {
      totalPlayers: number;
      progress: number;
      isReady: boolean;
    };
  }>> {
    const params = queueType ? `?queueType=${queueType}` : '';
    return this.request(`/queues/guild/${guildId}${params}`);
  }

  async getUserQueueStatus(userId: string, guildId: string): Promise<ApiResponse<{
    status: string;
    position?: number;
    role?: string;
  }>> {
    return this.request(`/queues/user/${userId}/guild/${guildId}`);
  }

  async joinQueue(params: {
    userId: string;
    guildId: string;
    channelId: string;
    role: string;
    queueType?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/queues/join', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async leaveQueue(params: {
    userId: string;
    guildId: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/queues/leave', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // User endpoints
  async getUser(userId: string): Promise<ApiResponse<{
    id: string;
    username: string;
    avatar?: string;
  }>> {
    return this.request(`/users/${userId}`);
  }

  async getUserDrafts(userId: string, params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ApiResponse<{
    drafts: DraftSession[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const endpoint = `/users/${userId}/drafts${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  async getUserChampionStats(userId: string, limit?: number): Promise<ApiResponse<{
    champions: (Champion & {
      games_played: number;
      wins: number;
      losses: number;
      kda: number;
    })[];
  }>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/users/${userId}/champions${params}`);
  }

  // Health check
  async healthCheck(): Promise<Response> {
    return fetch(`${this.baseUrl.replace('/api', '')}/health`);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// WebSocket connection helper
export class DraftWebSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private baseUrl: string = 'ws://23.88.176.69:3001') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.baseUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: unknown) {
    if (typeof data === 'object' && data !== null && 'type' in data && 'channel' in data) {
      const messageData = data as { type: string; channel: string; data?: unknown };
      if (messageData.type === 'update' && messageData.channel) {
        const subscribers = this.subscribers.get(messageData.channel);
        if (subscribers) {
          subscribers.forEach(callback => callback(messageData.data));
        }
      }
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(channel: string, callback: (data: unknown) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Send subscription message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: channel.replace('draft:', ''),
      }));
    }
  }

  unsubscribe(channel: string, callback: (data: unknown) => void) {
    const subscribers = this.subscribers.get(channel);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(channel);
        
        // Send unsubscribe message if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'unsubscribe',
            channel: channel.replace('draft:', ''),
          }));
        }
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }
}

// Export a singleton WebSocket instance
export const draftWebSocket = new DraftWebSocket();