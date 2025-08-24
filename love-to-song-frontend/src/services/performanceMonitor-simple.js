class SimplePerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.reportInterval = 300000; // 每5分鐘報告一次
    this.reportTimer = null;
    
    // 更寬鬆的性能閾值
    this.thresholds = {
      longTask: 1000, // 1秒才算長任務
      criticalTask: 2000, // 2秒才算嚴重長任務
    };
    
    this.performanceObserver = null;
  }

  // 啟動監控
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('[PerformanceMonitor] 啟動簡化性能監控');
    
    // 只監控長任務
    if (window.PerformanceObserver) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > this.thresholds.longTask) {
              if (entry.duration > this.thresholds.criticalTask) {
                console.warn(`[PerformanceMonitor] 嚴重長任務: ${entry.duration.toFixed(2)}ms`);
              } else {
                console.log(`[PerformanceMonitor] 長任務: ${entry.duration.toFixed(2)}ms`);
              }
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('[PerformanceMonitor] 無法啟動長任務監控:', error);
      }
    }
    
    // 定期報告
    this.reportTimer = setInterval(() => {
      this.generateReport();
    }, this.reportInterval);
  }

  // 停止監控
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('[PerformanceMonitor] 停止性能監控');
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  // 檢查記憶體使用量（不頻繁警告）
  checkMemory() {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      // 只有超過200MB才警告
      if (usedMB > 200) {
        console.warn(`[PerformanceMonitor] 高記憶體使用: ${usedMB.toFixed(2)}MB`);
      }
      
      return {
        used: usedMB,
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024
      };
    }
    return null;
  }

  // 生成簡化報告
  generateReport() {
    const memory = this.checkMemory();
    const report = {
      timestamp: Date.now(),
      memory: memory,
      userAgent: navigator.userAgent,
    };
    
    console.log('[PerformanceMonitor] 性能報告:', report);
    return report;
  }

  // 手動記錄性能標記
  mark(name) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  // 測量兩個標記之間的時間
  measure(name, startMark, endMark) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measures = window.performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const duration = measures[measures.length - 1].duration;
          if (duration > 100) { // 只記錄超過100ms的操作
            console.log(`[PerformanceMonitor] ${name}: ${duration.toFixed(2)}ms`);
          }
          return duration;
        }
      } catch (error) {
        console.warn('[PerformanceMonitor] 測量失敗:', error);
      }
    }
    return null;
  }
}

// 導出單例
const performanceMonitor = new SimplePerformanceMonitor();
export { performanceMonitor };