import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuthV2';

const SystemSettingsFullScreen = () => {
  const { user, canViewWidget } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Love To Song V2',
      siteDescription: '專業點歌管理系統',
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      maintenanceMode: false
    },
    system: {
      maxRequestsPerUser: 5,
      defaultEventDuration: 240,
      autoCleanupDays: 30,
      enableRealtimeNotifications: true,
      enableEmailNotifications: false,
      maxUploadSize: 10,
      allowGuestRequests: true
    },
    appearance: {
      theme: 'dark',
      primaryColor: '#ffd700',
      secondaryColor: '#daa520',
      logoUrl: '',
      backgroundImage: '',
      showWelcomeMessage: true,
      compactMode: false
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      requireEmailVerification: false,
      enableTwoFactor: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      }
    },
    notification: {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      notificationSound: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    }
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 設定區段配置
  const settingSections = [
    {
      id: 'general',
      name: '一般設定',
      icon: '⚙️',
      description: '基本系統設定和配置',
      permissions: ['SYSTEM_SETTINGS']
    },
    {
      id: 'system',
      name: '系統參數',
      icon: '🔧',
      description: '系統運作參數和限制',
      permissions: ['SYSTEM_SETTINGS']
    },
    {
      id: 'appearance',
      name: '外觀設定',
      icon: '🎨',
      description: '主題、顏色和界面設定',
      permissions: ['SYSTEM_SETTINGS']
    },
    {
      id: 'security',
      name: '安全設定',
      icon: '🔒',
      description: '安全策略和認證設定',
      permissions: ['SECURITY_SETTINGS']
    },
    {
      id: 'notification',
      name: '通知設定',
      icon: '🔔',
      description: '通知系統和提醒設定',
      permissions: ['NOTIFICATION_SETTINGS']
    },
    {
      id: 'backup',
      name: '備份設定',
      icon: '💾',
      description: '數據備份和恢復設定',
      permissions: ['SYSTEM_BACKUP']
    }
  ];

  // 載入設定
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 這裡應該從API載入設定
      // const response = await fetch('/api/system/settings');
      // const data = await response.json();
      // setSettings(data);
      
      // 使用現有的模擬數據
    } catch (error) {
      console.error('載入設定失敗:', error);
    }
  };

  // 保存設定
  const saveSettings = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      // 這裡應該調用API保存設定
      // await fetch('/api/system/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      // 模擬保存成功
      setTimeout(() => {
        setSaveMessage('設定已成功保存');
        setSaving(false);
        setTimeout(() => setSaveMessage(''), 3000);
      }, 1000);
    } catch (error) {
      setSaveMessage('保存設定失敗');
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // 更新設定值
  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // 更新嵌套設定值
  const updateNestedSetting = (section, parentKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...prev[section][parentKey],
          [key]: value
        }
      }
    }));
  };

  // 渲染一般設定
  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>一般設定</h3>
      
      <div className="setting-group">
        <label>網站名稱</label>
        <input
          type="text"
          value={settings.general.siteName}
          onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
          className="setting-input"
        />
      </div>

      <div className="setting-group">
        <label>網站描述</label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
          className="setting-textarea"
          rows={3}
        />
      </div>

      <div className="setting-row">
        <div className="setting-group">
          <label>時區</label>
          <select
            value={settings.general.timezone}
            onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
            className="setting-select"
          >
            <option value="Asia/Taipei">台北 (GMT+8)</option>
            <option value="Asia/Tokyo">東京 (GMT+9)</option>
            <option value="Asia/Shanghai">上海 (GMT+8)</option>
            <option value="America/New_York">紐約 (GMT-5)</option>
            <option value="Europe/London">倫敦 (GMT+0)</option>
          </select>
        </div>

        <div className="setting-group">
          <label>語言</label>
          <select
            value={settings.general.language}
            onChange={(e) => updateSetting('general', 'language', e.target.value)}
            className="setting-select"
          >
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">簡體中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.general.maintenanceMode}
            onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
          />
          <span>維護模式</span>
        </label>
        <div className="setting-description">
          啟用維護模式將暫停一般用戶訪問系統
        </div>
      </div>
    </div>
  );

  // 渲染系統參數設定
  const renderSystemSettings = () => (
    <div className="settings-section">
      <h3>系統參數</h3>
      
      <div className="setting-row">
        <div className="setting-group">
          <label>每位用戶最大點歌數量</label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.system.maxRequestsPerUser}
            onChange={(e) => updateSetting('system', 'maxRequestsPerUser', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>

        <div className="setting-group">
          <label>預設活動時長（分鐘）</label>
          <input
            type="number"
            min="60"
            max="720"
            value={settings.system.defaultEventDuration}
            onChange={(e) => updateSetting('system', 'defaultEventDuration', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-group">
          <label>自動清理過期數據（天）</label>
          <input
            type="number"
            min="7"
            max="365"
            value={settings.system.autoCleanupDays}
            onChange={(e) => updateSetting('system', 'autoCleanupDays', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>

        <div className="setting-group">
          <label>最大上傳文件大小（MB）</label>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.system.maxUploadSize}
            onChange={(e) => updateSetting('system', 'maxUploadSize', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.system.enableRealtimeNotifications}
            onChange={(e) => updateSetting('system', 'enableRealtimeNotifications', e.target.checked)}
          />
          <span>啟用即時通知</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.system.allowGuestRequests}
            onChange={(e) => updateSetting('system', 'allowGuestRequests', e.target.checked)}
          />
          <span>允許訪客點歌</span>
        </label>
      </div>
    </div>
  );

  // 渲染外觀設定
  const renderAppearanceSettings = () => (
    <div className="settings-section">
      <h3>外觀設定</h3>
      
      <div className="setting-row">
        <div className="setting-group">
          <label>主題</label>
          <select
            value={settings.appearance.theme}
            onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
            className="setting-select"
          >
            <option value="dark">深色主題</option>
            <option value="light">淺色主題</option>
            <option value="auto">自動</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.appearance.compactMode}
              onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
            />
            <span>緊湊模式</span>
          </label>
        </div>
      </div>

      <div className="color-settings">
        <div className="setting-group">
          <label>主要色彩</label>
          <div className="color-input-group">
            <input
              type="color"
              value={settings.appearance.primaryColor}
              onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={settings.appearance.primaryColor}
              onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
              className="color-text-input"
            />
          </div>
        </div>

        <div className="setting-group">
          <label>次要色彩</label>
          <div className="color-input-group">
            <input
              type="color"
              value={settings.appearance.secondaryColor}
              onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={settings.appearance.secondaryColor}
              onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
              className="color-text-input"
            />
          </div>
        </div>
      </div>

      <div className="setting-group">
        <label>Logo URL</label>
        <input
          type="url"
          value={settings.appearance.logoUrl}
          onChange={(e) => updateSetting('appearance', 'logoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
          className="setting-input"
        />
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.appearance.showWelcomeMessage}
            onChange={(e) => updateSetting('appearance', 'showWelcomeMessage', e.target.checked)}
          />
          <span>顯示歡迎訊息</span>
        </label>
      </div>
    </div>
  );

  // 渲染安全設定
  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>安全設定</h3>
      
      <div className="setting-row">
        <div className="setting-group">
          <label>登入有效期（小時）</label>
          <input
            type="number"
            min="1"
            max="168"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>

        <div className="setting-group">
          <label>最大登入嘗試次數</label>
          <input
            type="number"
            min="3"
            max="10"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.security.requireEmailVerification}
            onChange={(e) => updateSetting('security', 'requireEmailVerification', e.target.checked)}
          />
          <span>要求電子郵件驗證</span>
        </label>
      </div>

      <div className="password-policy">
        <h4>密碼政策</h4>
        
        <div className="setting-group">
          <label>最小長度</label>
          <input
            type="number"
            min="6"
            max="20"
            value={settings.security.passwordPolicy.minLength}
            onChange={(e) => updateNestedSetting('security', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
            className="setting-input"
          />
        </div>

        <div className="policy-checkboxes">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireUppercase}
              onChange={(e) => updateNestedSetting('security', 'passwordPolicy', 'requireUppercase', e.target.checked)}
            />
            <span>要求大寫字母</span>
          </label>

          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireNumbers}
              onChange={(e) => updateNestedSetting('security', 'passwordPolicy', 'requireNumbers', e.target.checked)}
            />
            <span>要求數字</span>
          </label>

          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.security.passwordPolicy.requireSpecialChars}
              onChange={(e) => updateNestedSetting('security', 'passwordPolicy', 'requireSpecialChars', e.target.checked)}
            />
            <span>要求特殊符號</span>
          </label>
        </div>
      </div>
    </div>
  );

  // 渲染通知設定
  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>通知設定</h3>
      
      <div className="notification-types">
        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.notification.enablePushNotifications}
              onChange={(e) => updateSetting('notification', 'enablePushNotifications', e.target.checked)}
            />
            <span>推送通知</span>
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.notification.enableEmailNotifications}
              onChange={(e) => updateSetting('notification', 'enableEmailNotifications', e.target.checked)}
            />
            <span>電子郵件通知</span>
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.notification.notificationSound}
              onChange={(e) => updateSetting('notification', 'notificationSound', e.target.checked)}
            />
            <span>通知音效</span>
          </label>
        </div>
      </div>

      <div className="quiet-hours">
        <h4>免打擾時段</h4>
        
        <div className="setting-group">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.notification.quietHours.enabled}
              onChange={(e) => updateNestedSetting('notification', 'quietHours', 'enabled', e.target.checked)}
            />
            <span>啟用免打擾時段</span>
          </label>
        </div>

        {settings.notification.quietHours.enabled && (
          <div className="setting-row">
            <div className="setting-group">
              <label>開始時間</label>
              <input
                type="time"
                value={settings.notification.quietHours.startTime}
                onChange={(e) => updateNestedSetting('notification', 'quietHours', 'startTime', e.target.value)}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label>結束時間</label>
              <input
                type="time"
                value={settings.notification.quietHours.endTime}
                onChange={(e) => updateNestedSetting('notification', 'quietHours', 'endTime', e.target.value)}
                className="setting-input"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染備份設定
  const renderBackupSettings = () => (
    <div className="settings-section">
      <h3>備份設定</h3>
      
      <div className="backup-info">
        <div className="info-card">
          <div className="info-icon">💾</div>
          <div className="info-content">
            <h4>自動備份</h4>
            <p>系統會自動備份重要數據，包括用戶資料、活動記錄和設定</p>
          </div>
        </div>
      </div>

      <div className="backup-actions">
        <button className="backup-btn primary">
          🔄 立即備份
        </button>
        <button className="backup-btn secondary">
          📥 下載備份
        </button>
        <button className="backup-btn danger">
          📤 恢復備份
        </button>
      </div>

      <div className="backup-history">
        <h4>備份歷史</h4>
        <div className="backup-list">
          <div className="backup-item">
            <div className="backup-info">
              <div className="backup-date">2024-01-15 02:00</div>
              <div className="backup-size">125 MB</div>
            </div>
            <div className="backup-actions-small">
              <button className="backup-action-btn">📥</button>
              <button className="backup-action-btn">🗑️</button>
            </div>
          </div>
          <div className="backup-item">
            <div className="backup-info">
              <div className="backup-date">2024-01-14 02:00</div>
              <div className="backup-size">123 MB</div>
            </div>
            <div className="backup-actions-small">
              <button className="backup-action-btn">📥</button>
              <button className="backup-action-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染設定內容
  const renderSettingContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'system':
        return renderSystemSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notification':
        return renderNotificationSettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="system-settings-fullscreen">
      <div className="settings-sidebar">
        <div className="sidebar-header">
          <h3>⚙️ 系統設定</h3>
          <p>配置和管理系統</p>
        </div>

        <div className="settings-menu">
          {settingSections.map(section => {
            const hasPermission = section.permissions.some(permission => 
              canViewWidget(permission) || user?.roles?.includes('SUPER_ADMIN')
            );

            if (!hasPermission) return null;

            return (
              <button
                key={section.id}
                className={`menu-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="menu-icon">{section.icon}</div>
                <div className="menu-info">
                  <div className="menu-name">{section.name}</div>
                  <div className="menu-desc">{section.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-main">
        <div className="settings-header">
          <div className="header-info">
            <h2>
              {settingSections.find(s => s.id === activeSection)?.name}
            </h2>
            <p>
              {settingSections.find(s => s.id === activeSection)?.description}
            </p>
          </div>

          <div className="header-actions">
            <button
              className="save-btn"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? '⏳ 保存中...' : '💾 保存設定'}
            </button>
          </div>
        </div>

        <div className="settings-content">
          {renderSettingContent()}
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('失敗') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .system-settings-fullscreen {
          height: 100%;
          display: flex;
          background: transparent;
          color: #ffffff;
        }

        .settings-sidebar {
          width: 320px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-right: 2px solid #daa520;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 24px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .sidebar-header h3 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 700;
        }

        .sidebar-header p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .settings-menu {
          padding: 16px;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 12px;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(218, 165, 32, 0.3);
        }

        .menu-item.active {
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.15), rgba(255, 215, 0, 0.15));
          border-color: #daa520;
          color: #ffd700;
        }

        .menu-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .menu-info {
          flex: 1;
        }

        .menu-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .menu-desc {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.3;
        }

        .settings-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .header-info p {
          margin: 0;
          color: #d4af37;
          font-size: 14px;
        }

        .save-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .save-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
          transform: translateY(-1px);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .settings-section {
          max-width: 800px;
        }

        .settings-section h3 {
          margin: 0 0 24px 0;
          color: #ffd700;
          font-size: 20px;
          font-weight: 600;
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
          padding-bottom: 8px;
        }

        .setting-group {
          margin-bottom: 24px;
        }

        .setting-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .setting-group label {
          display: block;
          margin-bottom: 8px;
          color: #ffd700;
          font-weight: 600;
          font-size: 14px;
        }

        .setting-input,
        .setting-select,
        .setting-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .setting-input:focus,
        .setting-select:focus,
        .setting-textarea:focus {
          outline: none;
          border-color: #daa520;
          box-shadow: 0 0 0 3px rgba(218, 165, 32, 0.2);
        }

        .setting-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: normal !important;
        }

        .setting-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #daa520;
        }

        .setting-description {
          font-size: 13px;
          color: #cccccc;
          margin-top: 6px;
          line-height: 1.4;
        }

        .color-settings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 24px 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .color-input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .color-input {
          width: 50px;
          height: 40px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
          cursor: pointer;
        }

        .color-text-input {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-family: monospace;
        }

        .password-policy {
          margin-top: 32px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .password-policy h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .policy-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .notification-types {
          margin-bottom: 32px;
        }

        .quiet-hours {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .quiet-hours h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .backup-info {
          margin-bottom: 32px;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
        }

        .info-icon {
          font-size: 32px;
        }

        .info-content h4 {
          margin: 0 0 8px 0;
          color: #ffd700;
        }

        .info-content p {
          margin: 0;
          color: #cccccc;
          line-height: 1.4;
        }

        .backup-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .backup-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .backup-btn.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .backup-btn.secondary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .backup-btn.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .backup-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .backup-history h4 {
          margin: 0 0 16px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .backup-list {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .backup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(218, 165, 32, 0.1);
        }

        .backup-item:last-child {
          border-bottom: none;
        }

        .backup-date {
          color: #ffffff;
          font-weight: 600;
        }

        .backup-size {
          color: #cccccc;
          font-size: 14px;
        }

        .backup-actions-small {
          display: flex;
          gap: 8px;
        }

        .backup-action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 6px 8px;
          color: #cccccc;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .backup-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .save-message {
          position: absolute;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          animation: slideIn 0.3s ease;
        }

        .save-message.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .save-message.error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .system-settings-fullscreen {
            flex-direction: column;
          }

          .settings-sidebar {
            width: 100%;
            height: auto;
            max-height: 200px;
          }

          .setting-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .color-settings {
            grid-template-columns: 1fr;
          }

          .policy-checkboxes {
            grid-template-columns: 1fr;
          }

          .backup-actions {
            flex-direction: column;
          }

          .settings-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemSettingsFullScreen;