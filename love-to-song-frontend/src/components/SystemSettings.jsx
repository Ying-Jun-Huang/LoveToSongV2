import React, { useState, useEffect } from 'react';
import { serviceIntegrator } from '../services/serviceIntegrator';
import { sessionManager } from '../services/sessionManager';
import { performanceMonitor } from '../services/performanceMonitor-simple';
import { securityManager } from '../services/securityManager';
import { audioNotificationService } from '../services/audioNotifications';

const SystemSettings = ({ isVisible, onClose }) => {
  const [settings, setSettings] = useState({
    session: {
      sessionTimeout: 30,
      crossDeviceSync: false,
      autoReconnect: true
    },
    performance: {
      monitoringEnabled: true,
      reportInterval: 60,
      performanceMode: 'auto',
      animationsEnabled: true
    },
    security: {
      securityLevel: 'medium',
      rateLimitEnabled: true,
      xssProtection: true,
      auditLogging: true
    },
    audio: {
      enabled: true,
      volume: 0.5,
      connectionSounds: true,
      notificationSounds: true
    },
    ui: {
      theme: 'dark',
      language: 'zh-TW',
      reducedMotion: false,
      highContrast: false
    }
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // 加載設置
  useEffect(() => {
    if (isVisible) {
      loadCurrentSettings();
    }
  }, [isVisible]);

  const loadCurrentSettings = () => {
    try {
      // 從各服務獲取當前配置
      const serviceConfigs = serviceIntegrator.getServiceConfigurations();
      
      setSettings(prev => ({
        ...prev,
        session: {
          sessionTimeout: serviceConfigs.session?.sessionTimeout / 60000 || 30, // 轉換為分鐘
          crossDeviceSync: serviceConfigs.session?.crossDeviceSync || false,
          autoReconnect: true
        },
        performance: {
          monitoringEnabled: serviceConfigs.performance?.isMonitoring || true,
          reportInterval: serviceConfigs.performance?.reportInterval / 1000 || 60, // 轉換為秒
          performanceMode: 'auto',
          animationsEnabled: !document.body.classList.contains('reduced-motion')
        },
        security: {
          securityLevel: serviceConfigs.security?.riskLevel === 'low' ? 'high' : 'medium',
          rateLimitEnabled: Object.keys(serviceConfigs.security?.rateLimitStatus || {}).length > 0,
          xssProtection: true,
          auditLogging: true
        },
        audio: {
          enabled: serviceConfigs.audio?.enabled || true,
          volume: serviceConfigs.audio?.volume || 0.5,
          connectionSounds: true,
          notificationSounds: true
        }
      }));

    } catch (error) {
      console.error('[SystemSettings] 加載設置失敗:', error);
    }
  };

  // 處理設置變更
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  // 保存設置
  const saveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // 準備服務配置
      const serviceConfigs = {
        session: {
          sessionTimeout: settings.session.sessionTimeout * 60000, // 轉換為毫秒
          crossDeviceSync: settings.session.crossDeviceSync
        },
        performance: {
          reportInterval: settings.performance.reportInterval * 1000, // 轉換為毫秒
          thresholds: {
            pageLoadTime: settings.performance.performanceMode === 'high' ? 2000 : 3000,
            memoryUsage: settings.performance.performanceMode === 'high' ? 80 * 1024 * 1024 : 100 * 1024 * 1024
          }
        },
        audio: {
          enabled: settings.audio.enabled,
          volume: settings.audio.volume
        }
      };

      // 更新服務配置
      await serviceIntegrator.updateServiceConfigurations(serviceConfigs);

      // 應用 UI 設置
      applyUISettings();

      // 應用離線設置

      // 保存到本地存儲
      localStorage.setItem('systemSettings', JSON.stringify(settings));

      setIsDirty(false);
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus(''), 2000);

      console.log('[SystemSettings] 設置已保存');

    } catch (error) {
      console.error('[SystemSettings] 保存設置失敗:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 應用 UI 設置
  const applyUISettings = () => {
    const body = document.body;

    // 主題設置
    body.className = body.className.replace(/theme-\w+/g, '');
    body.classList.add(`theme-${settings.ui.theme}`);

    // 減少動畫設置
    if (settings.ui.reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }

    // 高對比度設置
    if (settings.ui.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // 語言設置
    document.documentElement.lang = settings.ui.language;
  };


  // 重置設置
  const resetSettings = () => {
    const defaultSettings = {
      session: {
        sessionTimeout: 30,
        crossDeviceSync: false,
        autoReconnect: true
      },
      performance: {
        monitoringEnabled: true,
        reportInterval: 60,
        performanceMode: 'auto',
        animationsEnabled: true
      },
      security: {
        securityLevel: 'medium',
        rateLimitEnabled: true,
        xssProtection: true,
        auditLogging: true
      },
      audio: {
        enabled: true,
        volume: 0.5,
        connectionSounds: true,
        notificationSounds: true
      },
      ui: {
        theme: 'dark',
        language: 'zh-TW',
        reducedMotion: false,
        highContrast: false
      }
    };

    setSettings(defaultSettings);
    setIsDirty(true);
  };

  // 執行系統診斷
  const runSystemDiagnostic = async () => {
    setSaveStatus('diagnosing');
    
    try {
      const diagnostic = await serviceIntegrator.performSystemDiagnostic();
      console.log('[SystemSettings] 系統診斷完成:', diagnostic);
      
      setSaveStatus('diagnostic_complete');
      setTimeout(() => setSaveStatus(''), 3000);
      
      // 可以在這裡顯示診斷結果
      
    } catch (error) {
      console.error('[SystemSettings] 系統診斷失敗:', error);
      setSaveStatus('diagnostic_error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="system-settings-overlay">
      <div className="system-settings">
        <div className="settings-header">
          <h2>系統設置</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="settings-content">
          {/* 會話設置 */}
          <div className="settings-section">
            <h3>會話管理</h3>
            <div className="setting-item">
              <label>會話超時 (分鐘)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={settings.session.sessionTimeout}
                onChange={(e) => handleSettingChange('session', 'sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>跨設備同步</label>
              <input
                type="checkbox"
                checked={settings.session.crossDeviceSync}
                onChange={(e) => handleSettingChange('session', 'crossDeviceSync', e.target.checked)}
              />
            </div>
          </div>

          {/* 性能設置 */}
          <div className="settings-section">
            <h3>性能監控</h3>
            <div className="setting-item">
              <label>啟用性能監控</label>
              <input
                type="checkbox"
                checked={settings.performance.monitoringEnabled}
                onChange={(e) => handleSettingChange('performance', 'monitoringEnabled', e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>報告間隔 (秒)</label>
              <input
                type="number"
                min="30"
                max="300"
                value={settings.performance.reportInterval}
                onChange={(e) => handleSettingChange('performance', 'reportInterval', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>性能模式</label>
              <select
                value={settings.performance.performanceMode}
                onChange={(e) => handleSettingChange('performance', 'performanceMode', e.target.value)}
              >
                <option value="auto">自動</option>
                <option value="high">高性能</option>
                <option value="balanced">平衡</option>
                <option value="battery-saver">省電</option>
              </select>
            </div>
          </div>

          {/* 安全設置 */}
          <div className="settings-section">
            <h3>安全管理</h3>
            <div className="setting-item">
              <label>安全級別</label>
              <select
                value={settings.security.securityLevel}
                onChange={(e) => handleSettingChange('security', 'securityLevel', e.target.value)}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div className="setting-item">
              <label>請求限流</label>
              <input
                type="checkbox"
                checked={settings.security.rateLimitEnabled}
                onChange={(e) => handleSettingChange('security', 'rateLimitEnabled', e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>XSS 防護</label>
              <input
                type="checkbox"
                checked={settings.security.xssProtection}
                onChange={(e) => handleSettingChange('security', 'xssProtection', e.target.checked)}
              />
            </div>
          </div>

          {/* 音頻設置 */}
          <div className="settings-section">
            <h3>音頻通知</h3>
            <div className="setting-item">
              <label>啟用音頻</label>
              <input
                type="checkbox"
                checked={settings.audio.enabled}
                onChange={(e) => handleSettingChange('audio', 'enabled', e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>音量</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.audio.volume}
                onChange={(e) => handleSettingChange('audio', 'volume', parseFloat(e.target.value))}
                disabled={!settings.audio.enabled}
              />
              <span className="volume-display">{Math.round(settings.audio.volume * 100)}%</span>
            </div>
            <div className="setting-item">
              <label>連接音效</label>
              <input
                type="checkbox"
                checked={settings.audio.connectionSounds}
                onChange={(e) => handleSettingChange('audio', 'connectionSounds', e.target.checked)}
                disabled={!settings.audio.enabled}
              />
            </div>
          </div>


          {/* UI 設置 */}
          <div className="settings-section">
            <h3>界面設置</h3>
            <div className="setting-item">
              <label>主題</label>
              <select
                value={settings.ui.theme}
                onChange={(e) => handleSettingChange('ui', 'theme', e.target.value)}
              >
                <option value="light">淺色</option>
                <option value="dark">深色</option>
                <option value="auto">跟隨系統</option>
              </select>
            </div>
            <div className="setting-item">
              <label>語言</label>
              <select
                value={settings.ui.language}
                onChange={(e) => handleSettingChange('ui', 'language', e.target.value)}
              >
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">簡體中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className="setting-item">
              <label>減少動畫</label>
              <input
                type="checkbox"
                checked={settings.ui.reducedMotion}
                onChange={(e) => handleSettingChange('ui', 'reducedMotion', e.target.checked)}
              />
            </div>
            <div className="setting-item">
              <label>高對比度</label>
              <input
                type="checkbox"
                checked={settings.ui.highContrast}
                onChange={(e) => handleSettingChange('ui', 'highContrast', e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <div className="footer-actions">
            <button onClick={resetSettings} className="reset-button">
              重置為默認
            </button>
            <button onClick={runSystemDiagnostic} className="diagnostic-button">
              系統診斷
            </button>
            <button 
              onClick={saveSettings} 
              className="save-button"
              disabled={!isDirty || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? '保存中...' : 
               saveStatus === 'saved' ? '已保存 ✓' :
               saveStatus === 'error' ? '保存失敗 ✗' :
               saveStatus === 'diagnosing' ? '診斷中...' :
               saveStatus === 'diagnostic_complete' ? '診斷完成 ✓' :
               saveStatus === 'diagnostic_error' ? '診斷失敗 ✗' :
               '保存設置'}
            </button>
          </div>
          
          {isDirty && (
            <div className="unsaved-warning">
              ⚠️ 您有未保存的更改
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .system-settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }

        .system-settings {
          background: #1e1e1e;
          border-radius: 12px;
          width: 90vw;
          max-width: 800px;
          height: 80vh;
          max-height: 700px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .settings-header h2 {
          color: #ffffff;
          margin: 0;
          font-size: 20px;
        }

        .close-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .settings-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .settings-section {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #333;
        }

        .settings-section h3 {
          color: #ffffff;
          margin: 0 0 20px 0;
          font-size: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #333;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-item label {
          color: #cccccc;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }

        .setting-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .setting-item input[type="number"],
        .setting-item input[type="range"],
        .setting-item select {
          background: #333;
          border: 1px solid #555;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          min-width: 120px;
        }

        .setting-item input[type="range"] {
          min-width: 100px;
          margin-right: 10px;
        }

        .volume-display {
          color: #cccccc;
          font-size: 12px;
          min-width: 35px;
        }

        .setting-item input:disabled,
        .setting-item select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-footer {
          padding: 20px;
          border-top: 1px solid #333;
          background: #2a2a2a;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-bottom: 10px;
        }

        .footer-actions button {
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .reset-button {
          background: #666;
          color: white;
        }

        .reset-button:hover {
          background: #777;
        }

        .diagnostic-button {
          background: #2196f3;
          color: white;
        }

        .diagnostic-button:hover {
          background: #1976d2;
        }

        .save-button {
          background: #4caf50;
          color: white;
          min-width: 120px;
        }

        .save-button:hover:not(:disabled) {
          background: #45a049;
        }

        .save-button:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .unsaved-warning {
          color: #ff9800;
          font-size: 12px;
          text-align: center;
          margin-top: 10px;
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .system-settings {
            width: 95vw;
            height: 90vh;
          }

          .settings-content {
            padding: 15px;
          }

          .settings-section {
            padding: 15px;
          }

          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .setting-item label {
            margin-bottom: 5px;
          }

          .setting-item input,
          .setting-item select {
            width: 100%;
            min-width: unset;
          }

          .footer-actions {
            flex-direction: column;
          }

          .footer-actions button {
            width: 100%;
          }
        }

        /* 高對比度模式 */
        @media (prefers-contrast: high) {
          .system-settings {
            background: #000000;
            border: 2px solid #ffffff;
          }

          .settings-section {
            background: #111111;
            border: 1px solid #ffffff;
          }

          .setting-item input,
          .setting-item select {
            background: #000000;
            border: 2px solid #ffffff;
          }
        }

        /* 減少動畫模式 */
        @media (prefers-reduced-motion: reduce) {
          .system-settings,
          .footer-actions button,
          .close-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemSettings;