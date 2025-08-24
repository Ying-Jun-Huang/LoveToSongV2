import React from 'react';
import { useAuth } from '../hooks/useAuthV2';

const TabNavigation = ({ activeTab, onTabChange, tabs = [] }) => {
  const { hasAnyPermission } = useAuth();

  // 過濾用戶可以看到的分頁 - 清理版本，移除所有調試日誌
  const visibleTabs = tabs.filter(tab => {
    if (!tab.permissions || tab.permissions.length === 0) {
      return true; // 沒有權限要求的分頁，所有人都能看到
    }
    return hasAnyPermission(tab.permissions);
  });

  return (
    <div className="tab-navigation">
      <div className="tab-list">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className="tab-button"
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      <style jsx="true">{`
        .tab-navigation {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
          border: 1px solid #ffd700;
        }

        .tab-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          background: rgba(255, 215, 0, 0.1);
          color: rgba(255, 215, 0, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .tab-button:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          border-color: rgba(255, 215, 0, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }


        .tab-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .tab-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .tab-label {
          flex-shrink: 0;
        }

        .tab-badge {
          background: #ffd700;
          color: #000000;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
        }


        @media (max-width: 768px) {
          .tab-navigation {
            margin: 0 -10px 20px -10px;
            border-radius: 0;
            border-radius: 0 0 12px 12px;
          }

          .tab-list {
            justify-content: center;
            gap: 4px;
          }

          .tab-button {
            padding: 8px 12px;
            font-size: 13px;
            flex-direction: column;
            gap: 4px;
            min-width: 60px;
          }

          .tab-label {
            font-size: 11px;
            line-height: 1.2;
          }

          .tab-icon {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .tab-button {
            padding: 6px 8px;
          }

          .tab-label {
            display: none;
          }

          .tab-button {
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default TabNavigation;