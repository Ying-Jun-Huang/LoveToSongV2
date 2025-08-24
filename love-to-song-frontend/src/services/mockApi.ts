/**
 * Mock API service for development with mock authentication
 */

export const isMockAuth = (): boolean => {
  const token = localStorage.getItem('token');
  return token ? token.startsWith('mock_jwt_token_') : false;
};

export const getMockResponse = (url: string, method: string = 'GET'): any => {
  console.log('[MOCK_API] Generating mock response for:', method, url);
  
  // Mock players data
  if (url.includes('/players') && !url.includes('/stats') && method === 'GET') {
    return {
      data: [
        {
          id: 1,
          playerId: 'P001',
          name: '王小明',
          nickname: '小明',
          gender: 'M',
          birthday: '1990-05-15',
          joinDate: '2024-01-01',
          songCount: 25,
          note: '老客戶，喜歡流行歌曲'
        },
        {
          id: 2,
          playerId: 'P002',
          name: '李美華',
          nickname: '美華',
          gender: 'F',
          birthday: '1988-10-20',
          joinDate: '2024-02-15',
          songCount: 18,
          note: '經常點台語歌曲'
        },
        {
          id: 3,
          playerId: 'P003',
          name: '張建國',
          nickname: '建國',
          gender: 'M',
          birthday: '1985-03-08',
          joinDate: '2024-03-01',
          songCount: 42,
          note: '喜歡懷舊金曲'
        },
        {
          id: 4,
          playerId: 'P004',
          name: '陳淑芬',
          nickname: '芬芬',
          gender: 'F',
          birthday: '1992-07-12',
          joinDate: '2024-04-10',
          songCount: 15,
          note: '新客戶'
        },
        {
          id: 5,
          playerId: 'P005',
          name: '林志明',
          nickname: '阿明',
          gender: 'M',
          birthday: '1987-11-25',
          joinDate: '2024-01-20',
          songCount: 33,
          note: '喜歡搖滾樂'
        }
      ]
    };
  }
  
  // Mock player stats
  if (url.includes('/players/stats') && method === 'GET') {
    return {
      data: {
        totalPlayers: 5,
        totalRequests: 133,
        activeToday: 3
      }
    };
  }
  
  // Mock songs data for stats
  if (url.includes('/songs') && method === 'GET') {
    if (url.includes('/songs/my')) {
      return {
        data: [
          {
            id: 1,
            title: '月亮代表我的心',
            artist: '鄧麗君',
            createdAt: '2024-08-10T10:00:00Z'
          },
          {
            id: 2,
            title: '愛你',
            artist: '陳奕迅',
            createdAt: '2024-08-09T15:30:00Z'
          },
          {
            id: 3,
            title: '海闊天空',
            artist: 'Beyond',
            createdAt: '2024-08-08T09:15:00Z'
          }
        ]
      };
    } else {
      return {
        data: [
          { id: 1, title: '月亮代表我的心', artist: '鄧麗君' },
          { id: 2, title: '愛你', artist: '陳奕迅' },
          { id: 3, title: '十年', artist: '陳奕迅' },
          { id: 4, title: '幻象', artist: '王菲' },
          { id: 5, title: '鏡花水月', artist: '李玉剛' },
          { id: 6, title: '海闊天空', artist: 'Beyond' },
          { id: 7, title: '光輝歲月', artist: 'Beyond' },
          { id: 8, title: '真的愛你', artist: 'Beyond' },
          { id: 9, title: '童話', artist: '光良' },
          { id: 10, title: '小幸運', artist: '田馥甄' }
        ]
      };
    }
  }
  
  // Mock singer search
  if (url.includes('/singers') && method === 'GET') {
    return {
      data: [
        {
          id: 1,
          name: '張學友',
          nickname: '歌神',
          genre: ['流行', '情歌'],
          status: 'ACTIVE'
        },
        {
          id: 2,
          name: '鄧麗君',
          nickname: '小鄧',
          genre: ['經典', '民謠'],
          status: 'ACTIVE'
        },
        {
          id: 3,
          name: '陳奕迅',
          nickname: 'Eason',
          genre: ['流行', 'R&B'],
          status: 'ACTIVE'
        }
      ]
    };
  }
  
  // Mock user/player search
  if (url.includes('/users') && method === 'GET') {
    return {
      data: [
        {
          id: 1,
          email: 'super@test.com',
          displayName: '高層管理員',
          roles: ['SUPER_ADMIN'],
          status: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'singer@test.com',
          displayName: '歌手',
          roles: ['SINGER'],
          status: 'ACTIVE',
          createdAt: '2024-02-01T00:00:00Z'
        },
        {
          id: 3,
          email: 'player@test.com',
          displayName: '玩家',
          roles: ['PLAYER'],
          status: 'ACTIVE',
          createdAt: '2024-03-01T00:00:00Z'
        }
      ]
    };
  }
  
  // Mock events
  if (url.includes('/events') && method === 'GET') {
    return {
      data: [
        {
          id: 1,
          title: '週末歌唱活動',
          description: '每週末的歌唱活動',
          startDate: '2024-08-17T19:00:00Z',
          endDate: '2024-08-17T23:00:00Z',
          status: 'ACTIVE'
        }
      ]
    };
  }
  
  // Default empty response
  console.log('[MOCK_API] No mock data found for:', url);
  return { data: [] };
};

// Override fetch for mock responses when using mock auth
const originalFetch = window.fetch;

export const setupMockApi = () => {
  // Don't override if already overridden
  if ((window.fetch as any).__isMockOverride) {
    return;
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    console.log('[MOCK_API] Fetch request:', method, url, 'isMockAuth:', isMockAuth());
    
    // Only intercept for mock auth and API calls
    if (isMockAuth() && (url.includes('/api/') || url.includes('localhost:3001'))) {
      console.log('[MOCK_API] Intercepting fetch for:', method, url);
      
      try {
        const mockData = getMockResponse(url, method.toUpperCase());
        
        return new Response(JSON.stringify(mockData), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('[MOCK_API] Error generating mock response:', error);
      }
    }
    
    // For auth requests, force backend URL
    if (url.includes('/auth/')) {
      const backendUrl = url.startsWith('/') ? `http://localhost:3001${url}` : url;
      console.log('[MOCK_API] Redirecting auth request to backend:', backendUrl);
      return originalFetch(backendUrl, init);
    }
    
    // Use original fetch for non-mock requests
    return originalFetch(input, init);
  };

  (window.fetch as any).__isMockOverride = true;
  console.log('[MOCK_API] Mock API setup complete');
};

// Initialize mock API immediately
setupMockApi();