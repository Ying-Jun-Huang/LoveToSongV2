/**
 * 性能監控工具
 * 提供全面的性能數據收集、分析和報告功能
 */

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      sampleRate: 0.1, // 10% 採樣率
      reportInterval: 60000, // 1分鐘
      apiEndpoint: '/api/performance',
      enableResourceTiming: true,
      enableUserTiming: true,
      enableNavigationTiming: true,
      enablePaintTiming: true,
      enableMemoryInfo: true,
      enableFPS: true,
      enableLCP: true, // Largest Contentful Paint
      enableFID: true, // First Input Delay
      enableCLS: true, // Cumulative Layout Shift
      ...config
    };

    this.metrics = {
      navigation: {},
      resources: [],
      userTimings: [],
      vitals: {},
      memory: [],
      fps: [],
      interactions: []
    };

    this.observers = [];
    this.startTime = performance.now();
    this.sessionId = this.generateSessionId();

    if (this.config.enabled && Math.random() < this.config.sampleRate) {
      this.init();
    }
  }

  // 初始化性能監控
  init() {
    this.setupNavigationTiming();
    this.setupResourceTiming();
    this.setupUserTiming();
    this.setupPaintTiming();
    this.setupWebVitals();
    this.setupMemoryMonitoring();
    this.setupFPSMonitoring();
    this.setupInteractionTracking();
    this.startReporting();
    
    console.log('[PerformanceMonitor] Initialized with session ID:', this.sessionId);
  }

  // 生成會話ID
  generateSessionId() {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 設置導航計時
  setupNavigationTiming() {
    if (!this.config.enableNavigationTiming) return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.navigation = {
              type: entry.type,
              redirectTime: entry.redirectEnd - entry.redirectStart,
              dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
              connectTime: entry.connectEnd - entry.connectStart,
              tlsTime: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
              requestTime: entry.responseStart - entry.requestStart,
              responseTime: entry.responseEnd - entry.responseStart,
              domParsingTime: entry.domInteractive - entry.responseEnd,
              domContentLoadedTime: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadEventTime: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.navigationStart,
              timestamp: new Date().toISOString()
            };
          });
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] Navigation timing not supported:', error);
      }
    }
  }

  // 設置資源計時
  setupResourceTiming() {
    if (!this.config.enableResourceTiming) return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.resources.push({
              name: entry.name,
              type: this.getResourceType(entry.name),
              size: entry.transferSize || entry.encodedBodySize,
              duration: entry.duration,
              startTime: entry.startTime,
              dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
              connectTime: entry.connectEnd - entry.connectStart,
              requestTime: entry.responseStart - entry.requestStart,
              responseTime: entry.responseEnd - entry.responseStart,
              cached: entry.transferSize === 0 && entry.encodedBodySize > 0,
              timestamp: new Date().toISOString()
            });
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] Resource timing not supported:', error);
      }
    }
  }

  // 設置用戶計時
  setupUserTiming() {
    if (!this.config.enableUserTiming) return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.userTimings.push({
              name: entry.name,
              type: entry.entryType,
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: new Date().toISOString()
            });
          });
        });
        
        observer.observe({ entryTypes: ['measure', 'mark'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] User timing not supported:', error);
      }
    }
  }

  // 設置繪製計時
  setupPaintTiming() {
    if (!this.config.enablePaintTiming) return;

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.vitals[entry.name] = {
              value: entry.startTime,
              timestamp: new Date().toISOString()
            };
          });
        });
        
        observer.observe({ entryTypes: ['paint'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('[PerformanceMonitor] Paint timing not supported:', error);
      }
    }
  }

  // 設置 Web Vitals 監控
  setupWebVitals() {
    // Largest Contentful Paint (LCP)
    if (this.config.enableLCP && 'PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.vitals.lcp = {
            value: lastEntry.startTime,
            element: lastEntry.element ? lastEntry.element.tagName : null,
            timestamp: new Date().toISOString()
          };
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] LCP not supported:', error);
      }
    }

    // First Input Delay (FID)
    if (this.config.enableFID && 'PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.vitals.fid = {
              value: entry.processingStart - entry.startTime,
              timestamp: new Date().toISOString()
            };
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] FID not supported:', error);
      }
    }

    // Cumulative Layout Shift (CLS)
    if (this.config.enableCLS && 'PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.vitals.cls = {
                value: clsValue,
                timestamp: new Date().toISOString()
              };
            }
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] CLS not supported:', error);
      }
    }
  }

  // 設置內存監控
  setupMemoryMonitoring() {
    if (!this.config.enableMemoryInfo || !performance.memory) return;

    setInterval(() => {
      this.metrics.memory.push({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      });

      // 限制內存數據數量
      if (this.metrics.memory.length > 100) {
        this.metrics.memory = this.metrics.memory.slice(-100);
      }
    }, 5000); // 每5秒記錄一次
  }

  // 設置FPS監控
  setupFPSMonitoring() {
    if (!this.config.enableFPS) return;

    let frames = 0;
    let startTime = performance.now();

    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= startTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - startTime));
        
        this.metrics.fps.push({
          value: fps,
          timestamp: new Date().toISOString()
        });

        // 限制FPS數據數量
        if (this.metrics.fps.length > 60) {
          this.metrics.fps = this.metrics.fps.slice(-60);
        }

        frames = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  // 設置交互追蹤
  setupInteractionTracking() {
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const interactionStart = performance.now();
        
        // 使用 setTimeout 來測量處理時間
        setTimeout(() => {
          const interactionEnd = performance.now();
          const duration = interactionEnd - interactionStart;
          
          if (duration > 16) { // 只記錄超過一幀的交互
            this.metrics.interactions.push({
              type: eventType,
              duration: duration,
              target: event.target ? event.target.tagName : null,
              timestamp: new Date().toISOString()
            });

            // 限制交互數據數量
            if (this.metrics.interactions.length > 100) {
              this.metrics.interactions = this.metrics.interactions.slice(-100);
            }
          }
        }, 0);
      }, { passive: true });
    });
  }

  // 獲取資源類型
  getResourceType(url) {
    if (url.match(/\.(js|mjs)(\?|$)/)) return 'script';
    if (url.match(/\.(css)(\?|$)/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?|$)/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)(\?|$)/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // 開始定期報告
  startReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);

    // 頁面卸載時也發送數據
    window.addEventListener('beforeunload', () => {
      this.reportMetrics(true);
    });
  }

  // 報告性能數據
  async reportMetrics(isBeacon = false) {
    const data = {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionDuration: performance.now() - this.startTime,
      metrics: {
        navigation: this.metrics.navigation,
        resources: this.metrics.resources.slice(-50), // 只發送最近50個資源
        userTimings: this.metrics.userTimings.slice(-20), // 只發送最近20個用戶計時
        vitals: this.metrics.vitals,
        memory: this.metrics.memory.slice(-10), // 只發送最近10個內存數據
        fps: this.metrics.fps.slice(-30), // 只發送最近30個FPS數據
        interactions: this.metrics.interactions.slice(-20) // 只發送最近20個交互
      }
    };

    try {
      if (isBeacon && navigator.sendBeacon) {
        // 使用 sendBeacon 在頁面卸載時發送數據
        navigator.sendBeacon(
          this.config.apiEndpoint,
          JSON.stringify(data)
        );
      } else {
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log('[PerformanceMonitor] Metrics reported successfully');
      }

      // 清空已發送的數據
      this.metrics.resources = [];
      this.metrics.userTimings = [];
    } catch (error) {
      console.warn('[PerformanceMonitor] Failed to report metrics:', error);
    }
  }

  // 手動記錄性能標記
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  // 手動測量性能
  measure(name, startMark, endMark) {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  }

  // 測量函數執行時間
  async measureFunction(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    this.mark(startMark);
    
    try {
      const result = await fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }

  // 獲取當前性能數據
  getMetrics() {
    return {
      sessionId: this.sessionId,
      sessionDuration: performance.now() - this.startTime,
      ...this.metrics
    };
  }

  // 獲取性能摘要
  getSummary() {
    const navigation = this.metrics.navigation;
    const resources = this.metrics.resources;
    const vitals = this.metrics.vitals;
    const fps = this.metrics.fps;
    const memory = this.metrics.memory;

    return {
      sessionId: this.sessionId,
      pageLoadTime: navigation.totalTime || null,
      resourceCount: resources.length,
      avgResourceLoadTime: resources.length > 0 
        ? resources.reduce((sum, r) => sum + r.duration, 0) / resources.length 
        : null,
      vitalsScore: this.calculateVitalsScore(vitals),
      avgFPS: fps.length > 0 
        ? fps.reduce((sum, f) => sum + f.value, 0) / fps.length 
        : null,
      memoryUsage: memory.length > 0 
        ? memory[memory.length - 1].usedJSHeapSize 
        : null,
      timestamp: new Date().toISOString()
    };
  }

  // 計算Web Vitals評分
  calculateVitalsScore(vitals) {
    let score = 100;

    // LCP評分 (目標: < 2.5秒)
    if (vitals.lcp) {
      const lcp = vitals.lcp.value / 1000; // 轉換為秒
      if (lcp > 4) score -= 30;
      else if (lcp > 2.5) score -= 15;
    }

    // FID評分 (目標: < 100毫秒)
    if (vitals.fid) {
      const fid = vitals.fid.value;
      if (fid > 300) score -= 30;
      else if (fid > 100) score -= 15;
    }

    // CLS評分 (目標: < 0.1)
    if (vitals.cls) {
      const cls = vitals.cls.value;
      if (cls > 0.25) score -= 30;
      else if (cls > 0.1) score -= 15;
    }

    return Math.max(0, score);
  }

  // 銷毀監控器
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
    
    // 發送最終數據
    this.reportMetrics(true);
  }
}

// 創建全局實例
const performanceMonitor = new PerformanceMonitor({
  sampleRate: 0.1, // 10% 採樣率
  reportInterval: 60000, // 1分鐘報告一次
  apiEndpoint: '/api/performance'
});

// 導出便捷方法
export const perf = {
  mark: (name) => performanceMonitor.mark(name),
  measure: (name, startMark, endMark) => performanceMonitor.measure(name, startMark, endMark),
  measureFunction: (name, fn) => performanceMonitor.measureFunction(name, fn),
  getMetrics: () => performanceMonitor.getMetrics(),
  getSummary: () => performanceMonitor.getSummary()
};

export default performanceMonitor;