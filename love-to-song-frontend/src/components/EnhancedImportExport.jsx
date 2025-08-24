import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuthV2';
import api from '../services/api';

const EnhancedImportExport = ({
  entityType,
  onImportComplete,
  onExportComplete,
  className = ''
}) => {
  const { canViewWidget } = useAuth();
  const [importState, setImportState] = useState({
    isUploading: false,
    file: null,
    preview: null,
    error: null,
    result: null
  });
  
  const [exportState, setExportState] = useState({
    isExporting: false,
    format: 'CSV',
    filters: {},
    progress: 0
  });

  const fileInputRef = useRef(null);

  // 支持的文件格式
  const supportedFormats = {
    import: ['CSV', 'JSON', 'XLSX'],
    export: ['CSV', 'JSON', 'XLSX', 'PDF']
  };

  // 實體類型配置
  const entityConfigs = {
    songs: {
      name: '歌曲',
      fields: ['title', 'artist', 'category', 'language', 'genre', 'era'],
      requiredFields: ['title'],
      template: {
        title: '歌曲標題',
        artist: '歌手姓名',
        category: '分類',
        language: '語言',
        genre: '曲風',
        era: '年代'
      }
    },
    users: {
      name: '用戶',
      fields: ['displayName', 'email', 'role', 'status'],
      requiredFields: ['displayName', 'email'],
      template: {
        displayName: '顯示名稱',
        email: '電子郵件',
        role: '角色',
        status: '狀態'
      }
    },
    events: {
      name: '活動',
      fields: ['title', 'venue', 'startsAt', 'endsAt', 'description'],
      requiredFields: ['title', 'venue', 'startsAt'],
      template: {
        title: '活動名稱',
        venue: '活動地點',
        startsAt: '開始時間',
        endsAt: '結束時間',
        description: '活動描述'
      }
    },
    requests: {
      name: '點歌請求',
      fields: ['songTitle', 'playerName', 'eventId', 'status', 'priorityIndex'],
      requiredFields: ['songTitle', 'playerName'],
      template: {
        songTitle: '歌曲標題',
        playerName: '點歌人',
        eventId: '活動ID',
        status: '狀態',
        priorityIndex: '優先級'
      }
    }
  };

  const currentConfig = entityConfigs[entityType] || entityConfigs.songs;

  // 處理文件選擇
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toUpperCase();
    if (!supportedFormats.import.includes(fileExtension)) {
      setImportState(prev => ({
        ...prev,
        error: `不支持的文件格式: ${fileExtension}。支持的格式: ${supportedFormats.import.join(', ')}`
      }));
      return;
    }

    setImportState(prev => ({
      ...prev,
      file,
      error: null,
      result: null
    }));

    // 預覽文件內容
    previewFile(file);
  };

  // 預覽文件內容
  const previewFile = async (file) => {
    try {
      const text = await file.text();
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      let preview = null;
      
      if (fileExtension === 'csv') {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''));
        const sampleRows = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        
        preview = {
          type: 'table',
          headers,
          rows: sampleRows,
          totalRows: lines.length - 1
        };
      } else if (fileExtension === 'json') {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        
        preview = {
          type: 'json',
          sample: items.slice(0, 3),
          totalItems: items.length,
          fields: items.length > 0 ? Object.keys(items[0]) : []
        };
      }
      
      setImportState(prev => ({
        ...prev,
        preview
      }));
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        error: `文件預覽失敗: ${error.message}`
      }));
    }
  };

  // 執行導入
  const handleImport = async () => {
    if (!importState.file) return;

    setImportState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', importState.file);
      formData.append('entityType', entityType);

      const response = await api.post('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // 更新進度（如果需要的話）
        },
      });

      setImportState(prev => ({
        ...prev,
        isUploading: false,
        result: response.data,
        file: null,
        preview: null
      }));

      if (onImportComplete) {
        onImportComplete(response.data);
      }

      // 清除文件選擇
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        isUploading: false,
        error: error.response?.data?.message || '導入失敗，請稍後重試'
      }));
    }
  };

  // 執行導出
  const handleExport = async () => {
    setExportState(prev => ({ ...prev, isExporting: true, progress: 0 }));

    try {
      const response = await api.post('/export', {
        entityType,
        format: exportState.format,
        filters: exportState.filters
      }, {
        responseType: exportState.format === 'PDF' ? 'blob' : 'json'
      });

      if (exportState.format === 'PDF') {
        // 處理PDF下載
        const blob = new Blob([response.data], { type: 'application/pdf' });
        downloadFile(blob, `${currentConfig.name}_export.pdf`);
      } else {
        // 處理其他格式
        const data = response.data;
        
        if (exportState.format === 'CSV') {
          const csvContent = convertToCSV(data.data);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          downloadFile(blob, `${currentConfig.name}_export.csv`);
        } else if (exportState.format === 'JSON') {
          const jsonContent = JSON.stringify(data.data, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
          downloadFile(blob, `${currentConfig.name}_export.json`);
        }
      }

      setExportState(prev => ({ ...prev, isExporting: false, progress: 100 }));
      
      if (onExportComplete) {
        onExportComplete({ success: true });
      }

      setTimeout(() => {
        setExportState(prev => ({ ...prev, progress: 0 }));
      }, 2000);
    } catch (error) {
      setExportState(prev => ({ ...prev, isExporting: false, progress: 0 }));
      alert(error.response?.data?.message || '導出失敗，請稍後重試');
    }
  };

  // 轉換為CSV格式
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  // 下載文件
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 下載導入模板
  const downloadTemplate = () => {
    const headers = Object.keys(currentConfig.template);
    const sampleRow = Object.values(currentConfig.template);
    
    const csvContent = [
      headers.join(','),
      sampleRow.map(val => `"${val}"`).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${currentConfig.name}_導入模板.csv`);
  };

  // 重置導入狀態
  const resetImport = () => {
    setImportState({
      isUploading: false,
      file: null,
      preview: null,
      error: null,
      result: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`enhanced-import-export ${className}`}>
      <div className="import-export-header">
        <h3>📥📤 數據導入導出</h3>
        <p>支持 {currentConfig.name} 數據的批量導入和導出</p>
      </div>

      <div className="import-export-content">
        {/* 導入區域 */}
        <div className="import-section">
          <div className="section-header">
            <h4>📥 數據導入</h4>
            <button 
              className="template-btn"
              onClick={downloadTemplate}
            >
              📋 下載模板
            </button>
          </div>

          <div className="import-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={handleFileSelect}
              className="file-input"
              disabled={importState.isUploading}
            />
            
            {importState.file && (
              <div className="file-info">
                <div className="file-details">
                  <span className="file-name">📄 {importState.file.name}</span>
                  <span className="file-size">
                    ({(importState.file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <div className="file-actions">
                  <button
                    className="import-btn"
                    onClick={handleImport}
                    disabled={importState.isUploading}
                  >
                    {importState.isUploading ? '⏳ 導入中...' : '✅ 開始導入'}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={resetImport}
                    disabled={importState.isUploading}
                  >
                    ❌ 取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 文件預覽 */}
          {importState.preview && (
            <div className="file-preview">
              <h5>📋 文件預覽</h5>
              {importState.preview.type === 'table' && (
                <div className="table-preview">
                  <div className="preview-info">
                    共 {importState.preview.totalRows} 行數據，顯示前 5 行
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          {importState.preview.headers.map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importState.preview.rows.map((row, index) => (
                          <tr key={index}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {importState.preview.type === 'json' && (
                <div className="json-preview">
                  <div className="preview-info">
                    共 {importState.preview.totalItems} 項數據，顯示前 3 項
                  </div>
                  <div className="json-fields">
                    <strong>檢測到的欄位:</strong> {importState.preview.fields.join(', ')}
                  </div>
                  <pre>{JSON.stringify(importState.preview.sample, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* 導入結果 */}
          {importState.result && (
            <div className="import-result success">
              <h5>✅ 導入完成</h5>
              <div className="result-details">
                <div>成功導入: {importState.result.success} 項</div>
                {importState.result.failed > 0 && (
                  <div>導入失敗: {importState.result.failed} 項</div>
                )}
                {importState.result.errors && importState.result.errors.length > 0 && (
                  <div className="error-list">
                    <strong>錯誤詳情:</strong>
                    <ul>
                      {importState.result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 導入錯誤 */}
          {importState.error && (
            <div className="import-result error">
              <h5>❌ 導入失敗</h5>
              <div className="error-details">{importState.error}</div>
            </div>
          )}
        </div>

        {/* 導出區域 */}
        <div className="export-section">
          <div className="section-header">
            <h4>📤 數據導出</h4>
          </div>

          <div className="export-controls">
            <div className="format-selection">
              <label>選擇格式:</label>
              <select
                value={exportState.format}
                onChange={(e) => setExportState(prev => ({ ...prev, format: e.target.value }))}
                className="format-select"
              >
                {supportedFormats.export.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <button
              className="export-btn"
              onClick={handleExport}
              disabled={exportState.isExporting}
            >
              {exportState.isExporting ? '⏳ 導出中...' : '📤 開始導出'}
            </button>
          </div>

          {/* 導出進度 */}
          {exportState.progress > 0 && (
            <div className="export-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${exportState.progress}%` }}
                />
              </div>
              <span className="progress-text">{exportState.progress}%</span>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .enhanced-import-export {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          color: #ffffff;
        }

        .import-export-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .import-export-header h3 {
          margin: 0 0 8px 0;
          color: #ffd700;
          font-size: 24px;
          font-weight: 700;
        }

        .import-export-header p {
          margin: 0;
          color: #cccccc;
          font-size: 16px;
        }

        .import-export-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .import-section, .export-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(218, 165, 32, 0.2);
          border-radius: 12px;
          padding: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
        }

        .section-header h4 {
          margin: 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
        }

        .template-btn {
          padding: 6px 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .template-btn:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          transform: translateY(-1px);
        }

        .file-input {
          width: 100%;
          padding: 12px;
          border: 2px dashed rgba(218, 165, 32, 0.5);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .file-input:hover {
          border-color: #daa520;
          background: rgba(255, 255, 255, 0.08);
        }

        .file-info {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(218, 165, 32, 0.3);
          border-radius: 8px;
        }

        .file-details {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .file-name {
          font-weight: 600;
          color: #ffd700;
        }

        .file-size {
          color: #cccccc;
          font-size: 14px;
        }

        .file-actions {
          display: flex;
          gap: 12px;
        }

        .import-btn, .cancel-btn, .export-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .import-btn, .export-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .import-btn:hover, .export-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
        }

        .cancel-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .cancel-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }

        .import-btn:disabled, .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .file-preview {
          margin-top: 20px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .file-preview h5 {
          margin: 0 0 12px 0;
          color: #ffd700;
          font-size: 16px;
        }

        .preview-info {
          margin-bottom: 12px;
          color: #cccccc;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
        }

        .table-preview table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .table-preview th,
        .table-preview td {
          padding: 8px;
          text-align: left;
          border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .table-preview th {
          background: rgba(218, 165, 32, 0.1);
          color: #ffd700;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        .table-preview td {
          color: #cccccc;
        }

        .json-preview {
          max-height: 200px;
          overflow-y: auto;
        }

        .json-fields {
          margin-bottom: 12px;
          color: #cccccc;
          font-size: 14px;
        }

        .json-preview pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #e5e5e5;
          overflow-x: auto;
        }

        .import-result {
          margin-top: 20px;
          padding: 16px;
          border-radius: 8px;
          border: 2px solid;
        }

        .import-result.success {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
        }

        .import-result.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .import-result h5 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .result-details div {
          margin-bottom: 8px;
          color: #cccccc;
        }

        .error-list {
          margin-top: 12px;
        }

        .error-list ul {
          margin: 8px 0 0 16px;
          color: #fca5a5;
        }

        .error-list li {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .format-selection {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .format-selection label {
          color: #ffd700;
          font-weight: 600;
        }

        .format-select {
          padding: 8px 12px;
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
        }

        .format-select:focus {
          outline: none;
          border-color: #daa520;
        }

        .export-progress {
          margin-top: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          display: block;
          text-align: center;
          margin-top: 8px;
          color: #ffd700;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .import-export-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .file-actions {
            flex-direction: column;
          }

          .format-selection {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedImportExport;