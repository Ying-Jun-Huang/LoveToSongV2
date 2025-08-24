import React, { useState, useEffect } from 'react';
import audioNotificationService from '../services/audioNotifications';

const AudioNotificationSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    isEnabled: true,
    volume: 0.5,
    audioContextState: 'suspended'
  });

  // 載入當前設置
  useEffect(() => {
    if (isOpen) {
      const currentSettings = audioNotificationService.getSettings();
      setSettings(currentSettings);
    }
  }, [isOpen]);

  // 切換音效啟用狀態
  const toggleEnabled = () => {
    const newEnabled = !settings.isEnabled;
    audioNotificationService.setEnabled(newEnabled);
    setSettings(prev => ({ ...prev, isEnabled: newEnabled }));
  };

  // 調整音量
  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    audioNotificationService.setVolume(newVolume);
    setSettings(prev => ({ ...prev, volume: newVolume }));
  };

  // 測試音效
  const testSound = (type) => {
    audioNotificationService.playNotificationSound(type);
  };

  // 保存設置
  const saveSettings = () => {
    audioNotificationService.saveSettings();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="audio-settings-overlay">
      <div className="audio-settings-modal">
        <div className="settings-header">
          <h3>🔊 音效設置</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          {/* 啟用/禁用開關 */}
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={toggleEnabled}
                className="setting-checkbox"
              />
              <span className="checkbox-label">啟用音效通知</span>
            </label>
          </div>

          {/* 音量控制 */}
          <div className="setting-item">
            <label className="setting-label">音量</label>
            <div className="volume-control">
              <span className="volume-icon">🔉</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={handleVolumeChange}
                disabled={!settings.isEnabled}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(settings.volume * 100)}%</span>
            </div>
          </div>

          {/* 音效測試 */}
          <div className="setting-item">
            <label className="setting-label">音效測試</label>
            <div className="test-buttons">
              <button 
                onClick={() => testSound('success')} 
                disabled={!settings.isEnabled}
                className="test-button success"
              >
                ✅ 成功
              </button>
              <button 
                onClick={() => testSound('error')} 
                disabled={!settings.isEnabled}
                className="test-button error"
              >
                ❌ 錯誤
              </button>
              <button 
                onClick={() => testSound('warning')} 
                disabled={!settings.isEnabled}
                className="test-button warning"
              >
                ⚠️ 警告
              </button>
              <button 
                onClick={() => testSound('info')} 
                disabled={!settings.isEnabled}
                className="test-button info"
              >
                ℹ️ 信息
              </button>
              <button 
                onClick={() => testSound('new_request')} 
                disabled={!settings.isEnabled}
                className="test-button new-request"
              >
                🎤 新點歌
              </button>
              <button 
                onClick={() => testSound('event_start')} 
                disabled={!settings.isEnabled}
                className="test-button event-start"
              >
                🎪 活動開始
              </button>
            </div>
          </div>

          {/* 狀態信息 */}
          <div className="setting-item">
            <label className="setting-label">狀態信息</label>
            <div className="status-info">
              <div className="status-item">
                <span className="status-label">音頻上下文:</span>
                <span className={`status-value ${settings.audioContextState}`}>
                  {settings.audioContextState === 'running' ? '🟢 運行中' : 
                   settings.audioContextState === 'suspended' ? '🟡 暫停' : 
                   '🔴 不可用'}
                </span>
              </div>
              {settings.audioContextState === 'suspended' && (
                <div className="status-note">
                  ℹ️ 點擊任意測試按鈕激活音頻
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={saveSettings} className="save-button">
            保存設置
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .audio-settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          backdrop-filter: blur(5px);
        }

        .audio-settings-modal {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          border: 1px solid #ffd700;
          box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          color: #ffffff;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .settings-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #ffd700;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #cccccc;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .settings-content {
          padding: 24px;
          overflow-y: auto;
          max-height: 400px;
        }

        .setting-item {
          margin-bottom: 24px;
        }

        .setting-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #ffd700;
          margin-bottom: 8px;
        }

        .checkbox-label {
          margin-left: 8px;
          color: #ffffff;
        }

        .setting-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #ffd700;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .volume-icon {
          font-size: 18px;
        }

        .volume-slider {
          flex: 1;
          height: 6px;
          background: #333333;
          border-radius: 3px;
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #ffd700;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .volume-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #ffd700;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .volume-slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .volume-value {
          min-width: 40px;
          text-align: right;
          font-weight: 500;
          color: #ffd700;
        }

        .test-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .test-button {
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .test-button:enabled:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .test-button.success:enabled:hover { border-color: #4caf50; }
        .test-button.error:enabled:hover { border-color: #f44336; }
        .test-button.warning:enabled:hover { border-color: #ff9800; }
        .test-button.info:enabled:hover { border-color: #2196f3; }
        .test-button.new-request:enabled:hover { border-color: #9c27b0; }
        .test-button.event-start:enabled:hover { border-color: #ffd700; }

        .status-info {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .status-item:last-child {
          margin-bottom: 0;
        }

        .status-label {
          font-size: 12px;
          color: #cccccc;
        }

        .status-value {
          font-size: 12px;
          font-weight: 500;
        }

        .status-note {
          font-size: 11px;
          color: #ffd700;
          text-align: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 215, 0, 0.2);
        }

        .settings-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 215, 0, 0.3);
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .save-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #ffd700 0%, #daa520 100%);
          color: #000000;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-button:hover {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .audio-settings-modal {
            width: 95%;
            margin: 10px;
          }

          .settings-header {
            padding: 16px 20px;
          }

          .settings-content {
            padding: 20px;
          }

          .test-buttons {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 6px;
          }

          .test-button {
            padding: 6px 8px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioNotificationSettings;