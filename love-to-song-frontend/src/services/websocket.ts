import { io, Socket } from 'socket.io-client';
import { sessionManager } from './sessionManager';
import { performanceMonitor } from '../services/performanceMonitor-simple';
import { securityManager } from './securityManager';

export interface RequestUpdate {
  type: 'request_created' | 'request_updated' | 'request_deleted' | 'queue_reordered';
  eventId: number;
  data: any;
  timestamp: Date;
}

export interface EventUpdate {
  type: 'event_started' | 'event_ended' | 'event_updated';
  eventId: number;
  data: any;
  timestamp: Date;
}

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  targetUsers?: number[];
  targetEvents?: number[];
}

export interface QueueUpdate {
  eventId: number;
  currentlyPlaying?: any;
  nextInQueue?: any;
  totalInQueue: number;
  estimatedWaitTime?: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private baseReconnectInterval = 1000;
  private maxReconnectInterval = 30000;
  private isConnected = false;
  private isConnecting = false;
  private eventListeners = new Map<string, Set<Function>>();
  private connectionPromise: Promise<boolean> | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPongTime = 0;
  private heartbeatTimeout = 30000; // 30秒心跳超時
  private dataCache = new Map<string, any>(); // 數據緩存
  private lastUpdateTimestamps = new Map<string, number>(); // 最後更新時間戳
  private compressionEnabled = true; // 數據壓縮開關
  private compressionThreshold = 1024; // 壓縮閾值（字節）
  private fallbackMode = false; // 降級模式
  private errorCounts = new Map<string, number>(); // 錯誤計數
  private lastErrors = new Map<string, Date>(); // 最後錯誤時間
  private retryQueues = new Map<string, any[]>(); // 重試隊列
  private offlineQueue: any[] = []; // 離線消息隊列
  private dataChecksums = new Map<string, string>(); // 數據校驗和
  private syncCheckInterval: NodeJS.Timeout | null = null; // 同步檢查定時器
  private syncCheckEnabled = true; // 是否啟用同步檢查
  private lastSyncCheck = 0; // 最後同步檢查時間
  private syncFailureCount = 0; // 同步失敗計數
  
  // WebSocket 連接池管理
  private connectionPool = new Map<string, Socket>(); // 連接池
  private poolSize = 3; // 連接池大小
  private currentConnectionId = ''; // 當前使用的連接ID
  private connectionHealthChecks = new Map<string, number>(); // 連接健康檢查
  private poolEnabled = false; // 是否啟用連接池
  private loadBalanceMethod: 'round-robin' | 'least-connections' | 'health-based' = 'health-based'; // 負載均衡方法

  // 計算重連延遲（指數退避算法 + 隨機抖動）
  private calculateReconnectDelay(): number {
    // 指數退避：2^n * baseInterval
    const exponentialDelay = Math.pow(2, this.reconnectAttempts) * this.baseReconnectInterval;
    
    // 限制最大延遲
    const cappedDelay = Math.min(exponentialDelay, this.maxReconnectInterval);
    
    // 添加隨機抖動（±25%）避免雷群效應
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.max(cappedDelay + jitter, this.baseReconnectInterval);
  }

  // 開始心跳檢測
  private startHeartbeat() {
    this.stopHeartbeat(); // 清除現有的心跳
    
    console.log('[WebSocket] 開始心跳檢測');
    this.lastPongTime = Date.now();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        const now = Date.now();
        
        // 檢查是否超時
        if (now - this.lastPongTime > this.heartbeatTimeout) {
          console.warn('[WebSocket] 心跳超時，重新連接');
          this.reconnect();
          return;
        }
        
        // 發送心跳
        this.socket.emit('ping', { timestamp: now });
        console.log('[WebSocket] 發送心跳');
      }
    }, 10000); // 每10秒發送一次心跳
    
    // 監聽心跳回應
    if (this.socket) {
      this.socket.on('pong', (data) => {
        this.lastPongTime = Date.now();
        const latency = this.lastPongTime - (data?.timestamp || 0);
        console.log(`[WebSocket] 收到心跳回應，延遲: ${latency}ms`);
      });
    }
  }

  // 停止心跳檢測
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[WebSocket] 停止心跳檢測');
    }
  }

  // 設置事件監聽器
  private setupEventListeners() {
    if (!this.socket) return;

    // 點歌請求更新 - 支持增量更新和壓縮
    this.socket.on('request_update', (update: RequestUpdate | any) => {
      console.log('[WebSocket] 收到點歌請求更新:', update);
      const processedUpdate = this.processCompressedData(update);
      this.processIncrementalUpdate('request_update', processedUpdate);
    });

    // 活動更新 - 支持增量更新和壓縮
    this.socket.on('event_update', (update: EventUpdate | any) => {
      console.log('[WebSocket] 收到活動更新:', update);
      const processedUpdate = this.processCompressedData(update);
      this.processIncrementalUpdate('event_update', processedUpdate);
    });

    // 隊列更新 - 支持增量更新和壓縮
    this.socket.on('queue_update', (update: QueueUpdate | any) => {
      console.log('[WebSocket] 收到隊列更新:', update);
      const processedUpdate = this.processCompressedData(update);
      this.processIncrementalUpdate('queue_update', processedUpdate);
    });

    // 系統通知
    this.socket.on('system_notification', (notification: SystemNotification) => {
      console.log('[WebSocket] 收到系統通知:', notification);
      this.emit('system_notification', notification);
    });

    // 在線統計
    this.socket.on('online_stats', (stats: any) => {
      console.log('[WebSocket] 收到在線統計:', stats);
      this.emit('online_stats', stats);
    });
  }

  // 初始化 WebSocket 連接 - 增加連接管理
  connect(token?: string): Promise<boolean> {
    // 如果已經連接，直接返回
    if (this.isConnected && this.socket) {
      console.log('[WebSocket] 已經連接，重用現有連接');
      return Promise.resolve(true);
    }

    // 如果正在連接中，返回現有的連接 Promise
    if (this.isConnecting && this.connectionPromise) {
      console.log('[WebSocket] 連接進行中，等待現有連接完成');
      return this.connectionPromise;
    }

    // 開始新的連接
    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsToken = token || localStorage.getItem('token');
        
        if (!wsToken) {
          console.warn('[WebSocket] 沒有認證token，跳過連接');
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve(false);
          return;
        }

        // 如果已有連接，先斷開
        if (this.socket) {
          console.log('[WebSocket] 斷開現有連接以建立新連接');
          this.socket.disconnect();
          this.socket = null;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        
        console.log('[WebSocket] 連接到:', `${apiUrl}/realtime`);
        
        this.socket = io(`${apiUrl}/realtime`, {
          auth: {
            token: wsToken
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
          forceNew: false
        });

        this.socket.on('connect', async () => {
          console.log('[WebSocket] 連接成功');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          
          // 初始化集成服務（動態導入避免循環依賴）
          try {
            const { sessionManager } = await import('./sessionManager');
            const { performanceMonitor } = await import('./performanceMonitor');
            const { securityManager } = await import('./securityManager');
            
            const sessionInfo = sessionManager.getSessionConfig();
            if (sessionInfo.sessionId) {
              sessionManager.updateActivity();
            }
            
            performanceMonitor.measureWebSocketPerformance();
            
            securityManager.recordSecurityEvent('websocket_connected', {
              reconnectAttempts: this.reconnectAttempts,
              timestamp: Date.now()
            });
          } catch (error) {
            console.warn('[WebSocket] 集成服務初始化失敗:', error);
          }
          
          this.startHeartbeat();
          this.startSyncCheck(); // 開始數據同步檢查
          this.emit('connect', {}); // 發送連接事件
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[WebSocket] 連接錯誤:', error);
          this.isConnected = false;
          this.isConnecting = false;
          this.connectionPromise = null;
          
          // 檢查是否為 JWT 相關錯誤
          if (error.message && (error.message.includes('jwt') || error.message.includes('token') || error.message.includes('expired'))) {
            console.warn('[WebSocket] JWT token 可能已過期，嘗試刷新 token');
            this.emit('token_expired', error);
            
            // 嘗試從 localStorage 獲取新的 token
            setTimeout(() => {
              const freshToken = localStorage.getItem('token');
              if (freshToken && freshToken !== wsToken) {
                console.log('[WebSocket] 發現新的 token，重新嘗試連接');
                this.connect(freshToken);
              } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = this.calculateReconnectDelay();
                setTimeout(() => {
                  this.reconnectAttempts++;
                  console.log(`[WebSocket] 重新連接嘗試 ${this.reconnectAttempts}/${this.maxReconnectAttempts}，延遲: ${delay}ms`);
                  this.connect(wsToken);
                }, delay);
              } else {
                console.error('[WebSocket] 達到最大重連次數，停止重連');
                reject(error);
              }
            }, 2000);
          } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.calculateReconnectDelay();
            setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`[WebSocket] 重新連接嘗試 ${this.reconnectAttempts}/${this.maxReconnectAttempts}，延遲: ${delay}ms`);
              this.connect(wsToken);
            }, delay);
          } else {
            console.error('[WebSocket] 達到最大重連次數，停止重連');
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[WebSocket] 連接中斷:', reason);
          this.isConnected = false;
          this.isConnecting = false;
          this.connectionPromise = null;
          this.stopHeartbeat();
          this.stopSyncCheck(); // 停止數據同步檢查
          this.emit('disconnect', { reason }); // 發送斷開事件
          
          if (reason === 'io server disconnect') {
            // 服務器主動斷開，需要重新連接
            setTimeout(() => this.connect(wsToken), 2000);
          }
        });

        // 設置事件監聽器
        this.setupEventListeners();

        // 連接超時處理
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('[WebSocket] 連接超時');
            this.isConnecting = false;
            this.connectionPromise = null;
            this.socket?.disconnect();
            resolve(false);
          }
        }, 15000);

      } catch (error) {
        console.error('[WebSocket] 初始化失敗:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // 斷開連接
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] 主動斷開連接');
      this.stopHeartbeat();
      this.stopSyncCheck();
      
      // 斷開主連接
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionPromise = null;
      
      // 清理連接池
      if (this.poolEnabled) {
        this.cleanupConnectionPool();
        this.poolEnabled = false;
        this.currentConnectionId = '';
      }
    }
  }

  // 發送消息到服務器（增加錯誤處理和離線隊列）
  send(event: string, data?: any, options: { priority?: 'high' | 'normal' | 'low', retryOnFail?: boolean } = {}) {
    const { priority = 'normal', retryOnFail = true } = options;

    // 如果處於降級模式或未連接，加入離線隊列
    if (this.fallbackMode || !this.isConnected || !this.socket) {
      if (retryOnFail) {
        this.addToOfflineQueue(event, data);
        console.log(`[WebSocket] 消息已加入離線隊列 (${event}): 當前狀態 - 連接: ${this.isConnected}, 降級: ${this.fallbackMode}`);
      } else {
        console.warn(`[WebSocket] 跳過發送消息 (${event}): 連接不可用且不重試`);
      }
      return false;
    }

    try {
      // 檢查是否需要壓縮大型數據
      if (data && typeof data === 'object') {
        const originalSize = JSON.stringify(data).length;
        if (originalSize > this.compressionThreshold) {
          try {
            const compressed = this.compressData(data);
            this.socket.emit(event, {
              _compressed: true,
              _originalSize: originalSize,
              data: compressed,
              _priority: priority,
              _timestamp: Date.now()
            });
            console.log(`[WebSocket] 發送壓縮數據 (${event}): ${originalSize} → ${compressed.length} 字節`);
            return true;
          } catch (compressionError) {
            console.warn('[WebSocket] 壓縮失敗，發送原始數據:', compressionError);
          }
        }
      }
      
      // 發送原始數據
      this.socket.emit(event, {
        ...data,
        _priority: priority,
        _timestamp: Date.now()
      });
      
      console.log(`[WebSocket] 消息發送成功 (${event})`);
      return true;

    } catch (error) {
      // 使用錯誤處理機制
      const retryAction = retryOnFail ? () => this.send(event, data, options) : undefined;
      const handled = this.handleError(`send_${event}`, error, retryAction);
      
      if (!handled && retryOnFail) {
        // 如果錯誤處理機制沒有處理，加入離線隊列
        this.addToOfflineQueue(event, data);
      }
      
      return false;
    }
  }

  // 監聽事件
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  // 取消監聽事件
  off(event: string, callback?: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      if (callback) {
        listeners.delete(callback);
      } else {
        listeners.clear();
      }
    }
  }

  // 內部事件分發
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] 事件處理器錯誤 (${event}):`, error);
        }
      });
    }
  }

  // 加入活動房間
  joinEvent(eventId: number) {
    if (this.isConnected) {
      console.log('[WebSocket] 加入活動房間:', eventId);
      this.send('join_event', { eventId });
    }
  }

  // 離開活動房間
  leaveEvent(eventId: number) {
    if (this.isConnected) {
      console.log('[WebSocket] 離開活動房間:', eventId);
      this.send('leave_event', { eventId });
    }
  }

  // 獲取連接狀態
  getConnectionStatus() {
    const poolStatus = this.getConnectionPoolStatus();
    
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
      fallbackMode: this.fallbackMode,
      offlineQueueSize: this.offlineQueue.length,
      compressionEnabled: this.compressionEnabled,
      pollingActive: this.pollingInterval !== null,
      syncCheckEnabled: this.syncCheckEnabled,
      lastSyncCheck: this.lastSyncCheck,
      cachedDataCount: this.dataCache.size,
      connectionPool: poolStatus
    };
  }

  // 手動重新連接
  async reconnect() {
    if (this.socket) {
      this.disconnect();
    }
    this.reconnectAttempts = 0;
    return await this.connect();
  }

  // 計算數據校驗和
  private calculateChecksum(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為32位整數
    }
    
    return Math.abs(hash).toString(16);
  }

  // 驗證數據完整性
  private verifyDataIntegrity(type: string, data: any, expectedChecksum?: string): boolean {
    if (!expectedChecksum) return true;
    
    const actualChecksum = this.calculateChecksum(data);
    const isValid = actualChecksum === expectedChecksum;
    
    if (!isValid) {
      console.warn(`[WebSocket] 數據完整性檢查失敗 (${type}):`, {
        expected: expectedChecksum,
        actual: actualChecksum,
        dataSize: JSON.stringify(data).length
      });
      
      // 請求重新同步
      this.requestDataResync(type);
    }
    
    return isValid;
  }

  // 請求數據重新同步
  private requestDataResync(type: string): void {
    console.log(`[WebSocket] 請求數據重新同步: ${type}`);
    
    if (this.isConnected && this.socket) {
      this.socket.emit('request_data_resync', {
        type,
        timestamp: Date.now(),
        reason: 'data_integrity_check_failed'
      });
    }
    
    // 清除相關緩存，強制完整更新
    this.clearCache(type);
  }

  // 開始數據同步檢查
  private startSyncCheck(): void {
    if (!this.syncCheckEnabled || this.syncCheckInterval) return;
    
    console.log('[WebSocket] 開始數據同步檢查');
    
    this.syncCheckInterval = setInterval(() => {
      this.performSyncCheck();
    }, 60000); // 每分鐘檢查一次
  }

  // 停止數據同步檢查
  private stopSyncCheck(): void {
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null;
      console.log('[WebSocket] 停止數據同步檢查');
    }
  }

  // 執行同步檢查
  private async performSyncCheck(): Promise<void> {
    if (!this.isConnected || this.fallbackMode) return;
    
    const now = Date.now();
    this.lastSyncCheck = now;
    
    console.log('[WebSocket] 執行數據同步檢查');
    
    try {
      // 檢查各類型數據的同步狀態
      const checkPromises = [];
      
      // 檢查快取的數據類型
      const cacheEntries = Array.from(this.dataCache.entries());
      for (let i = 0; i < cacheEntries.length; i++) {
        const [cacheKey, cachedData] = cacheEntries[i];
        const [type, eventId] = cacheKey.split('_');
        const lastUpdate = this.lastUpdateTimestamps.get(cacheKey) || 0;
        
        // 如果數據超過5分鐘未更新，檢查同步狀態
        if (now - lastUpdate > 300000) {
          checkPromises.push(this.checkDataSync(type, eventId === 'global' ? undefined : parseInt(eventId), cachedData));
        }
      }
      
      await Promise.all(checkPromises);
      
      // 重置失敗計數
      this.syncFailureCount = 0;
      
    } catch (error) {
      this.syncFailureCount++;
      console.error('[WebSocket] 數據同步檢查失敗:', error);
      
      // 如果連續失敗多次，禁用同步檢查一段時間
      if (this.syncFailureCount >= 5) {
        console.warn('[WebSocket] 同步檢查失敗次數過多，暫時禁用');
        this.stopSyncCheck();
        
        // 10分鐘後重新啟用
        setTimeout(() => {
          this.syncFailureCount = 0;
          this.startSyncCheck();
        }, 600000);
      }
    }
  }

  // 檢查特定數據的同步狀態
  private async checkDataSync(type: string, eventId?: number, cachedData?: any): Promise<void> {
    if (!this.socket) return;
    
    const checksum = cachedData ? this.calculateChecksum(cachedData) : null;
    
    return new Promise((resolve) => {
      const responseHandler = (response: any) => {
        if (response.type === type && response.eventId === eventId) {
          this.socket?.off('sync_check_response', responseHandler);
          
          if (response.checksum !== checksum) {
            console.warn(`[WebSocket] 數據不同步 (${type}):`, {
              local: checksum,
              server: response.checksum,
              eventId
            });
            
            // 請求完整數據更新
            this.requestIncrementalSync(type, eventId);
          } else {
            console.log(`[WebSocket] 數據同步正常 (${type})`);
          }
          
          resolve();
        }
      };
      
      this.socket!.on('sync_check_response', responseHandler);
      
      // 發送同步檢查請求
      this.socket!.emit('sync_check_request', {
        type,
        eventId,
        checksum,
        timestamp: Date.now()
      });
      
      // 超時處理
      setTimeout(() => {
        this.socket?.off('sync_check_response', responseHandler);
        resolve();
      }, 5000);
    });
  }

  // 更新 token（用於 token 刷新）
  updateToken(newToken: string) {
    if (this.socket && this.isConnected) {
      console.log('[WebSocket] 更新 token');
      this.socket.auth = { token: newToken };
      // 重新認證
      this.socket.disconnect();
      this.connect(newToken);
    }
  }

  // 增量數據更新處理
  private processIncrementalUpdate(type: string, data: any) {
    const cacheKey = `${type}_${data.eventId || 'global'}`;
    const timestamp = Date.now();
    
    // 驗證數據完整性（如果提供了校驗和）
    if (data.checksum && !this.verifyDataIntegrity(type, data.data || data, data.checksum)) {
      console.warn(`[WebSocket] 數據完整性驗證失敗，跳過更新 (${type})`);
      return;
    }
    
    // 檢查是否為增量更新
    if (data.isIncremental && this.dataCache.has(cacheKey)) {
      const cachedData = this.dataCache.get(cacheKey);
      const mergedData = this.mergeIncrementalData(cachedData, data);
      
      console.log(`[WebSocket] 處理增量更新 (${type}):`, {
        cached: cachedData?.length || 0,
        incremental: data.changes?.length || 0,
        merged: mergedData?.length || 0
      });
      
      // 更新緩存和校驗和
      this.dataCache.set(cacheKey, mergedData);
      this.lastUpdateTimestamps.set(cacheKey, timestamp);
      this.dataChecksums.set(cacheKey, this.calculateChecksum(mergedData));
      
      // 發送合併後的數據
      this.emit(type, {
        ...data,
        data: mergedData,
        isIncremental: false // 標記為完整數據
      });
    } else {
      // 完整數據更新
      console.log(`[WebSocket] 處理完整數據更新 (${type})`);
      const actualData = data.data || data;
      
      this.dataCache.set(cacheKey, actualData);
      this.lastUpdateTimestamps.set(cacheKey, timestamp);
      this.dataChecksums.set(cacheKey, this.calculateChecksum(actualData));
      
      this.emit(type, data);
    }
  }

  // 合併增量數據
  private mergeIncrementalData(cachedData: any[], incrementalData: any): any[] {
    if (!Array.isArray(cachedData)) return incrementalData.data || [];
    if (!incrementalData.changes) return cachedData;

    let result = [...cachedData];

    // 處理增量變更
    incrementalData.changes.forEach((change: any) => {
      switch (change.action) {
        case 'add':
          // 添加新項目
          if (!result.find(item => item.id === change.item.id)) {
            if (change.position !== undefined) {
              result.splice(change.position, 0, change.item);
            } else {
              result.push(change.item);
            }
          }
          break;

        case 'update':
          // 更新現有項目
          const updateIndex = result.findIndex(item => item.id === change.item.id);
          if (updateIndex !== -1) {
            result[updateIndex] = { ...result[updateIndex], ...change.item };
          }
          break;

        case 'delete':
          // 刪除項目
          result = result.filter(item => item.id !== change.itemId);
          break;

        case 'reorder':
          // 重新排序
          if (change.from !== undefined && change.to !== undefined) {
            const [movedItem] = result.splice(change.from, 1);
            result.splice(change.to, 0, movedItem);
          }
          break;
      }
    });

    return result;
  }

  // 請求增量數據同步
  requestIncrementalSync(type: string, eventId?: number) {
    const cacheKey = `${type}_${eventId || 'global'}`;
    const lastTimestamp = this.lastUpdateTimestamps.get(cacheKey) || 0;
    
    if (this.isConnected) {
      console.log(`[WebSocket] 請求增量同步 (${type}):`, { since: lastTimestamp });
      this.send('request_incremental_sync', {
        type,
        eventId,
        since: lastTimestamp
      });
    }
  }

  // 清除特定類型的緩存
  clearCache(type?: string, eventId?: number) {
    if (type) {
      const cacheKey = `${type}_${eventId || 'global'}`;
      this.dataCache.delete(cacheKey);
      this.lastUpdateTimestamps.delete(cacheKey);
      console.log(`[WebSocket] 清除緩存: ${cacheKey}`);
    } else {
      // 清除所有緩存
      this.dataCache.clear();
      this.lastUpdateTimestamps.clear();
      console.log('[WebSocket] 清除所有緩存');
    }
  }

  // 簡單的數據壓縮實現 (基於 JSON 的優化)
  private compressData(data: any): string {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }

    const jsonString = JSON.stringify(data);
    
    // 如果數據小於閾值，不進行壓縮
    if (jsonString.length < this.compressionThreshold) {
      return jsonString;
    }

    try {
      // 使用簡單的字符串壓縮算法
      return this.simpleCompress(jsonString);
    } catch (error) {
      console.warn('[WebSocket] 壓縮失敗，使用原始數據:', error);
      return jsonString;
    }
  }

  // 解壓數據
  private decompressData(compressedData: string): any {
    if (!this.compressionEnabled) {
      return JSON.parse(compressedData);
    }

    try {
      // 檢查是否為壓縮數據（以特殊標記開頭）
      if (compressedData.startsWith('COMPRESSED:')) {
        const decompressed = this.simpleDecompress(compressedData.substring(11));
        return JSON.parse(decompressed);
      } else {
        return JSON.parse(compressedData);
      }
    } catch (error) {
      console.warn('[WebSocket] 解壓失敗:', error);
      return JSON.parse(compressedData);
    }
  }

  // 簡單的字符串壓縮實現
  private simpleCompress(str: string): string {
    const compressed: string[] = [];
    let i = 0;
    
    while (i < str.length) {
      let match = '';
      let matchLength = 0;
      
      // 尋找重複的子字符串
      for (let j = i + 1; j < Math.min(i + 255, str.length); j++) {
        const candidate = str.substring(i, j);
        const nextOccurrence = str.indexOf(candidate, j);
        
        if (nextOccurrence !== -1 && candidate.length > matchLength) {
          match = candidate;
          matchLength = candidate.length;
        }
      }
      
      if (matchLength > 3) {
        // 如果找到重複字符串，記錄引用
        const distance = str.indexOf(match, i + matchLength) - i;
        compressed.push(`[${distance}:${matchLength}]`);
        i += matchLength;
      } else {
        // 否則直接添加字符
        compressed.push(str[i]);
        i++;
      }
    }
    
    const result = compressed.join('');
    
    // 只有在壓縮效果顯著時才返回壓縮版本
    if (result.length < str.length * 0.8) {
      console.log(`[WebSocket] 壓縮效果: ${str.length} → ${result.length} (${((1 - result.length / str.length) * 100).toFixed(1)}%)`);
      return 'COMPRESSED:' + result;
    } else {
      return str;
    }
  }

  // 簡單的字符串解壓實現
  private simpleDecompress(compressedStr: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < compressedStr.length) {
      if (compressedStr[i] === '[') {
        // 解析引用
        const endBracket = compressedStr.indexOf(']', i);
        const reference = compressedStr.substring(i + 1, endBracket);
        const [distance, length] = reference.split(':').map(Number);
        
        // 復制之前的字符串
        const startPos: number = result.length - distance;
        for (let j = 0; j < length; j++) {
          result.push(result[startPos + j]);
        }
        
        i = endBracket + 1;
      } else {
        result.push(compressedStr[i]);
        i++;
      }
    }
    
    return result.join('');
  }

  // 設置壓縮選項
  setCompressionOptions(enabled: boolean, threshold: number = 1024) {
    this.compressionEnabled = enabled;
    this.compressionThreshold = threshold;
    console.log(`[WebSocket] 壓縮設置: ${enabled ? '啟用' : '禁用'}, 閾值: ${threshold} 字節`);
  }

  // 設置同步檢查選項
  setSyncCheckOptions(enabled: boolean) {
    const wasEnabled = this.syncCheckEnabled;
    this.syncCheckEnabled = enabled;
    
    if (enabled && !wasEnabled && this.isConnected) {
      this.startSyncCheck();
    } else if (!enabled && wasEnabled) {
      this.stopSyncCheck();
    }
    
    console.log(`[WebSocket] 數據同步檢查: ${enabled ? '啟用' : '禁用'}`);
  }

  // 手動觸發同步檢查
  triggerSyncCheck(): Promise<void> {
    if (!this.syncCheckEnabled || !this.isConnected) {
      return Promise.resolve();
    }
    
    console.log('[WebSocket] 手動觸發同步檢查');
    return this.performSyncCheck();
  }

  // === 連接池管理方法 ===

  // 啟用連接池
  enableConnectionPool(size: number = 3, method: 'round-robin' | 'least-connections' | 'health-based' = 'health-based') {
    this.poolEnabled = true;
    this.poolSize = Math.max(1, Math.min(size, 10)); // 限制在1-10之間
    this.loadBalanceMethod = method;
    console.log(`[WebSocket] 啟用連接池: 大小=${this.poolSize}, 方法=${this.loadBalanceMethod}`);
    
    // 如果當前已連接，創建連接池
    if (this.isConnected) {
      this.initializeConnectionPool();
    }
  }

  // 禁用連接池
  disableConnectionPool() {
    this.poolEnabled = false;
    console.log('[WebSocket] 禁用連接池');
    
    // 清理連接池（保留一個主連接）
    this.cleanupConnectionPool();
  }

  // 初始化連接池
  private async initializeConnectionPool(): Promise<void> {
    if (!this.poolEnabled) return;
    
    console.log(`[WebSocket] 初始化連接池，創建 ${this.poolSize} 個連接`);
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    
    // 創建多個連接
    for (let i = 0; i < this.poolSize; i++) {
      const connectionId = `pool_${i}_${Date.now()}`;
      
      try {
        const poolSocket = io(`${wsUrl}/realtime`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        });

        await this.setupPoolConnection(poolSocket, connectionId);
        
        this.connectionPool.set(connectionId, poolSocket);
        this.connectionHealthChecks.set(connectionId, 100); // 初始健康度為100%
        
        console.log(`[WebSocket] 連接池連接已建立: ${connectionId}`);
        
        // 設置第一個連接為當前活動連接
        if (i === 0 && !this.currentConnectionId) {
          this.currentConnectionId = connectionId;
          this.socket = poolSocket;
        }
        
      } catch (error) {
        console.error(`[WebSocket] 連接池連接失敗 ${connectionId}:`, error);
      }
    }
    
    // 開始連接健康監控
    this.startConnectionHealthMonitoring();
  }

  // 設置連接池連接
  private setupPoolConnection(poolSocket: Socket, connectionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${connectionId}`));
      }, 10000);

      poolSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`[WebSocket] 連接池連接成功: ${connectionId}`);
        resolve();
      });

      poolSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error(`[WebSocket] 連接池連接錯誤 ${connectionId}:`, error);
        reject(error);
      });

      // 監控連接狀態
      poolSocket.on('disconnect', () => {
        console.warn(`[WebSocket] 連接池連接斷開: ${connectionId}`);
        this.handlePoolConnectionDisconnect(connectionId);
      });

      // 監控連接延遲（用於健康檢查）
      poolSocket.on('pong', (data) => {
        const latency = Date.now() - (data?.timestamp || 0);
        this.updateConnectionHealth(connectionId, latency);
      });
    });
  }

  // 處理連接池連接斷開
  private handlePoolConnectionDisconnect(connectionId: string): void {
    console.log(`[WebSocket] 處理連接池連接斷開: ${connectionId}`);
    
    // 更新健康度
    this.connectionHealthChecks.set(connectionId, 0);
    
    // 如果這是當前活動連接，切換到其他健康連接
    if (this.currentConnectionId === connectionId) {
      const healthyConnection = this.findBestConnection();
      if (healthyConnection) {
        this.switchToConnection(healthyConnection);
      } else {
        // 沒有健康連接，進入降級模式
        console.warn('[WebSocket] 所有連接池連接都不可用，進入降級模式');
        this.enableFallbackMode('all_pool_connections_failed');
      }
    }
    
    // 嘗試重新連接
    this.reconnectPoolConnection(connectionId);
  }

  // 重新連接連接池中的連接
  private async reconnectPoolConnection(connectionId: string): Promise<void> {
    console.log(`[WebSocket] 重新連接連接池連接: ${connectionId}`);
    
    const token = localStorage.getItem('token');
    if (!token || !this.poolEnabled) return;

    try {
      // 清理舊連接
      const oldSocket = this.connectionPool.get(connectionId);
      if (oldSocket) {
        oldSocket.disconnect();
        this.connectionPool.delete(connectionId);
      }

      // 創建新連接
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const wsUrl = apiUrl.replace(/^http/, 'ws');
      
      const newSocket = io(`${wsUrl}/realtime`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      await this.setupPoolConnection(newSocket, connectionId);
      
      this.connectionPool.set(connectionId, newSocket);
      this.connectionHealthChecks.set(connectionId, 100);
      
      console.log(`[WebSocket] 連接池連接重新建立: ${connectionId}`);
      
    } catch (error) {
      console.error(`[WebSocket] 重新連接失敗 ${connectionId}:`, error);
      
      // 延遲重試
      setTimeout(() => {
        if (this.poolEnabled) {
          this.reconnectPoolConnection(connectionId);
        }
      }, 5000);
    }
  }

  // 查找最佳連接
  private findBestConnection(): string | null {
    if (this.connectionPool.size === 0) return null;
    
    const healthyConnections = Array.from(this.connectionPool.keys()).filter(id => {
      const socket = this.connectionPool.get(id);
      const health = this.connectionHealthChecks.get(id) || 0;
      return socket?.connected && health > 50;
    });
    
    if (healthyConnections.length === 0) return null;
    
    switch (this.loadBalanceMethod) {
      case 'round-robin':
        // 簡單輪詢
        return healthyConnections[Math.floor(Math.random() * healthyConnections.length)];
      
      case 'least-connections':
        // 選擇負載最小的連接（這裡簡化為隨機選擇）
        return healthyConnections[Math.floor(Math.random() * healthyConnections.length)];
      
      case 'health-based':
      default:
        // 基於健康度選擇
        return healthyConnections.reduce((best, current) => {
          const currentHealth = this.connectionHealthChecks.get(current) || 0;
          const bestHealth = this.connectionHealthChecks.get(best) || 0;
          return currentHealth > bestHealth ? current : best;
        });
    }
  }

  // 切換到指定連接
  private switchToConnection(connectionId: string): void {
    const newSocket = this.connectionPool.get(connectionId);
    if (!newSocket || !newSocket.connected) return;
    
    console.log(`[WebSocket] 切換到連接: ${connectionId}`);
    
    this.currentConnectionId = connectionId;
    this.socket = newSocket;
    this.isConnected = true;
    
    // 重新設置事件監聽器
    this.setupEventListeners();
    
    // 通知連接恢復
    this.disableFallbackMode();
    this.emit('connection_switched', { connectionId });
  }

  // 開始連接健康監控
  private startConnectionHealthMonitoring(): void {
    if (!this.poolEnabled) return;
    
    console.log('[WebSocket] 開始連接健康監控');
    
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // 每30秒檢查一次
  }

  // 執行健康檢查
  private performHealthCheck(): void {
    if (!this.poolEnabled) return;
    
    const poolEntries = Array.from(this.connectionPool.entries());
    for (let i = 0; i < poolEntries.length; i++) {
      const [connectionId, socket] = poolEntries[i];
      
      if (socket.connected) {
        // 發送ping測試延遲
        const pingTime = Date.now();
        socket.emit('ping', { timestamp: pingTime, connectionId });
        
        // 設置超時檢查
        setTimeout(() => {
          if (!this.hasRecentPong(connectionId, pingTime)) {
            console.warn(`[WebSocket] 連接健康檢查超時: ${connectionId}`);
            this.updateConnectionHealth(connectionId, -1); // 標記為不健康
          }
        }, 5000);
      } else {
        // 連接已斷開
        this.updateConnectionHealth(connectionId, -1);
      }
    }
    
    // 檢查當前連接是否仍然是最佳選擇
    const bestConnection = this.findBestConnection();
    if (bestConnection && bestConnection !== this.currentConnectionId) {
      console.log(`[WebSocket] 發現更好的連接，準備切換: ${this.currentConnectionId} -> ${bestConnection}`);
      this.switchToConnection(bestConnection);
    }
  }

  // 檢查是否有最近的pong響應
  private hasRecentPong(connectionId: string, pingTime: number): boolean {
    // 這裡簡化實現，實際應該跟蹤每個連接的pong響應時間
    return true; // 暫時返回true，避免誤判
  }

  // 更新連接健康度
  private updateConnectionHealth(connectionId: string, latency: number): void {
    const currentHealth = this.connectionHealthChecks.get(connectionId) || 0;
    
    let newHealth: number;
    if (latency === -1) {
      // 連接不可用
      newHealth = 0;
    } else if (latency < 100) {
      // 很好的延遲
      newHealth = Math.min(100, currentHealth + 10);
    } else if (latency < 300) {
      // 可接受的延遲
      newHealth = Math.max(70, currentHealth);
    } else {
      // 較高的延遲
      newHealth = Math.max(30, currentHealth - 5);
    }
    
    this.connectionHealthChecks.set(connectionId, newHealth);
    
    if (newHealth < 30 && connectionId === this.currentConnectionId) {
      console.warn(`[WebSocket] 當前連接健康度過低: ${connectionId} (${newHealth}%), 尋找更好的連接`);
      const betterConnection = this.findBestConnection();
      if (betterConnection && betterConnection !== connectionId) {
        this.switchToConnection(betterConnection);
      }
    }
  }

  // 清理連接池
  private cleanupConnectionPool(): void {
    console.log('[WebSocket] 清理連接池');
    
    // 關閉除當前連接外的所有連接
    const poolEntries = Array.from(this.connectionPool.entries());
    for (let i = 0; i < poolEntries.length; i++) {
      const [connectionId, socket] = poolEntries[i];
      
      if (connectionId !== this.currentConnectionId) {
        socket.disconnect();
        this.connectionPool.delete(connectionId);
        this.connectionHealthChecks.delete(connectionId);
        console.log(`[WebSocket] 關閉連接池連接: ${connectionId}`);
      }
    }
    
    // 如果有當前連接，將其從池中移除但保持socket引用
    if (this.currentConnectionId && this.socket) {
      this.connectionPool.delete(this.currentConnectionId);
      this.connectionHealthChecks.delete(this.currentConnectionId);
      this.currentConnectionId = '';
    }
  }

  // 獲取連接池狀態
  getConnectionPoolStatus() {
    if (!this.poolEnabled) {
      return {
        enabled: false,
        poolSize: 0,
        activeConnections: 0,
        currentConnection: null,
        healthStatus: {}
      };
    }
    
    const healthStatus: { [key: string]: { connected: boolean, health: number } } = {};
    
    const poolEntries = Array.from(this.connectionPool.entries());
    for (let i = 0; i < poolEntries.length; i++) {
      const [connectionId, socket] = poolEntries[i];
      healthStatus[connectionId] = {
        connected: socket.connected,
        health: this.connectionHealthChecks.get(connectionId) || 0
      };
    }
    
    return {
      enabled: true,
      poolSize: this.poolSize,
      activeConnections: this.connectionPool.size,
      currentConnection: this.currentConnectionId,
      healthStatus,
      loadBalanceMethod: this.loadBalanceMethod
    };
  }

  // 處理可能壓縮的接收數據
  private processCompressedData(receivedData: any): any {
    if (receivedData && receivedData._compressed && receivedData.data) {
      try {
        const decompressed = this.decompressData(receivedData.data);
        console.log(`[WebSocket] 解壓接收數據: ${receivedData.data.length} → ${receivedData._originalSize || 'unknown'} 字節`);
        return decompressed;
      } catch (error) {
        console.warn('[WebSocket] 解壓接收數據失敗:', error);
        return receivedData;
      }
    }
    return receivedData;
  }

  // 錯誤重試機制
  private handleError(context: string, error: any, retryAction?: () => void): boolean {
    const now = new Date();
    const errorKey = `${context}_${error.message || 'unknown'}`;
    
    // 更新錯誤統計
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    this.lastErrors.set(errorKey, now);
    
    console.error(`[WebSocket] 錯誤處理 (${context}):`, {
      error: error.message || error,
      count: currentCount + 1,
      context
    });

    // 判斷是否需要降級
    if (this.shouldFallback(errorKey, currentCount + 1)) {
      this.enableFallbackMode(context);
      return false;
    }

    // 執行重試
    if (retryAction && this.shouldRetry(errorKey, currentCount + 1)) {
      const retryDelay = this.calculateRetryDelay(currentCount + 1);
      console.log(`[WebSocket] 計劃重試 (${context}): ${retryDelay}ms 後`);
      
      setTimeout(() => {
        try {
          retryAction();
        } catch (retryError) {
          console.error(`[WebSocket] 重試失敗 (${context}):`, retryError);
        }
      }, retryDelay);
      
      return true;
    }

    return false;
  }

  // 判斷是否應該重試
  private shouldRetry(errorKey: string, count: number): boolean {
    const maxRetries = 5;
    const lastError = this.lastErrors.get(errorKey);
    const now = new Date();
    
    // 如果錯誤次數超過限制，不重試
    if (count > maxRetries) {
      return false;
    }
    
    // 如果最後錯誤時間太近（5秒內），不重試
    if (lastError && now.getTime() - lastError.getTime() < 5000) {
      return false;
    }
    
    return true;
  }

  // 判斷是否應該降級
  private shouldFallback(errorKey: string, count: number): boolean {
    const fallbackThreshold = 10; // 10次錯誤後降級
    return count >= fallbackThreshold;
  }

  // 計算重試延遲
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1秒基礎延遲
    const maxDelay = 30000; // 最大30秒
    const exponentialDelay = Math.pow(2, attempt - 1) * baseDelay;
    const jitter = Math.random() * 0.3; // 30% 隨機抖動
    
    return Math.min(exponentialDelay * (1 + jitter), maxDelay);
  }

  // 啟用降級模式
  private enableFallbackMode(context: string): void {
    if (!this.fallbackMode) {
      this.fallbackMode = true;
      console.warn(`[WebSocket] 啟用降級模式，原因: ${context}`);
      
      // 發送降級事件
      this.emit('fallback_enabled', { context, timestamp: Date.now() });
      
      // 開始輪詢模式（如果需要）
      this.startPollingMode();
    }
  }

  // 禁用降級模式
  private disableFallbackMode(): void {
    if (this.fallbackMode) {
      this.fallbackMode = false;
      console.log('[WebSocket] 退出降級模式');
      
      // 停止輪詢模式
      this.stopPollingMode();
      
      // 發送恢復事件
      this.emit('fallback_disabled', { timestamp: Date.now() });
      
      // 處理離線隊列
      this.processOfflineQueue();
    }
  }

  // 開始輪詢模式（降級時的替代方案）
  private pollingInterval: NodeJS.Timeout | null = null;
  
  private startPollingMode(): void {
    if (this.pollingInterval) return;
    
    console.log('[WebSocket] 開始輪詢模式');
    
    // 每30秒輪詢一次服務器狀態
    this.pollingInterval = setInterval(() => {
      this.pollServerStatus();
    }, 30000);
  }

  // 停止輪詢模式
  private stopPollingMode(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[WebSocket] 停止輪詢模式');
    }
  }

  // 輪詢服務器狀態
  private async pollServerStatus(): Promise<void> {
    try {
      // 嘗試重新連接 WebSocket
      const connected = await this.connect();
      if (connected) {
        this.disableFallbackMode();
      }
    } catch (error) {
      console.warn('[WebSocket] 輪詢重連失敗:', error);
    }
  }

  // 添加到離線隊列
  private addToOfflineQueue(event: string, data: any): void {
    const queueItem = {
      event,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    this.offlineQueue.push(queueItem);
    
    // 限制隊列大小
    const maxQueueSize = 100;
    if (this.offlineQueue.length > maxQueueSize) {
      this.offlineQueue.shift(); // 移除最舊的項目
    }
    
    console.log(`[WebSocket] 消息加入離線隊列: ${event}, 隊列大小: ${this.offlineQueue.length}`);
  }

  // 處理離線隊列
  private processOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`[WebSocket] 處理離線隊列: ${this.offlineQueue.length} 項目`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    queue.forEach((item, index) => {
      setTimeout(() => {
        if (this.isConnected && !this.fallbackMode) {
          console.log(`[WebSocket] 重發離線消息: ${item.event}`);
          this.socket?.emit(item.event, item.data);
        } else {
          // 如果仍然離線，重新加入隊列
          this.addToOfflineQueue(item.event, item.data);
        }
      }, index * 100); // 每100ms發送一個，避免overwhelm
    });
  }

  // 獲取錯誤統計
  getErrorStats() {
    const stats = {
      fallbackMode: this.fallbackMode,
      offlineQueueSize: this.offlineQueue.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      lastErrors: Object.fromEntries(
        Array.from(this.lastErrors.entries()).map(([key, date]) => [key, date.toISOString()])
      ),
      syncStatus: {
        enabled: this.syncCheckEnabled,
        lastCheck: new Date(this.lastSyncCheck).toISOString(),
        failureCount: this.syncFailureCount,
        cachedDataCount: this.dataCache.size
      }
    };
    
    return stats;
  }

  // 重置錯誤統計
  resetErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    this.offlineQueue = [];
    
    if (this.fallbackMode) {
      this.disableFallbackMode();
    }
    
    console.log('[WebSocket] 錯誤統計已重置');
  }
}

// 創建單例實例
export const websocketService = new WebSocketService();
export default websocketService;