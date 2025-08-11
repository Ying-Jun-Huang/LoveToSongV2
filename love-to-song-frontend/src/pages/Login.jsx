// file: love-to-song-frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthV2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // 如果已經登入，直接跳轉到 dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || '登入失敗，請檢查帳號密碼');
      }
    } catch (err) {
      setError('登入過程發生錯誤，請稍後再試');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>點歌與歌手管理系統</h2>
            <p>請登入以使用系統</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={loading}
                placeholder="請輸入您的 email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading}
                placeholder="請輸入密碼"
              />
            </div>
            
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
          
          <div className="guest-access">
            <div className="divider">
              <span>或</span>
            </div>
            <button 
              type="button"
              className="guest-btn"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              👤 以訪客身分進入
            </button>
          </div>
          
          <div className="test-accounts">
            <h4>測試帳號 (密碼都是: 123456)</h4>
            <div className="test-account-list">
              <div>• super@test.com (高層管理員)</div>
              <div>• host@test.com (主持管理)</div>
              <div>• singer@test.com (歌手)</div>
              <div>• player@test.com (玩家)</div>
              <div>• guest@test.com (訪客)</div>
            </div>
            <div className="hint">
              💡 提示：也可以直接點擊上方「以訪客身分進入」體驗系統
            </div>
          </div>
        </div>
      </div>
      
      <style jsx="true">{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .login-container {
          width: 100%;
          max-width: 400px;
        }
        
        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .login-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .login-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .login-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
        
        .login-form {
          padding: 30px 20px 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-group input:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .error-icon {
          flex-shrink: 0;
        }
        
        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .guest-access {
          padding: 20px 20px 10px;
          text-align: center;
        }

        .divider {
          position: relative;
          margin-bottom: 20px;
          color: #9ca3af;
          font-size: 14px;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: #e5e7eb;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .divider span {
          background: white;
          padding: 0 15px;
        }

        .guest-btn {
          width: 100%;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }

        .guest-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
        }

        .guest-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
        }
        
        .test-accounts {
          padding: 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .test-accounts h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }
        
        .test-account-list {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .test-account-list div {
          margin: 4px 0;
        }

        .hint {
          margin-top: 15px;
          padding: 10px 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          color: #0369a1;
          font-size: 12px;
          text-align: center;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default Login;
