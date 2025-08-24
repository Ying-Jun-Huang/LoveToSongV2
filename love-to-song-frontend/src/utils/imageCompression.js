/**
 * 圖片壓縮工具類
 * 支持多種格式和壓縮選項
 */
class ImageCompressor {
  constructor() {
    this.defaultOptions = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'auto', // 'auto', 'jpeg', 'webp', 'png'
      enableResize: true,
      enableCompress: true,
      backgroundColor: '#FFFFFF' // 用於PNG轉JPEG時的背景色
    };
  }

  /**
   * 壓縮單個圖片文件
   * @param {File} file - 圖片文件
   * @param {Object} options - 壓縮選項
   * @returns {Promise<File>} - 壓縮後的文件
   */
  async compressImage(file, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // 檢查文件類型
      if (!this.isImageFile(file)) {
        throw new Error('不支援的文件格式');
      }

      // 創建圖片對象
      const img = await this.createImageFromFile(file);
      
      // 計算新尺寸
      const dimensions = this.calculateDimensions(
        img.width, 
        img.height, 
        config.maxWidth, 
        config.maxHeight
      );

      // 創建 Canvas 並繪製圖片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // 設置高質量繪製
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 如果是PNG轉JPEG，需要先填充背景色
      const outputFormat = this.determineOutputFormat(file.type, config.format);
      if (outputFormat === 'image/jpeg' && file.type === 'image/png') {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 繪製圖片
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      // 轉換為 Blob
      const blob = await this.canvasToBlob(canvas, outputFormat, config.quality);
      
      // 創建新文件
      const compressedFile = new File(
        [blob],
        this.generateFileName(file.name, outputFormat),
        { type: outputFormat, lastModified: Date.now() }
      );

      // 如果壓縮後文件更大，返回原文件
      if (compressedFile.size >= file.size) {
        // 壓縮後文件更大，返回原文件
        return file;
      }

      return compressedFile;
    } catch (error) {
      console.error('圖片壓縮失敗:', error);
      throw error;
    }
  }

  /**
   * 批量壓縮圖片
   * @param {FileList|Array<File>} files - 圖片文件數組
   * @param {Object} options - 壓縮選項
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array<File>>} - 壓縮後的文件數組
   */
  async compressImages(files, options = {}, onProgress) {
    const fileArray = Array.from(files);
    const compressedFiles = [];
    const errors = [];

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const compressedFile = await this.compressImage(fileArray[i], options);
        compressedFiles.push({
          original: fileArray[i],
          compressed: compressedFile,
          compressionRatio: (1 - compressedFile.size / fileArray[i].size) * 100,
          originalSize: fileArray[i].size,
          compressedSize: compressedFile.size
        });

        // 調用進度回調
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total: fileArray.length,
            current: fileArray[i],
            progress: ((i + 1) / fileArray.length) * 100
          });
        }
      } catch (error) {
        errors.push({
          file: fileArray[i],
          error: error.message
        });
      }
    }

    return {
      success: compressedFiles,
      errors: errors,
      totalOriginalSize: compressedFiles.reduce((sum, item) => sum + item.originalSize, 0),
      totalCompressedSize: compressedFiles.reduce((sum, item) => sum + item.compressedSize, 0)
    };
  }

  /**
   * 生成縮略圖
   * @param {File} file - 原圖片文件
   * @param {Number} size - 縮略圖大小
   * @returns {Promise<File>} - 縮略圖文件
   */
  async generateThumbnail(file, size = 200) {
    const options = {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg'
    };

    const thumbnail = await this.compressImage(file, options);
    
    // 重命名縮略圖
    const thumbnailName = this.generateFileName(file.name, 'image/jpeg', '_thumb');
    return new File(
      [thumbnail],
      thumbnailName,
      { type: 'image/jpeg', lastModified: Date.now() }
    );
  }

  /**
   * 從文件創建圖片對象
   * @param {File} file - 圖片文件
   * @returns {Promise<HTMLImageElement>} - 圖片對象
   */
  createImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('無法載入圖片'));
      };
      
      img.src = url;
    });
  }

  /**
   * 計算新的圖片尺寸
   * @param {Number} width - 原寬度
   * @param {Number} height - 原高度
   * @param {Number} maxWidth - 最大寬度
   * @param {Number} maxHeight - 最大高度
   * @returns {Object} - 新尺寸 {width, height}
   */
  calculateDimensions(width, height, maxWidth, maxHeight) {
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  /**
   * Canvas 轉 Blob
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {String} format - 輸出格式
   * @param {Number} quality - 質量
   * @returns {Promise<Blob>} - Blob 對象
   */
  canvasToBlob(canvas, format, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, format, quality);
    });
  }

  /**
   * 檢查是否為圖片文件
   * @param {File} file - 文件對象
   * @returns {Boolean} - 是否為圖片
   */
  isImageFile(file) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return imageTypes.includes(file.type);
  }

  /**
   * 決定輸出格式
   * @param {String} originalFormat - 原始格式
   * @param {String} configFormat - 配置格式
   * @returns {String} - 輸出格式
   */
  determineOutputFormat(originalFormat, configFormat) {
    if (configFormat === 'auto') {
      // PNG 保持 PNG，其他轉為 JPEG
      return originalFormat === 'image/png' ? 'image/png' : 'image/jpeg';
    }
    
    const formatMap = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };
    
    return formatMap[configFormat] || 'image/jpeg';
  }

  /**
   * 生成文件名
   * @param {String} originalName - 原文件名
   * @param {String} format - 新格式
   * @param {String} suffix - 後綴
   * @returns {String} - 新文件名
   */
  generateFileName(originalName, format, suffix = '') {
    const name = originalName.split('.')[0];
    const extension = format.split('/')[1];
    return `${name}${suffix}.${extension}`;
  }

  /**
   * 獲取圖片信息
   * @param {File} file - 圖片文件
   * @returns {Promise<Object>} - 圖片信息
   */
  async getImageInfo(file) {
    try {
      const img = await this.createImageFromFile(file);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        megapixels: (img.width * img.height / 1000000).toFixed(2),
        sizeInMB: (file.size / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      throw new Error(`無法獲取圖片信息: ${error.message}`);
    }
  }

  /**
   * 預設壓縮配置
   */
  static presets = {
    // 網頁優化
    web: {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.85,
      format: 'auto'
    },
    
    // 縮略圖
    thumbnail: {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.75,
      format: 'jpeg'
    },
    
    // 高質量
    highQuality: {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.92,
      format: 'auto'
    },
    
    // 小文件
    small: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.7,
      format: 'jpeg'
    }
  };
}

// 創建單例
const imageCompressor = new ImageCompressor();

// 導出便捷方法
export const compressImage = (file, options) => imageCompressor.compressImage(file, options);
export const compressImages = (files, options, onProgress) => imageCompressor.compressImages(files, options, onProgress);
export const generateThumbnail = (file, size) => imageCompressor.generateThumbnail(file, size);
export const getImageInfo = (file) => imageCompressor.getImageInfo(file);

export default imageCompressor;