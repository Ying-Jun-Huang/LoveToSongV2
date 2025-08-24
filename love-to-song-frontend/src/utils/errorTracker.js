/**
 * 錯誤監控和日誌系統
 * 提供全面的錯誤追蹤、日誌記錄和報告功能
 */

class ErrorTracker {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      maxLogEntries: 1000,
      maxRetries: 3,
      reportInterval: 30000, // 30秒
      storageKey: 'love-to-song-error-logs',
      apiEndpoint: '/api/errors',
      enableConsoleCapture: true,
      enableUnhandledRejection: true,
      enableResourceErrors: true,
      enablePerformanceTracking: true,
      ...config
    };

    this.logBuffer = [];
    this.errorCount = {
      total: 0,
      javascript: 0,
      network: 0,
      resource: 0,
      unhandledRejection: 0,
      custom: 0
    };

    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    if (this.config.enabled) {
      this.init();
    }
  }

  // 初始化錯誤監控
  init() {
    this.setupGlobalErrorHandlers();
    this.setupConsoleCapture();
    this.setupPerformanceTracking();
    this.startReportingInterval();
    this.loadStoredLogs();
    
    // ErrorTracker initialized
  }

  // 生成會話ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 設置全局錯誤處理器
  setupGlobalErrorHandlers() {
    // JavaScript 錯誤
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });

    // Promise 未處理拒絕
    if (this.config.enableUnhandledRejection) {
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          type: 'unhandledRejection',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          reason: event.reason,
          stack: event.reason?.stack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      });
    }

    // 資源載入錯誤
    if (this.config.enableResourceErrors) {
      window.addEventListener('error', (event) => {
        if (event.target !== window) {
          this.logError({
            type: 'resource',
            message: `Failed to load resource: ${event.target.src || event.target.href}`,
            element: event.target.tagName,
            source: event.target.src || event.target.href,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
        }
      }, true);
    }
  }

  // 設置控制台捕獲
  setupConsoleCapture() {
    if (!this.config.enableConsoleCapture) return;

    const originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log
    };

    // 捕獲 console.error
    console.error = (...args) => {
      originalConsole.error.apply(console, args);
      this.logError({
        type: 'console',
        level: 'error',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };

    // 捕獲 console.warn
    console.warn = (...args) => {
      originalConsole.warn.apply(console, args);
      this.logWarning({
        type: 'console',
        level: 'warn',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };
  }

  // 設置性能追蹤
  setupPerformanceTracking() {
    if (!this.config.enablePerformanceTracking) return;

    // 監控長任務
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // 超過50ms的任務
              this.logPerformance({
                type: 'long-task',
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
                timestamp: new Date().toISOString()
              });
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('[ErrorTracker] Long task observer not supported');
      }

      // 監控載入性能
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.logPerformance({
              type: 'navigation',
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint(),
              timestamp: new Date().toISOString()
            });
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('[ErrorTracker] Navigation observer not supported');
      }
    }
  }

  // 獲取首次繪製時間
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // 獲取首次內容繪製時間
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  // 記錄錯誤
  logError(errorInfo) {
    if (!this.config.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      level: 'error',
      category: errorInfo.type || 'unknown',
      ...errorInfo,
      context: this.getContext()
    };

    this.addToBuffer(logEntry);
    this.incrementErrorCount(errorInfo.type || 'custom');
    
    console.error('[ErrorTracker] Error logged:', logEntry);
  }

  // 記錄警告
  logWarning(warningInfo) {
    if (!this.config.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      level: 'warning',
      category: warningInfo.type || 'unknown',
      ...warningInfo,
      context: this.getContext()
    };

    this.addToBuffer(logEntry);
  }

  // 記錄信息
  logInfo(infoData) {
    if (!this.config.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      level: 'info',
      category: infoData.type || 'general',
      ...infoData,
      context: this.getContext(),
      timestamp: new Date().toISOString()
    };

    this.addToBuffer(logEntry);
  }

  // 記錄性能數據
  logPerformance(performanceData) {
    if (!this.config.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      level: 'performance',
      category: 'performance',
      ...performanceData,
      context: this.getContext()
    };

    this.addToBuffer(logEntry);
  }

  // 記錄自定義事件
  logEvent(eventName, eventData = {}) {
    if (!this.config.enabled) return;

    const logEntry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      level: 'event',
      category: 'custom',
      eventName,
      eventData,
      context: this.getContext(),
      timestamp: new Date().toISOString()
    };

    this.addToBuffer(logEntry);
  }

  // 生成日誌ID
  generateLogId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  // 獲取上下文信息
  getContext() {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  // 添加到緩衝區
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);

    // 限制緩衝區大小
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }

    // 立即存儲到本地
    this.storeLogsLocally();
  }

  // 增加錯誤計數
  incrementErrorCount(type) {
    this.errorCount.total++;
    if (this.errorCount.hasOwnProperty(type)) {
      this.errorCount[type]++;
    } else {
      this.errorCount.custom++;
    }
  }

  // 開始定期報告
  startReportingInterval() {
    setInterval(() => {
      this.reportErrors();
    }, this.config.reportInterval);
  }

  // 報告錯誤到服務器
  async reportErrors() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = []; // 清空緩衝區

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logs: logsToSend,
          errorCount: this.errorCount,
          sessionDuration: Date.now() - this.startTime,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Successfully reported logs
    } catch (error) {
      console.warn('[ErrorTracker] Failed to report errors:', error);
      // 重新添加到緩衝區
      this.logBuffer.unshift(...logsToSend);
    }
  }

  // 存儲日誌到本地存儲
  storeLogsLocally() {
    try {
      const data = {
        sessionId: this.sessionId,
        logs: this.logBuffer.slice(-100), // 只保存最近100條
        errorCount: this.errorCount,
        lastUpdated: Date.now()
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[ErrorTracker] Failed to store logs locally:', error);
    }
  }

  // 從本地存儲載入日誌
  loadStoredLogs() {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // 如果是同一個會話，恢復日誌
        if (parsed.sessionId === this.sessionId) {
          this.logBuffer = parsed.logs || [];
          this.errorCount = { ...this.errorCount, ...parsed.errorCount };
        }
      }
    } catch (error) {
      console.warn('[ErrorTracker] Failed to load stored logs:', error);
    }
  }

  // 清空日誌
  clearLogs() {
    this.logBuffer = [];
    this.errorCount = {
      total: 0,
      javascript: 0,
      network: 0,
      resource: 0,
      unhandledRejection: 0,
      custom: 0
    };
    
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.warn('[ErrorTracker] Failed to clear stored logs:', error);
    }
  }

  // 獲取錯誤統計
  getErrorStats() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      errorCount: { ...this.errorCount },
      logCount: this.logBuffer.length,
      lastError: this.logBuffer.filter(log => log.level === 'error').slice(-1)[0] || null
    };
  }

  // 獲取日誌
  getLogs(filter = {}) {
    let logs = [...this.logBuffer];

    // 按級別過濾
    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    // 按類別過濾
    if (filter.category) {
      logs = logs.filter(log => log.category === filter.category);
    }

    // 按時間範圍過濾
    if (filter.startTime || filter.endTime) {
      logs = logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        if (filter.startTime && logTime < filter.startTime) return false;
        if (filter.endTime && logTime > filter.endTime) return false;
        return true;
      });
    }

    // 排序
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return logs;
  }

  // 手動觸發錯誤報告
  async flushLogs() {
    await this.reportErrors();
  }

  // 銷毀實例
  destroy() {
    this.config.enabled = false;
    this.flushLogs();
  }
}

// 創建全局實例 - 暫時禁用以避免熱重載衝突
// const errorTracker = new ErrorTracker({
//   apiEndpoint: '/api/errors',
//   reportInterval: 30000,
//   maxLogEntries: 1000
// });

// 臨時空實例來避免錯誤
const errorTracker = {
  logError: () => {},
  logWarning: () => {},
  logInfo: () => {},
  logPerformance: () => {},
  reportErrors: () => {},
  clearLogs: () => {},
  getStoredLogs: () => []
};

// 導出便捷方法
export const logger = {
  error: (message, extra = {}) => errorTracker.logError({
    type: 'custom',
    message,
    ...extra
  }),
  
  warn: (message, extra = {}) => errorTracker.logWarning({
    type: 'custom',
    message,
    ...extra
  }),
  
  info: (message, extra = {}) => errorTracker.logInfo({
    type: 'custom',
    message,
    ...extra
  }),
  
  event: (eventName, eventData) => errorTracker.logEvent(eventName, eventData),
  
  performance: (performanceData) => errorTracker.logPerformance(performanceData),
  
  getStats: () => errorTracker.getErrorStats(),
  getLogs: (filter) => errorTracker.getLogs(filter),
  clearLogs: () => errorTracker.clearLogs(),
  flush: () => errorTracker.flushLogs()
};

export default errorTracker;