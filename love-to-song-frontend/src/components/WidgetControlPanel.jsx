import React from 'react';

const WidgetControlPanel = ({ widgets, onToggleWidget, onResetLayout }) => {
  return (
    <div className="widget-control-panel">
      <div className="panel-header">
        <h4>🎛️ 窗格控制</h4>
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
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
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
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .widget-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          transition: background 0.3s ease;
        }

        .widget-toggle:hover {
          background: rgba(255,255,255,0.15);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
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
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
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
          transform: translateX(20px);
        }

        .widget-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default WidgetControlPanel;