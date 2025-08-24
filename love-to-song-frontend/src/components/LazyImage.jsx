import React, { useState, useRef, useEffect, useCallback } from 'react';

const LazyImage = ({
  src,
  alt = '',
  placeholder = null,
  fallback = null,
  className = '',
  style = {},
  width,
  height,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  blur = true,
  fadeIn = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // 創建 Intersection Observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  // 當圖片進入視窗時開始載入
  useEffect(() => {
    if (isInView && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [isInView, src, imageSrc]);

  // 處理圖片載入成功
  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  }, [onLoad]);

  // 處理圖片載入失敗
  const handleError = useCallback((e) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  }, [onError]);

  // 重試載入
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setImageSrc('');
    // 稍後重新載入
    setTimeout(() => {
      setImageSrc(src);
    }, 100);
  }, [src]);

  // 生成 placeholder 圖片 (base64 blur)
  const generatePlaceholder = useCallback((w = 40, h = 40) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = w;
    canvas.height = h;
    
    // 創建簡單的漸層背景
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(1, '#3d3d3d');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }, []);

  // 預設 placeholder
  const defaultPlaceholder = generatePlaceholder(width || 200, height || 200);

  // 計算樣式
  const containerStyle = {
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    ...style,
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: fadeIn ? 'opacity 0.3s ease, filter 0.3s ease' : 'none',
    opacity: isLoaded ? 1 : 0,
    filter: blur && !isLoaded ? 'blur(5px)' : 'none',
  };

  const placeholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: blur ? 'blur(5px)' : 'none',
    opacity: isLoaded ? 0 : 1,
    transition: fadeIn ? 'opacity 0.3s ease' : 'none',
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={containerStyle}
    >
      {/* Placeholder 圖片 */}
      {!isLoaded && (
        <img
          src={placeholder || defaultPlaceholder}
          alt=""
          style={placeholderStyle}
          className="lazy-image-placeholder"
        />
      )}

      {/* 實際圖片 */}
      {imageSrc && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          style={imageStyle}
          className="lazy-image-main"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* 錯誤狀態 */}
      {hasError && (
        <div className="lazy-image-error">
          {fallback || (
            <div className="error-content">
              <div className="error-icon">🖼️</div>
              <div className="error-text">載入失敗</div>
              <button
                className="retry-button"
                onClick={handleRetry}
              >
                重試
              </button>
            </div>
          )}
        </div>
      )}

      {/* 載入中指示器 */}
      {isInView && imageSrc && !isLoaded && !hasError && (
        <div className="lazy-image-loading">
          <div className="loading-spinner">⏳</div>
        </div>
      )}

      <style jsx="true">{`
        .lazy-image-container {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border-radius: 8px;
          overflow: hidden;
        }

        .lazy-image-placeholder,
        .lazy-image-main {
          display: block;
        }

        .lazy-image-error {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          color: #cccccc;
        }

        .error-content {
          text-align: center;
          padding: 20px;
        }

        .error-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.6;
        }

        .error-text {
          font-size: 14px;
          margin-bottom: 12px;
          color: #999999;
        }

        .retry-button {
          padding: 6px 12px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
        }

        .lazy-image-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          border-radius: 20px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffd700;
          font-size: 12px;
        }

        .loading-spinner {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* 響應式設計 */
        @media (max-width: 768px) {
          .error-content {
            padding: 12px;
          }

          .error-icon {
            font-size: 24px;
          }

          .error-text {
            font-size: 12px;
          }

          .retry-button {
            font-size: 11px;
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;