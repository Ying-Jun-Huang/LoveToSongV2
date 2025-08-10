// file: love-to-song-frontend/src/layouts/DashboardLayout.jsx
import React, { useEffect, useState } from 'react';
import GridLayout, { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { getLayout, saveLayout } from '../services/layoutService';
import SongListWidget from '../components/SongListWidget';
import StatsWidget from '../components/StatsWidget';
import PlayersWidget from '../components/PlayersWidget';
import UploadWidget from '../components/UploadWidget';
import SongRequestWidget from '../components/SongRequestWidget';
import HomepageWidget from '../components/HomepageWidget';
import WidgetControlPanel from '../components/WidgetControlPanel';
import WidgetWrapper from '../components/WidgetWrapper';

// Wrap GridLayout to make it responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardLayout = () => {
  // Widget definitions with visibility control
  const allWidgets = [
    { 
      i: 'homepage', 
      type: 'Homepage', 
      name: '首頁展示', 
      icon: '🏠',
      defaultLayout: { x: 0, y: 0, w: 4, h: 12 },
      visible: true 
    },
    { 
      i: 'songRequests', 
      type: 'SongRequests', 
      name: '點歌系統', 
      icon: '🎤',
      defaultLayout: { x: 4, y: 0, w: 4, h: 12 },
      visible: true 
    },
    { 
      i: 'songList', 
      type: 'SongList', 
      name: '歌曲管理', 
      icon: '🎵',
      defaultLayout: { x: 8, y: 0, w: 4, h: 8 },
      visible: true 
    },
    { 
      i: 'players', 
      type: 'Players', 
      name: '玩家管理', 
      icon: '👥',
      defaultLayout: { x: 8, y: 8, w: 4, h: 8 },
      visible: true 
    },
    { 
      i: 'upload', 
      type: 'Upload', 
      name: '檔案管理', 
      icon: '📁',
      defaultLayout: { x: 0, y: 12, w: 6, h: 8 },
      visible: true 
    },
    { 
      i: 'stats', 
      type: 'Stats', 
      name: '統計資訊', 
      icon: '📊',
      defaultLayout: { x: 6, y: 12, w: 6, h: 6 },
      visible: true 
    },
  ];

  const [widgets, setWidgets] = useState(allWidgets);
  const [layout, setLayout] = useState([]);
  const [components, setComponents] = useState([]);

  // Update layout and components when widgets visibility changes
  useEffect(() => {
    const visibleWidgets = widgets.filter(w => w.visible);
    const newLayout = visibleWidgets.map(w => ({
      i: w.i,
      ...w.defaultLayout
    }));
    const newComponents = visibleWidgets.map(w => ({
      i: w.i,
      type: w.type,
      props: {}
    }));
    
    setLayout(newLayout);
    setComponents(newComponents);
  }, [widgets]);

  // On mount, fetch the saved layout for this user
  useEffect(() => {
    async function fetchLayout() {
      try {
        const saved = await getLayout();
        if (saved && saved.layout && saved.layout.length > 0) {
          setLayout(saved.layout);
          setComponents(saved.components);
        }
      } catch (err) {
        console.error('Failed to load layout:', err);
        // Keep default layout on error
      }
    }
    fetchLayout();
  }, []);

  // Handler for layout change (dragging/resizing events)
  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    // Optionally, save layout on every change or throttle this to save on drop
    saveLayout(newLayout, components).catch(err => console.error('Save layout failed', err));
  };

  // For simplicity, assume components is an array of objects corresponding to layout items.
  // Each component object might have an id and type to determine what to render.
  const renderGridItems = () => {
    return layout.map(item => {
      const comp = components.find(c => c.i === item.i);
      const widget = widgets.find(w => w.i === item.i);
      
      if (!comp || !widget) return null;
      
      return (
        <div key={item.i} data-grid={item}>
          <WidgetWrapper 
            widget={widget}
            onClose={toggleWidget}
          >
            {/* Render component content based on its type */}
            {comp.type === 'Homepage' && <HomepageWidget {...comp.props} />}
            {comp.type === 'SongRequests' && <SongRequestWidget {...comp.props} />}
            {comp.type === 'SongList' && <SongListWidget {...comp.props} />}
            {comp.type === 'Players' && <PlayersWidget {...comp.props} />}
            {comp.type === 'Upload' && <UploadWidget {...comp.props} />}
            {comp.type === 'Stats' && <StatsWidget {...comp.props} />}
            {/* ... other component types */}
          </WidgetWrapper>
        </div>
      );
    });
  };

  // Define default properties for the grid (columns, breakpoints, etc.)
  const gridProps = {
    className: "layout",
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },  // number of columns at each breakpoint
    rowHeight: 30,
    // breakpoints could be defined if needed, or use defaults
  };

  const toggleWidget = (widgetId) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(w => 
        w.i === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  };

  const resetLayout = () => {
    setWidgets(allWidgets.map(w => ({ ...w, visible: true })));
  };

  return (
    <div className="dashboard-layout-container">
      <WidgetControlPanel 
        widgets={widgets}
        onToggleWidget={toggleWidget}
        onResetLayout={resetLayout}
      />
      
      <ResponsiveGridLayout 
        {...gridProps}
        layouts={{ lg: layout }} 
        onLayoutChange={(curLayout) => onLayoutChange(curLayout)}
        measureBeforeMount={false}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        margin={[10, 10]} // 增加間距
        containerPadding={[10, 10]} // 容器內邊距
      >
        {renderGridItems()}
      </ResponsiveGridLayout>
      
      <style jsx="true" global="true">{`
        /* 修復拖曳佈局的重疊問題 */
        .react-grid-layout {
          position: relative;
          min-height: 100vh;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
          box-sizing: border-box;
        }
        
        .react-grid-item:not(.react-grid-placeholder) {
          background: transparent;
          border: none;
        }
        
        .react-grid-item > div {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
        }
        
        /* 確保窗格不會重疊 */
        .react-grid-item .widget {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          background: white;
          overflow: hidden;
          z-index: 1;
        }
        
        .react-grid-item.react-draggable-dragging {
          z-index: 1000 !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        
        .react-grid-item.react-resizable-resizing {
          z-index: 1000 !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        
        /* 拖曳時的樣式 */
        .react-grid-placeholder {
          background: rgba(0, 123, 255, 0.1) !important;
          border: 2px dashed #007bff !important;
          border-radius: 8px !important;
          opacity: 0.8;
        }
        
        /* 調整 resize 手柄 */
        .react-resizable-handle {
          z-index: 2;
        }
        
        .react-resizable-handle-se {
          bottom: 3px;
          right: 3px;
          cursor: se-resize;
        }
        
        /* 移除原本的窗格樣式，現在由 WidgetWrapper 統一處理 */
        
        .dashboard-layout-container {
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        /* 美化整體佈局 */
        .react-grid-layout {
          position: relative;
          background: transparent;
        }

        /* 拖拽預覽樣式 */
        .react-grid-placeholder {
          background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)) !important;
          border: 2px dashed rgba(102, 126, 234, 0.5) !important;
          border-radius: 12px !important;
          opacity: 0.8;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        /* Resize handles 美化 */
        .react-resizable-handle {
          background: rgba(102, 126, 234, 0.3);
          border-radius: 50%;
        }

        .react-resizable-handle-se {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
          width: 16px;
          height: 16px;
          bottom: 6px;
          right: 6px;
          border-radius: 50%;
        }

        .react-resizable-handle-se:hover {
          background: linear-gradient(135deg, #667eea, #764ba2);
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
