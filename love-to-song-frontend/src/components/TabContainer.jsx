import React from 'react';

const TabContainer = ({ activeTab, children, className = "" }) => {
  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-content">
        {children}
      </div>

      <style jsx="true">{`
        .tab-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          border: 1px solid #daa520;
        }

        .tab-content {
          flex: 1;
          overflow: auto;
          position: relative;
          background: transparent;
        }

        /* 滾動條美化 */
        .tab-content::-webkit-scrollbar {
          width: 8px;
        }

        .tab-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }

        .tab-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #daa520, #b8860b);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(218, 165, 32, 0.3);
        }

        .tab-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ffd700, #daa520);
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
        }

        /* 全螢幕模式樣式 */
        .tab-container.fullscreen {
          border-radius: 0;
          height: 100vh;
          box-shadow: none;
          border: none;
        }

        .tab-container.fullscreen .tab-content {
          padding: 0;
        }

        /* 動畫效果 */
        .tab-content {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 手機優化 */
        @media (max-width: 768px) {
          .tab-container {
            border-radius: 12px;
            margin: 0 -10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .tab-content {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TabContainer;