import websocketService from './websocket';
import { sessionManager } from './sessionManager';
import { performanceMonitor } from '../services/performanceMonitor-simple';
import { securityManager } from './securityManager';
import { audioNotificationService } from './audioNotifications';

class ServiceIntegrator {
  constructor() {
    this.isInitialized = false;
    this.services = {
      websocket: websocketService,
      session: sessionManager,
      performance: performanceMonitor,
      security: securityManager,
      audio: audioNotificationService
    };
    
    this.serviceStatus = new Map();
    this.integrationEvents = new Map();
  }

  // 初始化所有服務整合
  async initialize(userId, token) {
    if (this.isInitialized) {
      console.log('[ServiceIntegrator] 已經初始化，跳過');
      return true;
    }

    console.log('[ServiceIntegrator] 開始初始化服務整合');

    try {
      // 1. 首先初始化安全管理
      securityManager.initializeSecurity();
      this.serviceStatus.set('security', 'initialized');

      // 2. 初始化性能監控
      performanceMonitor.startMonitoring();
      this.serviceStatus.set('performance', 'initialized');

      // 3. 初始化會話管理
      await sessionManager.initializeSession(userId, token);
      this.serviceStatus.set('session', 'initialized');

      // 4. 初始化音頻通知
      audioNotificationService.initialize();
      this.serviceStatus.set('audio', 'initialized');

      // 5. 最後初始化 WebSocket（依賴其他服務）
      const connected = await websocketService.connect(token);
      this.serviceStatus.set('websocket', connected ? 'connected' : 'failed');

      // 設置服務間通信
      this.setupServiceCommunication();

      // 設置統一錯誤處理
      this.setupUnifiedErrorHandling();

      // 設置服務狀態監控
      this.setupServiceMonitoring();

      this.isInitialized = true;
      console.log('[ServiceIntegrator] 服務整合初始化完成');
      
      // 發送整合完成事件
      this.emit('integration_complete', {
        services: Object.fromEntries(this.serviceStatus),
        timestamp: Date.now()
      });

      return true;

    } catch (error) {
      console.error('[ServiceIntegrator] 初始化失敗:', error);
      this.emit('integration_failed', { error: error.message });
      return false;
    }
  }

  // 設置服務間通信
  setupServiceCommunication() {
    console.log('[ServiceIntegrator] 設置服務間通信');

    // WebSocket 事件 -> 其他服務
    websocketService.on('connect', () => {
      performanceMonitor.measureWebSocketPerformance();
      audioNotificationService.playConnectionSound('success');
      sessionManager.updateActivity();
    });

    websocketService.on('disconnect', () => {
      audioNotificationService.playConnectionSound('warning');
      securityManager.recordSecurityEvent('websocket_disconnected', {
        timestamp: Date.now()
      });
    });

    websocketService.on('reconnecting', () => {
      audioNotificationService.playConnectionSound('info');
    });

    // 會話事件 -> 其他服務
    window.addEventListener('sessionManager:session_timeout_warning', () => {
      audioNotificationService.playNotificationSound('warning');
      securityManager.recordSecurityEvent('session_timeout_warning', {
        sessionId: sessionManager.getSessionConfig().sessionId
      });
    });

    window.addEventListener('sessionManager:session_conflict', (event) => {
      audioNotificationService.playNotificationSound('error');
      securityManager.recordSecurityEvent('session_conflict', event.detail);
    });

    // 安全事件 -> 其他服務
    window.addEventListener('security:incident', (event) => {
      const { severity, type } = event.detail;
      
      // 播放相應的音頻警告
      if (severity === 'critical') {
        audioNotificationService.playNotificationSound('error');
      } else if (severity === 'high') {
        audioNotificationService.playNotificationSound('warning');
      }

      // 記錄性能影響
      performanceMonitor.recordMetric('security_incident', {
        type,
        severity,
        timestamp: Date.now()
      });
    });

    // 性能警告 -> 其他服務
    window.addEventListener('performance:warning', (event) => {
      securityManager.recordSecurityEvent('performance_warning', {
        message: event.detail.message,
        timestamp: Date.now()
      });
    });
  }

  // 設置統一錯誤處理
  setupUnifiedErrorHandling() {
    console.log('[ServiceIntegrator] 設置統一錯誤處理');

    // 全局錯誤處理
    window.addEventListener('error', (event) => {
      this.handleGlobalError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promise 拒絕處理
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });

    // 資源加載錯誤
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleGlobalError('resource_load_error', {
          type: event.target.tagName,
          source: event.target.src || event.target.href,
          message: '資源加載失敗'
        });
      }
    }, true);
  }

  // 處理全局錯誤
  handleGlobalError(type, errorInfo) {
    console.error(`[ServiceIntegrator] 全局錯誤 - ${type}:`, errorInfo);

    // 記錄到安全管理
    securityManager.recordSecurityEvent(type, errorInfo);

    // 記錄到性能監控
    performanceMonitor.recordMetric('error', {
      type,
      ...errorInfo,
      timestamp: Date.now()
    });

    // 播放錯誤音效
    audioNotificationService.playNotificationSound('error');

    // 發送錯誤事件
    this.emit('global_error', { type, errorInfo });
  }

  // 設置服務狀態監控
  setupServiceMonitoring() {
    console.log('[ServiceIntegrator] 設置服務狀態監控');

    setInterval(() => {
      this.checkServiceHealth();
    }, 30000); // 每30秒檢查一次服務健康度
  }

  // 檢查服務健康度
  checkServiceHealth() {
    const healthReport = {
      timestamp: Date.now(),
      services: {}
    };

    // 檢查 WebSocket 服務
    const wsStatus = websocketService.getConnectionStatus();
    healthReport.services.websocket = {
      status: wsStatus.isConnected ? 'healthy' : 'unhealthy',
      details: {
        connected: wsStatus.isConnected,
        reconnectAttempts: wsStatus.reconnectAttempts,
        fallbackMode: wsStatus.fallbackMode,
        offlineQueueSize: wsStatus.offlineQueueSize
      }
    };

    // 檢查會話管理服務
    const sessionStats = sessionManager.getSessionStats();
    healthReport.services.session = {
      status: sessionStats ? 'healthy' : 'unhealthy',
      details: sessionStats
    };

    // 檢查性能監控服務
    const perfMetrics = performanceMonitor.getRealTimeMetrics();
    healthReport.services.performance = {
      status: perfMetrics.isMonitoring ? 'healthy' : 'unhealthy',
      details: {
        monitoring: perfMetrics.isMonitoring,
        bufferSize: perfMetrics.bufferStatus?.size,
        memoryUsage: perfMetrics.memoryUsage
      }
    };

    // 檢查安全管理服務
    const securityStats = securityManager.getSecurityStats();
    healthReport.services.security = {
      status: 'healthy', // 安全服務總是運行
      details: {
        riskLevel: securityStats.riskLevel,
        recentEvents: securityStats.recentEvents,
        riskScore: securityStats.riskScore
      }
    };

    // 記錄健康檢查
    console.log('[ServiceIntegrator] 服務健康檢查:', healthReport);

    // 檢測服務異常
    this.detectServiceAnomalies(healthReport);

    // 發送健康報告
    this.emit('health_check', healthReport);

    return healthReport;
  }

  // 檢測服務異常
  detectServiceAnomalies(healthReport) {
    Object.entries(healthReport.services).forEach(([serviceName, serviceHealth]) => {
      if (serviceHealth.status === 'unhealthy') {
        console.warn(`[ServiceIntegrator] 檢測到服務異常: ${serviceName}`);
        
        // 記錄異常
        securityManager.recordSecurityEvent('service_unhealthy', {
          service: serviceName,
          details: serviceHealth.details
        });

        // 嘗試恢復服務
        this.attemptServiceRecovery(serviceName);
      }
    });
  }

  // 嘗試恢復服務
  async attemptServiceRecovery(serviceName) {
    console.log(`[ServiceIntegrator] 嘗試恢復服務: ${serviceName}`);

    try {
      switch (serviceName) {
        case 'websocket':
          if (!websocketService.getConnectionStatus().isConnected) {
            await websocketService.reconnect();
          }
          break;

        case 'performance':
          if (!performanceMonitor.getRealTimeMetrics().isMonitoring) {
            performanceMonitor.startMonitoring();
          }
          break;

        case 'session':
          const sessionConfig = sessionManager.getSessionConfig();
          if (!sessionConfig.sessionId) {
            // 需要重新初始化會話
            this.emit('session_recovery_needed');
          }
          break;

        case 'audio':
          audioNotificationService.initialize();
          break;
      }

      console.log(`[ServiceIntegrator] 服務恢復完成: ${serviceName}`);
      this.emit('service_recovered', { service: serviceName });

    } catch (error) {
      console.error(`[ServiceIntegrator] 服務恢復失敗: ${serviceName}`, error);
      this.emit('service_recovery_failed', { 
        service: serviceName, 
        error: error.message 
      });
    }
  }

  // 獲取系統整體狀態
  getSystemStatus() {
    const healthReport = this.checkServiceHealth();
    
    const healthyServices = Object.values(healthReport.services)
      .filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(healthReport.services).length;
    
    const overallHealth = (healthyServices / totalServices) * 100;
    
    return {
      timestamp: Date.now(),
      overallHealth: Math.round(overallHealth),
      healthStatus: overallHealth >= 80 ? 'good' : overallHealth >= 50 ? 'warning' : 'critical',
      services: healthReport.services,
      isInitialized: this.isInitialized,
      integrationEvents: this.getRecentIntegrationEvents()
    };
  }

  // 獲取最近的整合事件
  getRecentIntegrationEvents() {
    const events = [];
    
    for (const [eventType, eventList] of this.integrationEvents.entries()) {
      events.push(...eventList.slice(-5).map(event => ({
        type: eventType,
        ...event
      })));
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }

  // 強制同步所有服務
  async forceSyncAllServices() {
    console.log('[ServiceIntegrator] 強制同步所有服務');

    const results = {
      websocket: false,
      session: false,
      performance: false,
      security: false
    };

    try {
      // 同步 WebSocket 數據
      if (websocketService.getConnectionStatus().isConnected) {
        websocketService.performDataSync();
        results.websocket = true;
      }

      // 更新會話活動
      sessionManager.updateActivity();
      results.session = true;

      // 生成性能報告
      performanceMonitor.analyzeCurrentPerformance();
      results.performance = true;

      // 執行安全審計
      securityManager.auditCodeSecurity();
      results.security = true;

      console.log('[ServiceIntegrator] 服務同步完成:', results);
      this.emit('force_sync_complete', results);

      return results;

    } catch (error) {
      console.error('[ServiceIntegrator] 服務同步失敗:', error);
      this.emit('force_sync_failed', { error: error.message });
      return results;
    }
  }

  // 關閉所有服務
  shutdown() {
    console.log('[ServiceIntegrator] 關閉所有服務');

    try {
      // 停止性能監控
      performanceMonitor.stopMonitoring();
      
      // 結束會話
      sessionManager.endSession('shutdown');
      
      // 斷開 WebSocket 連接
      websocketService.disconnect();
      
      // 清理事件監聽器
      this.clearAllEventListeners();
      
      this.isInitialized = false;
      console.log('[ServiceIntegrator] 所有服務已關閉');
      
      this.emit('shutdown_complete');

    } catch (error) {
      console.error('[ServiceIntegrator] 關閉服務時出錯:', error);
    }
  }

  // 清理所有事件監聽器
  clearAllEventListeners() {
    // 清理 WebSocket 事件
    websocketService.removeAllListeners();
    
    // 清理整合事件
    this.integrationEvents.clear();
  }

  // 重新啟動所有服務
  async restart(userId, token) {
    console.log('[ServiceIntegrator] 重新啟動所有服務');
    
    this.shutdown();
    
    // 等待一秒讓服務完全關閉
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.initialize(userId, token);
  }

  // 事件發射器
  emit(eventType, data) {
    const event = {
      ...data,
      timestamp: data.timestamp || Date.now()
    };

    // 記錄整合事件
    if (!this.integrationEvents.has(eventType)) {
      this.integrationEvents.set(eventType, []);
    }
    
    const eventList = this.integrationEvents.get(eventType);
    eventList.push(event);
    
    // 限制事件記錄數量
    if (eventList.length > 50) {
      eventList.shift();
    }

    // 發送自定義事件
    window.dispatchEvent(new CustomEvent(`serviceIntegrator:${eventType}`, {
      detail: event
    }));

    console.log(`[ServiceIntegrator] 事件: ${eventType}`, event);
  }

  // 獲取服務配置
  getServiceConfigurations() {
    return {
      websocket: {
        maxReconnectAttempts: 8,
        heartbeatInterval: 10000,
        compressionEnabled: true,
        fallbackMode: websocketService.getConnectionStatus().fallbackMode
      },
      session: sessionManager.getSessionConfig(),
      performance: {
        reportInterval: 60000,
        isMonitoring: performanceMonitor.getRealTimeMetrics().isMonitoring,
        thresholds: performanceMonitor.getRealTimeMetrics().thresholds
      },
      security: {
        rateLimitStatus: securityManager.getSecurityStats().rateLimitStatus,
        riskLevel: securityManager.getSecurityStats().riskLevel
      },
      audio: {
        enabled: audioNotificationService.isEnabled(),
        volume: audioNotificationService.getVolume()
      }
    };
  }

  // 更新服務配置
  async updateServiceConfigurations(configs) {
    console.log('[ServiceIntegrator] 更新服務配置:', configs);

    try {
      // 更新會話配置
      if (configs.session) {
        sessionManager.updateSessionConfig(configs.session);
      }

      // 更新性能監控配置
      if (configs.performance) {
        if (configs.performance.thresholds) {
          performanceMonitor.updateThresholds(configs.performance.thresholds);
        }
      }

      // 更新音頻配置
      if (configs.audio) {
        if (configs.audio.enabled !== undefined) {
          if (configs.audio.enabled) {
            audioNotificationService.enable();
          } else {
            audioNotificationService.disable();
          }
        }
        if (configs.audio.volume !== undefined) {
          audioNotificationService.setVolume(configs.audio.volume);
        }
      }

      this.emit('config_updated', configs);
      return true;

    } catch (error) {
      console.error('[ServiceIntegrator] 配置更新失敗:', error);
      this.emit('config_update_failed', { error: error.message });
      return false;
    }
  }

  // 執行系統診斷
  async performSystemDiagnostic() {
    console.log('[ServiceIntegrator] 執行系統診斷');

    const diagnostic = {
      timestamp: Date.now(),
      systemStatus: this.getSystemStatus(),
      serviceConfigs: this.getServiceConfigurations(),
      healthChecks: {},
      recommendations: []
    };

    // WebSocket 健康檢查
    diagnostic.healthChecks.websocket = await this.diagnosticWebSocket();
    
    // 性能健康檢查
    diagnostic.healthChecks.performance = this.diagnosticPerformance();
    
    // 安全健康檢查
    diagnostic.healthChecks.security = this.diagnosticSecurity();
    
    // 會話健康檢查
    diagnostic.healthChecks.session = this.diagnosticSession();

    // 生成建議
    diagnostic.recommendations = this.generateSystemRecommendations(diagnostic);

    console.log('[ServiceIntegrator] 系統診斷完成:', diagnostic);
    this.emit('diagnostic_complete', diagnostic);

    return diagnostic;
  }

  // WebSocket 診斷
  async diagnosticWebSocket() {
    const status = websocketService.getConnectionStatus();
    const errorStats = websocketService.getErrorStats();

    return {
      connected: status.isConnected,
      reconnectAttempts: status.reconnectAttempts,
      fallbackMode: status.fallbackMode,
      offlineQueueSize: status.offlineQueueSize,
      compressionEnabled: status.compressionEnabled,
      poolEnabled: status.connectionPool?.enabled || false,
      errorCounts: errorStats.errorCounts,
      lastErrors: errorStats.lastErrors,
      recommendations: this.getWebSocketRecommendations(status, errorStats)
    };
  }

  // 性能診斷
  diagnosticPerformance() {
    const metrics = performanceMonitor.getRealTimeMetrics();
    const report = performanceMonitor.analyzeCurrentPerformance();

    return {
      isMonitoring: metrics.isMonitoring,
      memoryUsage: metrics.memoryUsage,
      bufferStatus: metrics.bufferStatus,
      summary: report.summary,
      recommendations: report.summary?.recommendations || []
    };
  }

  // 安全診斷
  diagnosticSecurity() {
    const stats = securityManager.getSecurityStats();
    const auditResults = securityManager.auditCodeSecurity();

    return {
      riskLevel: stats.riskLevel,
      riskScore: stats.riskScore,
      recentEvents: stats.recentEvents,
      rateLimitStatus: stats.rateLimitStatus,
      auditResults,
      recommendations: stats.recommendations
    };
  }

  // 會話診斷
  diagnosticSession() {
    const stats = sessionManager.getSessionStats();
    const config = sessionManager.getSessionConfig();

    return {
      hasActiveSession: !!stats,
      sessionDuration: stats?.duration,
      isActive: stats?.isActive,
      crossDeviceSync: config.crossDeviceSync,
      deviceId: config.deviceId,
      recommendations: this.getSessionRecommendations(stats, config)
    };
  }

  // 生成 WebSocket 建議
  getWebSocketRecommendations(status, errorStats) {
    const recommendations = [];

    if (status.reconnectAttempts > 3) {
      recommendations.push('網絡連接不穩定，考慮檢查網絡環境');
    }

    if (status.fallbackMode) {
      recommendations.push('當前使用降級模式，可能影響即時性');
    }

    if (status.offlineQueueSize > 10) {
      recommendations.push('離線隊列過大，考慮清理或增加發送頻率');
    }

    if (Object.keys(errorStats.errorCounts).length > 5) {
      recommendations.push('錯誤類型較多，建議檢查系統穩定性');
    }

    return recommendations;
  }

  // 生成會話建議
  getSessionRecommendations(stats, config) {
    const recommendations = [];

    if (stats && stats.inactiveTime > 300000) { // 5分鐘
      recommendations.push('用戶長時間無活動，考慮會話延期提醒');
    }

    if (!config.crossDeviceSync) {
      recommendations.push('未啟用跨設備同步，可能影響多設備使用體驗');
    }

    if (stats && stats.duration > 3600000) { // 1小時
      recommendations.push('會話時間較長，建議適時休息');
    }

    return recommendations;
  }

  // 生成系統建議
  generateSystemRecommendations(diagnostic) {
    const recommendations = [];

    // 收集所有服務的建議
    Object.values(diagnostic.healthChecks).forEach(healthCheck => {
      if (healthCheck.recommendations) {
        recommendations.push(...healthCheck.recommendations);
      }
    });

    // 系統級別建議
    if (diagnostic.systemStatus.overallHealth < 70) {
      recommendations.push('系統整體健康度較低，建議檢查所有服務狀態');
    }

    // 去重並限制數量
    return [...new Set(recommendations)].slice(0, 10);
  }
}

// 創建單例實例
export const serviceIntegrator = new ServiceIntegrator();
export default serviceIntegrator;