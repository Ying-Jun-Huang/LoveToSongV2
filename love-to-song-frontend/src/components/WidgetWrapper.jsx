import React from 'react';

const WidgetWrapper = ({ widget, children, onClose, onMinimize }) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  const handleMinimize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMinimized(!isMinimized);
    if (onMinimize) onMinimize(!isMinimized);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClose) onClose(widget.i);
  };

  return (
    <div className={`widget-wrapper ${isMinimized ? 'minimized' : ''}`}>
      <div className="widget-header">
        <div className="widget-title">
          <span className="widget-icon">{widget.icon}</span>
          <span className="widget-name">{widget.name}</span>
        </div>
        <div className="widget-controls">
          <button 
            className="control-btn minimize-btn" 
            onClick={handleMinimize}
            title={isMinimized ? '展開' : '最小化'}
          >
            {isMinimized ? '📈' : '📉'}
          </button>
          <button 
            className="control-btn close-btn" 
            onClick={handleClose}
            title="關閉窗格"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className={`widget-content ${isMinimized ? 'hidden' : ''}`}>
        {children}
      </div>

      <style jsx="true">{`
        .widget-wrapper {
          height: 100%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #e0e4e7;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .widget-wrapper:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }

        .widget-wrapper.minimized {
          height: 60px !important;
        }

        .widget-header {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e4e7;
          cursor: move; /* 表示可拖拽 */
          position: relative;
        }

        .widget-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        .widget-icon {
          font-size: 16px;
        }

        .widget-controls {
          display: flex;
          gap: 4px;
        }

        .control-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255,255,255,0.9);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s ease;
          color: #4a5568;
          position: relative;
          z-index: 10;
          flex-shrink: 0;
        }

        .control-btn:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .minimize-btn:hover {
          color: #3182ce;
        }

        .close-btn:hover {
          color: white;
          background: #e53e3e;
          transform: scale(1.2);
        }

        .widget-content {
          height: calc(100% - 61px);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .widget-content.hidden {
          height: 0;
          opacity: 0;
        }

        .widget-content > :global(div) {
          height: 100%;
          border-radius: 0 0 12px 12px;
          box-shadow: none !important;
          border: none !important;
        }

        /* 拖拽時的樣式 */
        .react-grid-item.react-draggable-dragging .widget-wrapper {
          transform: rotate(2deg) scale(1.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
          z-index: 1000;
        }

        .react-grid-item.react-draggable-dragging .widget-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .react-grid-item.react-draggable-dragging .widget-title {
          color: white;
        }

        .react-grid-item.react-draggable-dragging .control-btn {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        /* 調整大小時的樣式 */
        .react-grid-item.react-resizable-resizing .widget-wrapper {
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default WidgetWrapper;