import React from 'react';
import HomepageWidget from '../components/HomepageWidget';
import { useAuth } from '../hooks/useAuthV2';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // 移除強制登入檢查，允許訪客訪問首頁
  // React.useEffect(() => {
  //   if (!loading && !isAuthenticated) {
  //     navigate('/login');
  //   }
  // }, [navigate, isAuthenticated, loading]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <div className="header-content">
          <h1>🎤 Love To Song V2</h1>
          <p>專業 KTV 點歌管理系統</p>
          <button onClick={handleGoToDashboard} className="dashboard-btn">
            進入控制台
          </button>
        </div>
      </div>
      
      <div className="homepage-content">
        <HomepageWidget />
      </div>

      <style jsx="true">{`
        .homepage-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
        }

        .homepage-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px;
          text-align: center;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-content h1 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header-content p {
          font-size: 1.2rem;
          margin: 0 0 20px 0;
          opacity: 0.9;
        }

        .dashboard-btn {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .dashboard-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .homepage-content {
          flex: 1;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .homepage-content > :global(div) {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default Homepage;