import websocketService from './websocket-simple';

class SessionManager {
  constructor() {
    this.sessionId = null;
    this.deviceId = this.generateDeviceId();
    this.sessionData = new Map();
    this.sessionSyncEnabled = true;
    this.sessionTimeout = 30 * 60 * 1000; // 30分鐘會話超時
    this.lastActivity = Date.now();
    this.activityTimeout = null;
    this.crossDeviceSync = false;
    
    // 監聽用戶活動
    this.initializeActivityTracking();
    
    // 監聽 WebSocket 事件
    this.initializeWebSocketListeners();
  }

  // 生成設備唯一標識
  generateDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // 初始化會話
  async initializeSession(userId, userToken) {
    console.log('[SessionManager] 初始化會話:', { userId, deviceId: this.deviceId });
    
    this.sessionId = `session_${userId}_${Date.now()}`;
    this.lastActivity = Date.now();
    
    // 創建會話數據
    const sessionInfo = {
      sessionId: this.sessionId,
      userId,
      deviceId: this.deviceId,
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true
    };
    
    // 保存會話信息
    this.sessionData.set('sessionInfo', sessionInfo);
    localStorage.setItem('currentSession', JSON.stringify(sessionInfo));
    
    // 通知服務器會話開始
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('session_start', {
        sessionInfo,
        crossDeviceSync: this.crossDeviceSync
      });
    }
    
    // 開始活動監控
    this.startActivityMonitoring();
    
    console.log('[SessionManager] 會話已初始化:', this.sessionId);
    return this.sessionId;
  }

  // 檢測平台
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // 初始化活動追蹤
  initializeActivityTracking() {
    // 監聽用戶活動事件
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.updateActivity();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
    
    // 監聽頁面卸載
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  // 初始化 WebSocket 監聽器
  initializeWebSocketListeners() {
    // 監聽跨設備會話事件
    websocketService.on('session_conflict', (data) => {
      this.handleSessionConflict(data);
    });
    
    websocketService.on('session_sync', (data) => {
      this.handleSessionSync(data);
    });
    
    websocketService.on('device_connected', (data) => {
      this.handleDeviceConnected(data);
    });
    
    websocketService.on('device_disconnected', (data) => {
      this.handleDeviceDisconnected(data);
    });
  }

  // 更新活動時間
  updateActivity() {
    const now = Date.now();
    
    // 避免過於頻繁的更新（最多每10秒一次）
    if (now - this.lastActivity < 10000) return;
    
    this.lastActivity = now;
    
    // 更新會話數據
    const sessionInfo = this.sessionData.get('sessionInfo');
    if (sessionInfo) {
      sessionInfo.lastActivity = new Date();
      this.sessionData.set('sessionInfo', sessionInfo);
      localStorage.setItem('currentSession', JSON.stringify(sessionInfo));
    }
    
    // 重置活動超時
    this.resetActivityTimeout();
    
    // 通知服務器活動更新
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('session_activity', {
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        timestamp: now
      }, { priority: 'low' });
    }
  }

  // 開始活動監控
  startActivityMonitoring() {
    this.resetActivityTimeout();
  }

  // 重置活動超時
  resetActivityTimeout() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    this.activityTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  // 處理會話超時
  handleSessionTimeout() {
    console.warn('[SessionManager] 會話超時');
    
    // 通知用戶會話即將過期
    this.emit('session_timeout_warning');
    
    // 給用戶30秒時間響應
    setTimeout(() => {
      if (Date.now() - this.lastActivity > this.sessionTimeout) {
        this.endSession('timeout');
      }
    }, 30000);
  }

  // 處理頁面隱藏
  handlePageHidden() {
    console.log('[SessionManager] 頁面隱藏');
    
    const sessionInfo = this.sessionData.get('sessionInfo');
    if (sessionInfo) {
      sessionInfo.isActive = false;
      this.sessionData.set('sessionInfo', sessionInfo);
    }
    
    // 通知服務器頁面不活躍
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('session_inactive', {
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        timestamp: Date.now()
      });
    }
  }

  // 處理頁面可見
  handlePageVisible() {
    console.log('[SessionManager] 頁面可見');
    
    this.updateActivity();
    
    const sessionInfo = this.sessionData.get('sessionInfo');
    if (sessionInfo) {
      sessionInfo.isActive = true;
      this.sessionData.set('sessionInfo', sessionInfo);
    }
    
    // 通知服務器頁面活躍
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('session_active', {
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        timestamp: Date.now()
      });
    }
  }

  // 處理會話衝突（多設備登錄）
  handleSessionConflict(data) {
    console.warn('[SessionManager] 會話衝突檢測到:', data);
    
    if (data.action === 'force_logout') {
      this.emit('session_conflict', {
        type: 'force_logout',
        message: '您的帳戶在其他設備上登錄，當前會話將被終止',
        conflictDevice: data.deviceInfo
      });
      
      this.endSession('conflict');
    } else if (data.action === 'notify_conflict') {
      this.emit('session_conflict', {
        type: 'notify',
        message: '檢測到多設備登錄',
        conflictDevice: data.deviceInfo
      });
    }
  }

  // 處理會話同步
  handleSessionSync(data) {
    console.log('[SessionManager] 收到會話同步數據:', data);
    
    if (this.crossDeviceSync && data.deviceId !== this.deviceId) {
      // 同步跨設備數據
      if (data.type === 'preferences') {
        this.syncUserPreferences(data.data);
      } else if (data.type === 'recent_activity') {
        this.syncRecentActivity(data.data);
      }
      
      this.emit('session_synced', {
        type: data.type,
        deviceId: data.deviceId,
        timestamp: data.timestamp
      });
    }
  }

  // 處理設備連接
  handleDeviceConnected(data) {
    console.log('[SessionManager] 新設備連接:', data);
    
    this.emit('device_connected', {
      deviceId: data.deviceId,
      platform: data.platform,
      timestamp: data.timestamp
    });
  }

  // 處理設備斷開
  handleDeviceDisconnected(data) {
    console.log('[SessionManager] 設備斷開:', data);
    
    this.emit('device_disconnected', {
      deviceId: data.deviceId,
      platform: data.platform,
      timestamp: data.timestamp
    });
  }

  // 同步用戶偏好設置
  syncUserPreferences(preferences) {
    console.log('[SessionManager] 同步用戶偏好設置:', preferences);
    
    // 更新本地偏好設置
    Object.keys(preferences).forEach(key => {
      localStorage.setItem(`pref_${key}`, JSON.stringify(preferences[key]));
    });
    
    this.emit('preferences_synced', preferences);
  }

  // 同步最近活動
  syncRecentActivity(activity) {
    console.log('[SessionManager] 同步最近活動:', activity);
    
    // 更新本地活動記錄
    const existingActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]');
    const mergedActivity = this.mergeActivity(existingActivity, activity);
    
    localStorage.setItem('recentActivity', JSON.stringify(mergedActivity));
    this.emit('activity_synced', mergedActivity);
  }

  // 合併活動記錄
  mergeActivity(existing, incoming) {
    const combined = [...existing, ...incoming];
    
    // 去重並按時間排序
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    return unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
  }

  // 啟用跨設備同步
  enableCrossDeviceSync() {
    this.crossDeviceSync = true;
    console.log('[SessionManager] 啟用跨設備同步');
    
    // 通知服務器啟用同步
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('enable_cross_device_sync', {
        sessionId: this.sessionId,
        deviceId: this.deviceId
      });
    }
  }

  // 禁用跨設備同步
  disableCrossDeviceSync() {
    this.crossDeviceSync = false;
    console.log('[SessionManager] 禁用跨設備同步');
    
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('disable_cross_device_sync', {
        sessionId: this.sessionId,
        deviceId: this.deviceId
      });
    }
  }

  // 獲取會話統計
  getSessionStats() {
    const sessionInfo = this.sessionData.get('sessionInfo');
    if (!sessionInfo) return null;
    
    const now = Date.now();
    const sessionDuration = now - new Date(sessionInfo.startTime).getTime();
    const inactiveTime = now - this.lastActivity;
    
    return {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      userId: sessionInfo.userId,
      platform: sessionInfo.platform,
      startTime: sessionInfo.startTime,
      duration: sessionDuration,
      lastActivity: new Date(this.lastActivity),
      inactiveTime,
      isActive: sessionInfo.isActive,
      crossDeviceSync: this.crossDeviceSync,
      connectionStatus: websocketService.getConnectionStatus()
    };
  }

  // 結束會話
  endSession(reason = 'manual') {
    console.log('[SessionManager] 結束會話:', reason);
    
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    
    // 通知服務器會話結束
    if (websocketService.getConnectionStatus().isConnected && this.sessionId) {
      websocketService.send('session_end', {
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        reason,
        duration: Date.now() - new Date(this.sessionData.get('sessionInfo')?.startTime || Date.now()).getTime(),
        timestamp: Date.now()
      });
    }
    
    // 清理會話數據
    this.sessionData.clear();
    localStorage.removeItem('currentSession');
    
    this.sessionId = null;
    this.emit('session_ended', { reason });
  }

  // 事件發射器
  emit(event, data) {
    // 簡單的事件發射實現
    const customEvent = new CustomEvent(`sessionManager:${event}`, { detail: data });
    window.dispatchEvent(customEvent);
    
    console.log(`[SessionManager] 事件: ${event}`, data);
  }

  // 獲取活躍設備列表
  getActiveDevices() {
    return new Promise((resolve) => {
      if (!websocketService.getConnectionStatus().isConnected) {
        resolve([]);
        return;
      }
      
      const responseHandler = (data) => {
        websocketService.off('active_devices_response', responseHandler);
        resolve(data.devices || []);
      };
      
      websocketService.on('active_devices_response', responseHandler);
      websocketService.send('get_active_devices', {
        sessionId: this.sessionId,
        deviceId: this.deviceId
      });
      
      // 超時處理
      setTimeout(() => {
        websocketService.off('active_devices_response', responseHandler);
        resolve([]);
      }, 5000);
    });
  }

  // 踢出指定設備
  kickoutDevice(targetDeviceId) {
    if (!websocketService.getConnectionStatus().isConnected) {
      console.warn('[SessionManager] 無法踢出設備：WebSocket 未連接');
      return false;
    }
    
    console.log('[SessionManager] 踢出設備:', targetDeviceId);
    
    websocketService.send('kickout_device', {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      targetDeviceId,
      timestamp: Date.now()
    });
    
    return true;
  }

  // 同步當前狀態到其他設備
  syncToOtherDevices(dataType, data) {
    if (!this.crossDeviceSync || !websocketService.getConnectionStatus().isConnected) {
      return false;
    }
    
    console.log('[SessionManager] 同步數據到其他設備:', { dataType, data });
    
    websocketService.send('cross_device_sync', {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      dataType,
      data,
      timestamp: Date.now()
    });
    
    return true;
  }

  // 獲取會話配置
  getSessionConfig() {
    return {
      sessionTimeout: this.sessionTimeout,
      crossDeviceSync: this.crossDeviceSync,
      sessionSyncEnabled: this.sessionSyncEnabled,
      deviceId: this.deviceId,
      sessionId: this.sessionId
    };
  }

  // 更新會話配置
  updateSessionConfig(config) {
    if (config.sessionTimeout) {
      this.sessionTimeout = config.sessionTimeout;
    }
    
    if (config.crossDeviceSync !== undefined) {
      if (config.crossDeviceSync) {
        this.enableCrossDeviceSync();
      } else {
        this.disableCrossDeviceSync();
      }
    }
    
    if (config.sessionSyncEnabled !== undefined) {
      this.sessionSyncEnabled = config.sessionSyncEnabled;
    }
    
    console.log('[SessionManager] 會話配置已更新:', this.getSessionConfig());
    this.emit('config_updated', this.getSessionConfig());
  }
}

// 創建單例實例
export const sessionManager = new SessionManager();
export default sessionManager;