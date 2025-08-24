import websocketService from './websocket';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.performanceObserver = null;
    this.isMonitoring = false;
    this.reportInterval = 60000; // 每分鐘報告一次
    this.reportTimer = null;
    this.metricsBuffer = [];
    this.maxBufferSize = 100;
    
    // 性能閾值配置
    this.thresholds = {
      pageLoadTime: 3000,
      webSocketLatency: 500,
      renderTime: 16.67, // 60fps
      memoryUsage: 100 * 1024 * 1024, // 100MB
      bundleSize: 5 * 1024 * 1024 // 5MB
    };
    
    // 初始化性能監控
    this.initializePerformanceAPI();
  }

  // 初始化 Performance API
  initializePerformanceAPI() {
    // 檢查瀏覽器支持
    if (!window.performance || !window.PerformanceObserver) {
      console.warn('[PerformanceMonitor] Performance API 不支持');
      return;
    }

    try {
      // 監控導航性能
      this.observeNavigation();
      
      // 監控資源加載性能
      this.observeResources();
      
      // 監控長任務
      this.observeLongTasks();
      
      // 監控佈局偏移
      this.observeLayoutShifts();
      
      // 監控 First Content Paint
      this.observePaintTiming();
      
      console.log('[PerformanceMonitor] 性能監控已初始化');
      this.isMonitoring = true;
      
    } catch (error) {
      console.error('[PerformanceMonitor] 初始化失敗:', error);
    }
  }

  // 監控導航性能
  observeNavigation() {
    if (window.PerformanceNavigationTiming) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('navigation', {
            loadEventEnd: entry.loadEventEnd,
            domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
            connectEnd: entry.connectEnd,
            connectStart: entry.connectStart,
            domainLookupEnd: entry.domainLookupEnd,
            domainLookupStart: entry.domainLookupStart,
            fetchStart: entry.fetchStart,
            navigationStart: entry.navigationStart,
            redirectEnd: entry.redirectEnd,
            redirectStart: entry.redirectStart,
            requestStart: entry.requestStart,
            responseEnd: entry.responseEnd,
            responseStart: entry.responseStart,
            timestamp: Date.now()
          });
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // 監控資源加載
  observeResources() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        // 只監控關鍵資源
        if (entry.initiatorType === 'script' || 
            entry.initiatorType === 'css' || 
            entry.name.includes('chunk') ||
            entry.name.includes('main')) {
          
          this.recordMetric('resource', {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || entry.encodedBodySize,
            duration: entry.duration,
            loadTime: entry.responseEnd - entry.fetchStart,
            timestamp: Date.now()
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  // 監控長任務（阻塞主線程）
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('longTask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              timestamp: Date.now()
            });
            
            // 警告長任務
            if (entry.duration > 50) {
              console.warn(`[PerformanceMonitor] 檢測到長任務: ${entry.duration.toFixed(2)}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.log('[PerformanceMonitor] 長任務監控不支持');
      }
    }
  }

  // 監控佈局偏移（CLS）
  observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              this.recordMetric('layoutShift', {
                value: entry.value,
                sources: entry.sources?.map(source => ({
                  node: source.node?.tagName || 'unknown',
                  currentRect: source.currentRect,
                  previousRect: source.previousRect
                })) || [],
                timestamp: Date.now()
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.log('[PerformanceMonitor] 佈局偏移監控不支持');
      }
    }
  }

  // 監控繪製時間
  observePaintTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('paint', {
              name: entry.name,
              startTime: entry.startTime,
              timestamp: Date.now()
            });
          });
        });
        
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.log('[PerformanceMonitor] 繪製時間監控不支持');
      }
    }
  }

  // 記錄自定義指標
  recordMetric(type, data) {
    const metric = {
      type,
      data,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    };
    
    // 添加到緩衝區
    this.metricsBuffer.push(metric);
    
    // 限制緩衝區大小
    if (this.metricsBuffer.length > this.maxBufferSize) {
      this.metricsBuffer.shift();
    }
    
    // 檢查是否超過閾值
    this.checkThresholds(type, data);
    
    // 存儲到 metrics Map
    const typeMetrics = this.metrics.get(type) || [];
    typeMetrics.push(metric);
    
    // 限制每種類型的指標數量
    if (typeMetrics.length > 50) {
      typeMetrics.shift();
    }
    
    this.metrics.set(type, typeMetrics);
  }

  // 檢查性能閾值
  checkThresholds(type, data) {
    let warning = null;
    
    switch (type) {
      case 'navigation':
        if (data.loadEventEnd > this.thresholds.pageLoadTime) {
          warning = `頁面加載時間過長: ${data.loadEventEnd.toFixed(2)}ms`;
        }
        break;
        
      case 'resource':
        if (data.duration > 2000) {
          warning = `資源加載時間過長: ${data.name} (${data.duration.toFixed(2)}ms)`;
        }
        break;
        
      case 'longTask':
        if (data.duration > 100) {
          warning = `檢測到嚴重長任務: ${data.duration.toFixed(2)}ms`;
        }
        break;
        
      case 'layoutShift':
        if (data.value > 0.1) {
          warning = `佈局偏移過大: ${data.value.toFixed(3)}`;
        }
        break;
    }
    
    if (warning) {
      console.warn('[PerformanceMonitor]', warning);
      this.recordMetric('warning', { message: warning, originalType: type });
    }
  }

  // 測量 WebSocket 性能
  measureWebSocketPerformance() {
    const connectionStatus = websocketService.getConnectionStatus();
    const errorStats = websocketService.getErrorStats();
    
    this.recordMetric('websocket', {
      isConnected: connectionStatus.isConnected,
      reconnectAttempts: connectionStatus.reconnectAttempts,
      fallbackMode: connectionStatus.fallbackMode,
      offlineQueueSize: connectionStatus.offlineQueueSize,
      compressionEnabled: connectionStatus.compressionEnabled,
      poolStatus: connectionStatus.connectionPool,
      errorCounts: errorStats.errorCounts,
      syncStatus: errorStats.syncStatus
    });
  }

  // 測量內存使用
  measureMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      
      this.recordMetric('memory', {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        timestamp: Date.now()
      });
      
      // 檢查內存警告
      if (memInfo.usedJSHeapSize > this.thresholds.memoryUsage) {
        console.warn('[PerformanceMonitor] 內存使用過高:', 
          `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }

  // 測量渲染性能
  measureRenderPerformance(componentName, startTime) {
    const renderTime = performance.now() - startTime;
    
    this.recordMetric('render', {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    });
    
    if (renderTime > this.thresholds.renderTime) {
      console.warn(`[PerformanceMonitor] 組件渲染時間過長: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
    
    return renderTime;
  }

  // 開始自動報告
  startAutoReporting() {
    if (this.reportTimer) return;
    
    console.log('[PerformanceMonitor] 開始自動性能報告');
    
    this.reportTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportInterval);
    
    // 測量當前性能指標
    this.measureWebSocketPerformance();
    this.measureMemoryUsage();
  }

  // 停止自動報告
  stopAutoReporting() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
      console.log('[PerformanceMonitor] 停止自動性能報告');
    }
  }

  // 生成性能報告
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.pathname,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      metrics: {},
      summary: {},
      warnings: []
    };
    
    // 收集各類型指標
    for (const [type, typeMetrics] of this.metrics.entries()) {
      if (typeMetrics.length > 0) {
        report.metrics[type] = {
          count: typeMetrics.length,
          latest: typeMetrics[typeMetrics.length - 1],
          average: this.calculateAverage(typeMetrics),
          trends: this.calculateTrends(typeMetrics)
        };
      }
    }
    
    // 生成摘要
    report.summary = this.generateSummary();
    
    // 收集警告
    const warningMetrics = this.metrics.get('warning') || [];
    report.warnings = warningMetrics.slice(-10).map(w => w.data);
    
    console.log('[PerformanceMonitor] 性能報告生成:', report);
    
    // 發送到服務器（如果連接可用）
    if (websocketService.getConnectionStatus().isConnected) {
      websocketService.send('performance_report', report, { priority: 'low' });
    }
    
    // 本地存儲（保留最近5份報告）
    this.saveReportLocally(report);
    
    return report;
  }

  // 計算平均值
  calculateAverage(metrics) {
    if (metrics.length === 0) return 0;
    
    // 根據指標類型計算不同的平均值
    const firstMetric = metrics[0];
    
    if (firstMetric.type === 'navigation') {
      const loadTimes = metrics.map(m => m.data.loadEventEnd).filter(t => t > 0);
      return loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    }
    
    if (firstMetric.type === 'resource') {
      const durations = metrics.map(m => m.data.duration);
      return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }
    
    if (firstMetric.type === 'longTask') {
      const durations = metrics.map(m => m.data.duration);
      return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }
    
    if (firstMetric.type === 'render') {
      const renderTimes = metrics.map(m => m.data.renderTime);
      return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    }
    
    return 0;
  }

  // 計算趨勢
  calculateTrends(metrics) {
    if (metrics.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);
    
    if (older.length === 0) return { trend: 'stable', change: 0 };
    
    const recentAvg = this.calculateAverage(recent);
    const olderAvg = this.calculateAverage(older);
    
    const change = ((recentAvg - olderAvg) / olderAvg * 100);
    
    let trend = 'stable';
    if (change > 10) trend = 'improving';
    else if (change < -10) trend = 'degrading';
    
    return { trend, change: Math.round(change) };
  }

  // 生成性能摘要
  generateSummary() {
    const summary = {
      overallScore: 100,
      categories: {},
      recommendations: []
    };
    
    // 頁面加載性能
    const navMetrics = this.metrics.get('navigation') || [];
    if (navMetrics.length > 0) {
      const avgLoadTime = this.calculateAverage(navMetrics);
      const loadScore = Math.max(0, 100 - (avgLoadTime / this.thresholds.pageLoadTime * 100));
      
      summary.categories.pageLoad = {
        score: Math.round(loadScore),
        avgTime: Math.round(avgLoadTime),
        status: loadScore > 80 ? 'good' : loadScore > 50 ? 'needs-improvement' : 'poor'
      };
      
      if (loadScore < 80) {
        summary.recommendations.push('考慮優化頁面加載時間');
      }
    }
    
    // WebSocket 性能
    const wsMetrics = this.metrics.get('websocket') || [];
    if (wsMetrics.length > 0) {
      const latestWs = wsMetrics[wsMetrics.length - 1].data;
      const wsScore = latestWs.isConnected ? 
        (latestWs.fallbackMode ? 60 : 
         latestWs.reconnectAttempts > 0 ? 80 : 100) : 30;
      
      summary.categories.websocket = {
        score: wsScore,
        isConnected: latestWs.isConnected,
        fallbackMode: latestWs.fallbackMode,
        reconnectAttempts: latestWs.reconnectAttempts,
        status: wsScore > 80 ? 'good' : wsScore > 50 ? 'needs-improvement' : 'poor'
      };
      
      if (wsScore < 80) {
        summary.recommendations.push('檢查網絡連接穩定性');
      }
    }
    
    // 渲染性能
    const renderMetrics = this.metrics.get('render') || [];
    if (renderMetrics.length > 0) {
      const avgRenderTime = this.calculateAverage(renderMetrics);
      const renderScore = Math.max(0, 100 - (avgRenderTime / this.thresholds.renderTime * 10));
      
      summary.categories.render = {
        score: Math.round(renderScore),
        avgTime: avgRenderTime.toFixed(2),
        status: renderScore > 80 ? 'good' : renderScore > 50 ? 'needs-improvement' : 'poor'
      };
      
      if (renderScore < 80) {
        summary.recommendations.push('優化組件渲染性能');
      }
    }
    
    // 計算總體分數
    const categoryScores = Object.values(summary.categories).map(cat => cat.score);
    if (categoryScores.length > 0) {
      summary.overallScore = Math.round(
        categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
      );
    }
    
    return summary;
  }

  // 本地保存報告
  saveReportLocally(report) {
    try {
      const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
      reports.push(report);
      
      // 只保留最近5份報告
      if (reports.length > 5) {
        reports.shift();
      }
      
      localStorage.setItem('performanceReports', JSON.stringify(reports));
    } catch (error) {
      console.warn('[PerformanceMonitor] 保存報告失敗:', error);
    }
  }

  // 獲取歷史報告
  getHistoricalReports() {
    try {
      return JSON.parse(localStorage.getItem('performanceReports') || '[]');
    } catch (error) {
      console.warn('[PerformanceMonitor] 讀取歷史報告失敗:', error);
      return [];
    }
  }

  // 開始監控
  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('[PerformanceMonitor] 開始性能監控');
    this.initializePerformanceAPI();
    this.startAutoReporting();
  }

  // 停止監控
  stopMonitoring() {
    console.log('[PerformanceMonitor] 停止性能監控');
    
    this.isMonitoring = false;
    this.stopAutoReporting();
    
    // 斷開 Performance Observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  // 獲取實時指標
  getRealTimeMetrics() {
    return {
      timestamp: Date.now(),
      connectionStatus: websocketService.getConnectionStatus(),
      memoryUsage: this.getCurrentMemoryUsage(),
      bufferStatus: {
        size: this.metricsBuffer.length,
        maxSize: this.maxBufferSize
      },
      isMonitoring: this.isMonitoring,
      thresholds: this.thresholds
    };
  }

  // 獲取當前內存使用
  getCurrentMemoryUsage() {
    if ('memory' in performance) {
      const mem = performance.memory;
      return {
        used: Math.round(mem.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(mem.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024), // MB
        usage: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100) // %
      };
    }
    return null;
  }

  // 手動觸發性能分析
  analyzeCurrentPerformance() {
    console.log('[PerformanceMonitor] 手動性能分析');
    
    // 測量各項指標
    this.measureWebSocketPerformance();
    this.measureMemoryUsage();
    
    // 生成即時報告
    return this.generatePerformanceReport();
  }

  // 配置性能閾值
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('[PerformanceMonitor] 性能閾值已更新:', this.thresholds);
  }

  // 清除指標數據
  clearMetrics() {
    this.metrics.clear();
    this.metricsBuffer = [];
    console.log('[PerformanceMonitor] 指標數據已清除');
  }
}

// 創建單例實例
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;