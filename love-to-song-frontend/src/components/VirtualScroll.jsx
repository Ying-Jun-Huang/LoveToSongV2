import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const VirtualScroll = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  loading = false,
  onScrollEnd,
  estimatedItemSize = itemHeight,
  getItemSize
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  const scrollElementRef = useRef(null);
  const itemSizeCache = useRef(new Map());
  
  // 計算可視範圍
  const visibleRange = useMemo(() => {
    if (!items.length) return { start: 0, end: 0 };

    let start = 0;
    let end = 0;
    let currentOffset = 0;

    if (getItemSize) {
      // 動態高度計算
      for (let i = 0; i < items.length; i++) {
        const itemSize = itemSizeCache.current.get(i) || getItemSize(i, items[i]);
        itemSizeCache.current.set(i, itemSize);
        
        if (currentOffset + itemSize >= scrollTop - overscan * estimatedItemSize) {
          start = Math.max(0, i - overscan);
          break;
        }
        currentOffset += itemSize;
      }

      currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        const itemSize = itemSizeCache.current.get(i) || getItemSize(i, items[i]);
        if (currentOffset >= scrollTop + containerHeight + overscan * estimatedItemSize) {
          end = Math.min(items.length - 1, i + overscan);
          break;
        }
        currentOffset += itemSize;
      }
      
      if (end === 0) end = items.length - 1;
    } else {
      // 固定高度計算
      start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      end = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
      );
    }

    return { start, end };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan, getItemSize, estimatedItemSize]);

  // 計算總高度
  const totalHeight = useMemo(() => {
    if (getItemSize) {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        const itemSize = itemSizeCache.current.get(i) || getItemSize(i, items[i]);
        height += itemSize;
      }
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, getItemSize]);

  // 計算偏移量
  const offsetY = useMemo(() => {
    if (getItemSize) {
      let offset = 0;
      for (let i = 0; i < visibleRange.start; i++) {
        const itemSize = itemSizeCache.current.get(i) || getItemSize(i, items[i]);
        offset += itemSize;
      }
      return offset;
    }
    return visibleRange.start * itemHeight;
  }, [visibleRange.start, itemHeight, getItemSize]);

  // 處理滾動事件
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);

    // 檢查是否滾動到底部
    const { scrollHeight, clientHeight } = e.target;
    if (newScrollTop + clientHeight >= scrollHeight - 10) {
      onScrollEnd?.();
    }
  }, [onScrollEnd]);

  // 節流處理滾動事件
  const throttledHandleScroll = useCallback(
    throttle(handleScroll, 16), // 60fps
    [handleScroll]
  );

  // 渲染可視項目
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        const item = items[i];
        const itemSize = getItemSize ? 
          (itemSizeCache.current.get(i) || getItemSize(i, item)) : 
          itemHeight;

        items_to_render.push(
          <div
            key={item.id || i}
            style={{
              height: itemSize,
              flexShrink: 0,
            }}
            className="virtual-scroll-item"
          >
            {renderItem(item, i)}
          </div>
        );
      }
    }

    return items_to_render;
  }, [visibleRange, items, renderItem, itemHeight, getItemSize]);

  // 滾動到指定項目
  const scrollToItem = useCallback((index, behavior = 'smooth') => {
    if (!scrollElementRef.current || index < 0 || index >= items.length) return;

    let targetOffset = 0;
    if (getItemSize) {
      for (let i = 0; i < index; i++) {
        const itemSize = itemSizeCache.current.get(i) || getItemSize(i, items[i]);
        targetOffset += itemSize;
      }
    } else {
      targetOffset = index * itemHeight;
    }

    scrollElementRef.current.scrollTo({
      top: targetOffset,
      behavior
    });
  }, [items, itemHeight, getItemSize]);

  // 清除緩存（當項目變更時）
  useEffect(() => {
    itemSizeCache.current.clear();
  }, [items]);

  // 暴露方法給父組件
  useEffect(() => {
    if (containerRef) {
      containerRef.scrollToItem = scrollToItem;
    }
  }, [containerRef, scrollToItem]);

  return (
    <div
      ref={(el) => {
        scrollElementRef.current = el;
        setContainerRef(el);
      }}
      className={`virtual-scroll-container ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={throttledHandleScroll}
    >
      {/* 佔位容器，用於維持滾動條的正確高度 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可視內容容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {loading ? (
            <div className="virtual-scroll-loading">
              <div className="loading-spinner">⏳</div>
              <span>載入中...</span>
            </div>
          ) : (
            visibleItems
          )}
        </div>
      </div>

      <style jsx="true">{`
        .virtual-scroll-container {
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: #daa520 #2a2a2a;
        }

        .virtual-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .virtual-scroll-container::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 4px;
        }

        .virtual-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #daa520, #b8860b);
          border-radius: 4px;
        }

        .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ffd700, #daa520);
        }

        .virtual-scroll-item {
          display: flex;
          align-items: stretch;
        }

        .virtual-scroll-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #ffd700;
          font-size: 16px;
        }

        .loading-spinner {
          font-size: 32px;
          margin-bottom: 12px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* 滾動性能優化 */
        .virtual-scroll-container {
          will-change: scroll-position;
          -webkit-overflow-scrolling: touch;
        }

        .virtual-scroll-item {
          contain: layout style paint;
        }
      `}</style>
    </div>
  );
};

// 節流函數
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default VirtualScroll;