import React from 'react';

const WidgetControlPanel = ({ widgets, onToggleWidget, onResetLayout, layoutStats }) => {
  return (
    <div className="widget-control-panel">
      <div className="panel-header">
        <div className="panel-title-section">
          <h4>🎛️ 窗格控制</h4>
          {layoutStats && (
            <div className="layout-stats">
              <small>
                用戶: {layoutStats.currentUser} {layoutStats.hasLayout ? '🔖 已保存' : '📝 默認'}
              </small>
            </div>
          )}
        </div>
        <button onClick={onResetLayout} className="reset-btn">
          重設佈局
        </button>
      </div>
      
      <div className="widget-toggles">
        {widgets.map(widget => (
          <div key={widget.i} className="widget-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={widget.visible}
                onChange={() => onToggleWidget(widget.i)}
              />
              <span className="slider"></span>
            </label>
            <span className="widget-label">
              {widget.icon} {widget.name}
            </span>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .widget-control-panel {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .panel-title-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .layout-stats {
          opacity: 0.8;
          font-size: 11px;
          color: rgba(255,255,255,0.8);
        }

        .panel-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
        }

        .reset-btn {
          padding: 6px 12px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .reset-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }

        .widget-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .widget-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          transition: background 0.3s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .widget-toggle:hover {
          background: rgba(255,255,255,0.15);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255,255,255,0.3);
          transition: 0.3s;
          border-radius: 20px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        input:checked + .slider {
          background-color: #4caf50;
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }

        .widget-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .widget-toggles {
            justify-content: center;
            gap: 6px;
          }
          
          .widget-toggle {
            padding: 4px 8px;
            gap: 6px;
          }
          
          .widget-label {
            font-size: 12px;
          }
          
          .panel-header {
            flex-direction: column;
            gap: 8px;
            margin-bottom: 8px;
          }
          
          .panel-header h4 {
            font-size: 14px;
          }
          
          .reset-btn {
            font-size: 11px;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default WidgetControlPanel;