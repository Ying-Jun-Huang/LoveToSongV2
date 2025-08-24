import websocketService from './websocket';

class SecurityManager {
  constructor() {
    // 請求限流配置
    this.rateLimiters = new Map();
    this.defaultLimits = {
      'song_request': { maxRequests: 10, windowMs: 60000 }, // 每分鐘最多10個點歌請求
      'websocket_send': { maxRequests: 100, windowMs: 60000 }, // 每分鐘最多100個WebSocket消息
      'api_call': { maxRequests: 200, windowMs: 60000 }, // 每分鐘最多200個API調用
      'login_attempt': { maxRequests: 5, windowMs: 300000 }, // 每5分鐘最多5次登錄嘗試
    };
    
    // 安全事件記錄
    this.securityEvents = [];
    this.maxSecurityEvents = 1000;
    
    // 懷疑活動檢測
    this.suspiciousActivityThresholds = {
      rapidRequests: 50, // 短時間內大量請求
      repeatedFailures: 10, // 重複失敗操作
      unusualPatterns: 5 // 異常行為模式
    };
    
    // 黑名單和白名單
    this.blacklistedIPs = new Set();
    this.whitelistedActions = new Set(['ping', 'pong', 'heartbeat']);
    
    // 內容安全策略
    this.cspViolations = [];
    
    // 初始化安全監控
    this.initializeSecurity();
  }

  // 初始化安全監控
  initializeSecurity() {
    console.log('[SecurityManager] 初始化安全管理');
    
    // 設置 Content Security Policy 違規監聽
    this.setupCSPViolationListener();
    
    // 監控 WebSocket 消息
    this.setupWebSocketSecurity();
    
    // 設置請求攔截
    this.setupRequestInterception();
    
    // 初始化限流器
    this.initializeRateLimiters();
    
    console.log('[SecurityManager] 安全管理已初始化');
  }

  // 設置 CSP 違規監聽
  setupCSPViolationListener() {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        timestamp: Date.now()
      };
      
      this.recordSecurityEvent('csp_violation', violation);
      console.warn('[SecurityManager] CSP 違規檢測到:', violation);
    });
  }

  // 設置 WebSocket 安全監控
  setupWebSocketSecurity() {
    // 監控 WebSocket 發送
    const originalSend = websocketService.send.bind(websocketService);
    websocketService.send = (event, data, options = {}) => {
      // 檢查請求限流
      if (!this.checkRateLimit('websocket_send', `${event}_${data?.eventId || 'global'}`)) {
        console.warn('[SecurityManager] WebSocket 發送被限流:', event);
        this.recordSecurityEvent('rate_limit_exceeded', {
          type: 'websocket_send',
          event,
          data: this.sanitizeData(data)
        });
        return false;
      }
      
      // 檢查數據安全
      if (!this.validateWebSocketData(event, data)) {
        console.warn('[SecurityManager] WebSocket 數據安全檢查失敗:', event);
        return false;
      }
      
      // 記錄安全事件
      this.recordSecurityEvent('websocket_send', {
        event,
        dataSize: JSON.stringify(data || {}).length,
        priority: options.priority || 'normal'
      });
      
      return originalSend(event, data, options);
    };
  }

  // 設置請求攔截
  setupRequestInterception() {
    // 攔截 fetch 請求
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      const requestInfo = {
        url: typeof url === 'string' ? url : url.url,
        method: options.method || 'GET',
        timestamp: Date.now()
      };
      
      // 檢查 API 調用限流
      if (!this.checkRateLimit('api_call', requestInfo.url)) {
        const error = new Error('API 調用頻率過高，請稍後再試');
        this.recordSecurityEvent('api_rate_limit_exceeded', requestInfo);
        throw error;
      }
      
      // 記錄 API 調用
      this.recordSecurityEvent('api_call', requestInfo);
      
      try {
        const response = await originalFetch(url, options);
        
        // 記錄響應狀態
        this.recordSecurityEvent('api_response', {
          ...requestInfo,
          status: response.status,
          statusText: response.statusText
        });
        
        return response;
      } catch (error) {
        // 記錄請求失敗
        this.recordSecurityEvent('api_error', {
          ...requestInfo,
          error: error.message
        });
        throw error;
      }
    };
  }

  // 初始化限流器
  initializeRateLimiters() {
    for (const [action, config] of Object.entries(this.defaultLimits)) {
      this.rateLimiters.set(action, {
        requests: new Map(),
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      });
    }
  }

  // 檢查請求限流
  checkRateLimit(action, identifier = 'default') {
    const limiter = this.rateLimiters.get(action);
    if (!limiter) return true;
    
    const now = Date.now();
    const key = `${action}_${identifier}`;
    const requests = limiter.requests.get(key) || [];
    
    // 清理過期請求
    const validRequests = requests.filter(time => now - time < limiter.windowMs);
    
    // 檢查是否超過限制
    if (validRequests.length >= limiter.maxRequests) {
      console.warn(`[SecurityManager] 請求限流觸發: ${action} (${validRequests.length}/${limiter.maxRequests})`);
      return false;
    }
    
    // 記錄當前請求
    validRequests.push(now);
    limiter.requests.set(key, validRequests);
    
    return true;
  }

  // 驗證 WebSocket 數據
  validateWebSocketData(event, data) {
    // 檢查事件名稱
    if (typeof event !== 'string' || event.length > 100) {
      this.recordSecurityEvent('invalid_websocket_event', { event });
      return false;
    }
    
    // 檢查數據大小
    const dataSize = JSON.stringify(data || {}).length;
    if (dataSize > 1024 * 1024) { // 1MB 限制
      this.recordSecurityEvent('oversized_websocket_data', { event, dataSize });
      return false;
    }
    
    // 檢查敏感數據
    if (this.containsSensitiveData(data)) {
      this.recordSecurityEvent('sensitive_data_detected', { event, data: '[REDACTED]' });
      return false;
    }
    
    // 檢查是否為白名單事件
    if (this.whitelistedActions.has(event)) {
      return true;
    }
    
    // 檢查 XSS 攻擊
    if (this.detectXSSAttempt(data)) {
      this.recordSecurityEvent('xss_attempt_detected', { event, data: '[REDACTED]' });
      return false;
    }
    
    return true;
  }

  // 檢測敏感數據
  containsSensitiveData(data) {
    if (!data || typeof data !== 'object') return false;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    return sensitiveFields.some(field => dataString.includes(field));
  }

  // 檢測 XSS 攻擊嘗試
  detectXSSAttempt(data) {
    if (!data) return false;
    
    const dataString = JSON.stringify(data).toLowerCase();
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(dataString));
  }

  // 記錄安全事件
  recordSecurityEvent(type, data) {
    const event = {
      type,
      data: this.sanitizeData(data),
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };
    
    this.securityEvents.push(event);
    
    // 限制事件記錄數量
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift();
    }
    
    // 檢查是否為高風險事件
    if (this.isHighRiskEvent(type)) {
      this.handleHighRiskEvent(event);
    }
    
    // 發送到服務器（延遲發送，避免影響性能）
    setTimeout(() => {
      if (websocketService.getConnectionStatus().isConnected) {
        websocketService.send('security_event', event, { priority: 'low' });
      }
    }, 1000);
  }

  // 清理敏感數據
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // 判斷是否為高風險事件
  isHighRiskEvent(type) {
    const highRiskEvents = [
      'csp_violation',
      'xss_attempt_detected',
      'rate_limit_exceeded',
      'invalid_websocket_event',
      'sensitive_data_detected'
    ];
    
    return highRiskEvents.includes(type);
  }

  // 處理高風險事件
  handleHighRiskEvent(event) {
    console.error('[SecurityManager] 高風險安全事件:', event);
    
    // 增加安全級別
    this.escalateSecurityLevel(event.type);
    
    // 通知用戶（如果需要）
    if (this.shouldNotifyUser(event.type)) {
      this.notifySecurityIncident(event);
    }
    
    // 自動防護措施
    this.applyAutomaticProtection(event);
  }

  // 提升安全級別
  escalateSecurityLevel(eventType) {
    const escalationActions = {
      'xss_attempt_detected': () => {
        console.warn('[SecurityManager] XSS 攻擊檢測，加強輸入驗證');
        this.enhanceInputValidation();
      },
      'rate_limit_exceeded': () => {
        console.warn('[SecurityManager] 請求頻率過高，臨時限制');
        this.temporaryRestriction();
      },
      'csp_violation': () => {
        console.warn('[SecurityManager] CSP 違規，檢查代碼安全');
        this.auditCodeSecurity();
      }
    };
    
    const action = escalationActions[eventType];
    if (action) {
      action();
    }
  }

  // 通知安全事件
  notifySecurityIncident(event) {
    // 發送自定義事件給 UI 組件
    window.dispatchEvent(new CustomEvent('security:incident', {
      detail: {
        type: event.type,
        severity: this.getSeverityLevel(event.type),
        message: this.getSecurityMessage(event.type),
        timestamp: event.timestamp
      }
    }));
  }

  // 獲取安全事件嚴重程度
  getSeverityLevel(eventType) {
    const severityMap = {
      'xss_attempt_detected': 'critical',
      'csp_violation': 'high',
      'rate_limit_exceeded': 'medium',
      'invalid_websocket_event': 'medium',
      'sensitive_data_detected': 'high',
      'api_error': 'low'
    };
    
    return severityMap[eventType] || 'low';
  }

  // 獲取安全消息
  getSecurityMessage(eventType) {
    const messages = {
      'xss_attempt_detected': '檢測到潛在的跨站腳本攻擊嘗試',
      'csp_violation': '內容安全策略違規',
      'rate_limit_exceeded': '請求頻率過高，請稍後再試',
      'invalid_websocket_event': '無效的 WebSocket 事件',
      'sensitive_data_detected': '檢測到敏感數據傳輸',
      'api_error': 'API 請求錯誤'
    };
    
    return messages[eventType] || '未知安全事件';
  }

  // 判斷是否應該通知用戶
  shouldNotifyUser(eventType) {
    const notifyEvents = ['rate_limit_exceeded', 'session_security_warning'];
    return notifyEvents.includes(eventType);
  }

  // 應用自動防護措施
  applyAutomaticProtection(event) {
    switch (event.type) {
      case 'rate_limit_exceeded':
        // 臨時增加延遲
        this.addTemporaryDelay(event.data.type);
        break;
        
      case 'xss_attempt_detected':
        // 暫時禁用某些功能
        this.temporaryFeatureDisable(['html_content', 'user_input']);
        break;
        
      case 'suspicious_activity':
        // 要求重新驗證
        this.requestReauthentication();
        break;
    }
  }

  // 添加臨時延遲
  addTemporaryDelay(actionType) {
    const delayKey = `delay_${actionType}`;
    const currentDelay = this.rateLimiters.get(delayKey) || 0;
    const newDelay = Math.min(currentDelay + 1000, 10000); // 最多10秒延遲
    
    this.rateLimiters.set(delayKey, newDelay);
    
    console.log(`[SecurityManager] 添加臨時延遲: ${actionType} (${newDelay}ms)`);
    
    // 5分鐘後移除延遲
    setTimeout(() => {
      this.rateLimiters.delete(delayKey);
    }, 300000);
  }

  // 臨時禁用功能
  temporaryFeatureDisable(features) {
    console.warn('[SecurityManager] 臨時禁用功能:', features);
    
    features.forEach(feature => {
      localStorage.setItem(`security_disabled_${feature}`, Date.now().toString());
    });
    
    // 30分鐘後重新啟用
    setTimeout(() => {
      features.forEach(feature => {
        localStorage.removeItem(`security_disabled_${feature}`);
      });
      console.log('[SecurityManager] 功能已重新啟用:', features);
    }, 1800000);
  }

  // 請求重新驗證
  requestReauthentication() {
    console.warn('[SecurityManager] 請求重新驗證');
    
    this.notifySecurityIncident({
      type: 'reauthentication_required',
      timestamp: Date.now()
    });
    
    // 清除本地認證信息
    localStorage.removeItem('token');
    
    // 通知應用需要重新登錄
    window.dispatchEvent(new CustomEvent('security:reauthentication_required'));
  }

  // 檢查功能是否被安全禁用
  isFeatureSecurityDisabled(feature) {
    const disabledTime = localStorage.getItem(`security_disabled_${feature}`);
    if (!disabledTime) return false;
    
    const disabledAt = parseInt(disabledTime);
    const now = Date.now();
    
    // 檢查是否仍在禁用期內
    return (now - disabledAt) < 1800000; // 30分鐘
  }

  // 增強輸入驗證
  enhanceInputValidation() {
    console.log('[SecurityManager] 增強輸入驗證');
    
    // 設置全局輸入過濾器
    document.addEventListener('input', (event) => {
      const value = event.target.value;
      if (this.detectXSSAttempt(value)) {
        event.preventDefault();
        event.target.value = this.sanitizeInput(value);
        
        this.recordSecurityEvent('input_sanitized', {
          element: event.target.tagName,
          originalValue: '[REDACTED]',
          sanitizedValue: event.target.value
        });
      }
    });
  }

  // 檢測 XSS 嘗試
  detectXSSAttempt(input) {
    if (typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /<img[^>]+src[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  // 清理輸入
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/expression\s*\(/gi, '');
  }

  // 臨時限制
  temporaryRestriction() {
    console.warn('[SecurityManager] 應用臨時安全限制');
    
    // 降低請求限額
    this.defaultLimits.websocket_send.maxRequests = Math.floor(this.defaultLimits.websocket_send.maxRequests * 0.5);
    this.defaultLimits.api_call.maxRequests = Math.floor(this.defaultLimits.api_call.maxRequests * 0.5);
    
    // 10分鐘後恢復
    setTimeout(() => {
      this.resetRateLimits();
      console.log('[SecurityManager] 安全限制已恢復');
    }, 600000);
  }

  // 重置請求限額
  resetRateLimits() {
    this.rateLimiters.clear();
    this.initializeRateLimiters();
  }

  // 代碼安全審計
  auditCodeSecurity() {
    console.log('[SecurityManager] 執行代碼安全審計');
    
    const auditResults = {
      timestamp: Date.now(),
      checks: {
        localStorage: this.auditLocalStorage(),
        globals: this.auditGlobalVariables(),
        eventListeners: this.auditEventListeners()
      }
    };
    
    this.recordSecurityEvent('security_audit', auditResults);
    return auditResults;
  }

  // 審計 localStorage
  auditLocalStorage() {
    const items = {};
    let suspiciousItems = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      // 檢查是否包含敏感信息
      if (this.containsSensitiveData({ [key]: value })) {
        suspiciousItems++;
        items[key] = '[POTENTIAL_SENSITIVE]';
      } else {
        items[key] = value?.length || 0;
      }
    }
    
    return {
      totalItems: localStorage.length,
      suspiciousItems,
      items: Object.keys(items).slice(0, 20) // 只返回前20個項目
    };
  }

  // 審計全局變量
  auditGlobalVariables() {
    const suspiciousGlobals = [];
    const globalKeys = Object.keys(window);
    
    globalKeys.forEach(key => {
      if (key.toLowerCase().includes('eval') || 
          key.toLowerCase().includes('exec') ||
          key.toLowerCase().includes('script')) {
        suspiciousGlobals.push(key);
      }
    });
    
    return {
      totalGlobals: globalKeys.length,
      suspiciousGlobals: suspiciousGlobals.slice(0, 10)
    };
  }

  // 審計事件監聽器
  auditEventListeners() {
    // 這裡簡化實現
    return {
      documentListeners: this.countEventListeners(document),
      windowListeners: this.countEventListeners(window)
    };
  }

  // 計算事件監聽器數量
  countEventListeners(element) {
    // 簡化實現，實際中可能需要更複雜的邏輯
    const events = ['click', 'keydown', 'submit', 'load', 'error'];
    let count = 0;
    
    events.forEach(event => {
      try {
        // 這是一個近似方法
        if (element[`on${event}`]) count++;
      } catch (e) {
        // 忽略錯誤
      }
    });
    
    return count;
  }

  // 獲取會話 ID
  getSessionId() {
    try {
      const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
      return session.sessionId || null;
    } catch {
      return null;
    }
  }

  // 獲取安全統計
  getSecurityStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(event => event.timestamp > last24h);
    const eventsByType = {};
    
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });
    
    // 計算風險評分
    const riskScore = this.calculateRiskScore(eventsByType);
    
    return {
      timestamp: now,
      totalEvents: this.securityEvents.length,
      recentEvents: recentEvents.length,
      eventsByType,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      rateLimitStatus: this.getRateLimitStatus(),
      recommendations: this.getSecurityRecommendations(eventsByType)
    };
  }

  // 計算風險評分
  calculateRiskScore(eventsByType) {
    const weights = {
      'xss_attempt_detected': 50,
      'csp_violation': 30,
      'rate_limit_exceeded': 20,
      'sensitive_data_detected': 40,
      'api_error': 5
    };
    
    let score = 0;
    Object.entries(eventsByType).forEach(([type, count]) => {
      score += (weights[type] || 1) * count;
    });
    
    return Math.min(score, 100);
  }

  // 獲取風險級別
  getRiskLevel(score) {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }

  // 獲取限流狀態
  getRateLimitStatus() {
    const status = {};
    
    for (const [action, limiter] of this.rateLimiters.entries()) {
      const activeRequests = Array.from(limiter.requests.values())
        .reduce((total, requests) => total + requests.length, 0);
      
      status[action] = {
        activeRequests,
        maxRequests: limiter.maxRequests,
        utilization: Math.round((activeRequests / limiter.maxRequests) * 100)
      };
    }
    
    return status;
  }

  // 獲取安全建議
  getSecurityRecommendations(eventsByType) {
    const recommendations = [];
    
    if (eventsByType['rate_limit_exceeded'] > 5) {
      recommendations.push('考慮優化請求頻率和批量處理');
    }
    
    if (eventsByType['xss_attempt_detected'] > 0) {
      recommendations.push('加強輸入驗證和輸出編碼');
    }
    
    if (eventsByType['csp_violation'] > 3) {
      recommendations.push('檢查和修復內容安全策略違規');
    }
    
    if (eventsByType['api_error'] > 20) {
      recommendations.push('檢查 API 端點和網絡穩定性');
    }
    
    return recommendations;
  }

  // 清除安全事件記錄
  clearSecurityEvents() {
    this.securityEvents = [];
    console.log('[SecurityManager] 安全事件記錄已清除');
  }

  // 獲取最近的安全事件
  getRecentSecurityEvents(limit = 50) {
    return this.securityEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

// 創建單例實例
export const securityManager = new SecurityManager();
export default securityManager;