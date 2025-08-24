// 音效通知服務
class AudioNotificationService {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.5; // 默認音量 50%
    this.cache = new Map(); // 音效緩存
    
    // 初始化音頻上下文
    this.initializeAudioContext();
  }

  // 初始化音頻上下文
  initializeAudioContext() {
    try {
      // 創建音頻上下文（支持 Safari 和其他瀏覽器）
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        console.log('[AudioNotifications] 音頻上下文初始化成功');
      } else {
        console.warn('[AudioNotifications] 瀏覽器不支持 Web Audio API');
      }
    } catch (error) {
      console.error('[AudioNotifications] 音頻上下文初始化失敗:', error);
    }
  }

  // 生成不同頻率的音效
  generateTone(frequency, duration, type = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      // 恢復音頻上下文（部分瀏覽器需要用戶交互後才能播放）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // 連接音頻節點
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 設置音效屬性
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // 設置音量淡入淡出效果
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      // 播放音效
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
    } catch (error) {
      console.error('[AudioNotifications] 音效生成失敗:', error);
    }
  }

  // 生成和弦音效
  generateChord(frequencies, duration) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.generateTone(freq, duration * 0.8, 'sine');
      }, index * 50); // 稍微錯開播放時間創造和聲效果
    });
  }

  // 預定義音效類型
  playNotificationSound(type) {
    if (!this.isEnabled) return;

    const sounds = {
      // 成功音效 - 明亮的上升音階
      'success': () => {
        this.generateChord([523.25, 659.25, 783.99], 0.4); // C5, E5, G5
      },
      
      // 錯誤音效 - 低沉的下降音
      'error': () => {
        this.generateTone(220, 0.15, 'sawtooth');
        setTimeout(() => this.generateTone(196, 0.2, 'sawtooth'), 150);
      },
      
      // 警告音效 - 重複的中頻音
      'warning': () => {
        this.generateTone(440, 0.1, 'triangle');
        setTimeout(() => this.generateTone(440, 0.1, 'triangle'), 200);
      },
      
      // 信息音效 - 輕快的單音
      'info': () => {
        this.generateTone(800, 0.2, 'sine');
      },
      
      // 新點歌音效 - 歡快的三音符
      'new_request': () => {
        this.generateTone(523.25, 0.15); // C5
        setTimeout(() => this.generateTone(659.25, 0.15), 100); // E5
        setTimeout(() => this.generateTone(783.99, 0.2), 200); // G5
      },
      
      // 連接音效 - 上升音
      'connected': () => {
        this.generateTone(440, 0.1);
        setTimeout(() => this.generateTone(523.25, 0.15), 100);
      },
      
      // 斷線音效 - 下降音
      'disconnected': () => {
        this.generateTone(523.25, 0.1);
        setTimeout(() => this.generateTone(440, 0.15), 100);
      },
      
      // 活動開始音效 - 華麗的和弦
      'event_start': () => {
        this.generateChord([261.63, 329.63, 392.00, 523.25], 0.6); // C4, E4, G4, C5
      },
      
      // 隊列更新音效 - 短促的提示音
      'queue_update': () => {
        this.generateTone(1000, 0.08, 'sine');
      },
      
      // 心跳音效 - 模擬心跳聲
      'heartbeat': () => {
        this.generateTone(60, 0.05, 'sine');
        setTimeout(() => this.generateTone(80, 0.05, 'sine'), 100);
      }
    };

    const soundFunction = sounds[type];
    if (soundFunction) {
      try {
        soundFunction();
        console.log(`[AudioNotifications] 播放音效: ${type}`);
      } catch (error) {
        console.error(`[AudioNotifications] 播放音效失敗 (${type}):`, error);
      }
    } else {
      console.warn(`[AudioNotifications] 未知音效類型: ${type}`);
    }
  }

  // 設置音量 (0.0 - 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`[AudioNotifications] 音量設置為: ${(this.volume * 100).toFixed(0)}%`);
  }

  // 啟用/禁用音效
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`[AudioNotifications] 音效 ${enabled ? '啟用' : '禁用'}`);
    
    // 保存設置到本地存儲
    localStorage.setItem('audioNotificationsEnabled', enabled.toString());
  }

  // 從本地存儲加載設置
  loadSettings() {
    try {
      const savedEnabled = localStorage.getItem('audioNotificationsEnabled');
      if (savedEnabled !== null) {
        this.isEnabled = savedEnabled === 'true';
      }
      
      const savedVolume = localStorage.getItem('audioNotificationsVolume');
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume) || 0.5;
      }
      
      console.log(`[AudioNotifications] 載入設置 - 啟用: ${this.isEnabled}, 音量: ${(this.volume * 100).toFixed(0)}%`);
    } catch (error) {
      console.error('[AudioNotifications] 載入設置失敗:', error);
    }
  }

  // 保存設置到本地存儲
  saveSettings() {
    try {
      localStorage.setItem('audioNotificationsEnabled', this.isEnabled.toString());
      localStorage.setItem('audioNotificationsVolume', this.volume.toString());
      console.log('[AudioNotifications] 設置已保存');
    } catch (error) {
      console.error('[AudioNotifications] 保存設置失敗:', error);
    }
  }

  // 測試音效
  testSound() {
    if (!this.audioContext) {
      console.warn('[AudioNotifications] 音頻上下文未初始化');
      return;
    }
    
    this.playNotificationSound('info');
  }

  // 獲取當前設置
  getSettings() {
    return {
      isEnabled: this.isEnabled,
      volume: this.volume,
      audioContextState: this.audioContext?.state || 'unavailable'
    };
  }

  // 銷毀音頻上下文
  destroy() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      console.log('[AudioNotifications] 音頻上下文已關閉');
    }
  }
}

// 創建單例實例
const audioNotificationService = new AudioNotificationService();

// 頁面載入時載入設置
document.addEventListener('DOMContentLoaded', () => {
  audioNotificationService.loadSettings();
});

// 頁面卸載時保存設置
window.addEventListener('beforeunload', () => {
  audioNotificationService.saveSettings();
});

export default audioNotificationService;