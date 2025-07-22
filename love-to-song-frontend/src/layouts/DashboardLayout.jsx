// file: love-to-song-frontend/src/layouts/DashboardLayout.jsx
import React, { useEffect, useState } from 'react';
import GridLayout, { WidthProvider, Responsive } from 'react-grid-layout';
import { getLayout, saveLayout } from '../services/layoutService';

// Wrap GridLayout to make it responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardLayout = () => {
  const [layout, setLayout] = useState([]);       // current layout (positions of items)
  const [components, setComponents] = useState([]); // components to render in the layout

  // On mount, fetch the saved layout for this user
  useEffect(() => {
    async function fetchLayout() {
      try {
        const saved = await getLayout();  // fetch saved layout structure from backend
        if (saved) {
          setLayout(saved.layout);
          setComponents(saved.components);
        }
      } catch (err) {
        console.error('Failed to load layout:', err);
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
      return (
        <div key={item.i} data-grid={item}>
          {/* Render component content based on its type */}
          {comp && comp.type === 'SongList' && <SongListWidget {...comp.props} />}
          {comp && comp.type === 'Stats' && <StatsWidget {...comp.props} />}
          {/* ... other component types */}
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

  return (
    <ResponsiveGridLayout 
      {...gridProps}
      layouts={{ lg: layout }} 
      onLayoutChange={(curLayout) => onLayoutChange(curLayout)}
      measureBeforeMount={false}
      useCSSTransforms={true}
      compactType="vertical"
      preventCollision={false}
    >
      {renderGridItems()}
    </ResponsiveGridLayout>
  );
};

export default DashboardLayout;
