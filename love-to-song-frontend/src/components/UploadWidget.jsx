import React, { useState } from 'react';
import api from '../services/api';

const UploadWidget = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('excel'); // 'excel' or 'photo'
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [players, setPlayers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // 載入玩家清單（用於頭像上傳）
  const loadPlayers = async () => {
    try {
      const response = await api.get('/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  React.useEffect(() => {
    if (uploadType === 'photo') {
      loadPlayers();
    }
  }, [uploadType]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setUploadResults(null);
    setShowResults(false);
  };

  const handleExcelUpload = async () => {
    if (!selectedFile) {
      alert('請選擇 Excel 檔案');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const response = await api.post('/upload/players/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResults(response.data);
      setShowResults(true);
      setSelectedFile(null);
      
      // 清空檔案輸入
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || '上傳失敗');
    }
    setUploading(false);
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      alert('請選擇照片檔案');
      return;
    }

    if (!selectedPlayer) {
      alert('請選擇玩家');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('playerId', selectedPlayer);

    setUploading(true);
    try {
      const response = await api.post('/upload/players/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResults(response.data);
      setShowResults(true);
      setSelectedFile(null);
      setSelectedPlayer('');
      
      // 清空檔案輸入
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || '上傳失敗');
    }
    setUploading(false);
  };

  const handleExport = async () => {
    setUploading(true);
    try {
      const response = await api.post('/upload/players/export');
      
      // 建立下載連結
      const downloadUrl = `${api.defaults.baseURL}${response.data.downloadUrl}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = response.data.filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('匯出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert(error.response?.data?.message || '匯出失敗');
    }
    setUploading(false);
  };

  const renderUploadResults = () => {
    if (!uploadResults || !showResults) return null;

    if (uploadType === 'excel') {
      return (
        <div className="upload-results">
          <h4>匯入結果</h4>
          <div className="result-summary">
            <div className="result-item success">
              <span className="label">成功匯入:</span>
              <span className="value">{uploadResults.imported} 筆</span>
            </div>
            <div className="result-item total">
              <span className="label">總計處理:</span>
              <span className="value">{uploadResults.total} 筆</span>
            </div>
            {uploadResults.errors && uploadResults.errors.length > 0 && (
              <div className="result-item error">
                <span className="label">錯誤:</span>
                <span className="value">{uploadResults.errors.length} 筆</span>
              </div>
            )}
          </div>
          
          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <div className="error-details">
              <h5>錯誤詳細資訊:</h5>
              <div className="error-list">
                {uploadResults.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="error-item">
                    <strong>第 {error.row} 行:</strong> {error.error}
                  </div>
                ))}
                {uploadResults.errors.length > 10 && (
                  <div className="more-errors">
                    ... 還有 {uploadResults.errors.length - 10} 個錯誤
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } else if (uploadType === 'photo') {
      return (
        <div className="upload-results">
          <h4>上傳結果</h4>
          <div className="result-summary">
            <div className="result-item success">
              <span className="label">狀態:</span>
              <span className="value">上傳成功</span>
            </div>
            <div className="result-item">
              <span className="label">玩家:</span>
              <span className="value">{uploadResults.player?.name}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="upload-widget">
      <div className="widget-header">
        <h3>檔案管理</h3>
      </div>

      <div className="upload-controls">
        <div className="upload-type-selector">
          <label>
            <input
              type="radio"
              value="excel"
              checked={uploadType === 'excel'}
              onChange={(e) => setUploadType(e.target.value)}
            />
            Excel 匯入玩家資料
          </label>
          <label>
            <input
              type="radio"
              value="photo"
              checked={uploadType === 'photo'}
              onChange={(e) => setUploadType(e.target.value)}
            />
            上傳玩家頭像
          </label>
        </div>

        <div className="upload-section">
          {uploadType === 'excel' && (
            <>
              <div className="file-input-section">
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                  {selectedFile ? selectedFile.name : '選擇 Excel 檔案'}
                </label>
              </div>
              
              <div className="upload-info">
                <h4>Excel 格式說明:</h4>
                <ul>
                  <li>支援 .xlsx 和 .xls 格式</li>
                  <li>第一行必須是標題行</li>
                  <li>必要欄位: 玩家編號、姓名</li>
                  <li>可選欄位: 備用編號、暱稱、性別、生日、加入日期、備註等</li>
                  <li>性別請使用: M/男 或 F/女</li>
                  <li>日期格式: YYYY-MM-DD</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button
                  onClick={handleExcelUpload}
                  disabled={!selectedFile || uploading}
                  className="upload-btn"
                >
                  {uploading ? '匯入中...' : '開始匯入'}
                </button>
              </div>
            </>
          )}

          {uploadType === 'photo' && (
            <>
              <div className="photo-upload-section">
                <div className="player-selector">
                  <label>選擇玩家:</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="player-select"
                  >
                    <option value="">請選擇玩家</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.playerId} - {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="file-input-section">
                  <input
                    id="file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    {selectedFile ? selectedFile.name : '選擇照片檔案'}
                  </label>
                </div>
              </div>

              <div className="upload-info">
                <h4>照片要求:</h4>
                <ul>
                  <li>支援 JPG, PNG, GIF 格式</li>
                  <li>檔案大小不超過 2MB</li>
                  <li>建議尺寸: 200x200 像素</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button
                  onClick={handlePhotoUpload}
                  disabled={!selectedFile || !selectedPlayer || uploading}
                  className="upload-btn"
                >
                  {uploading ? '上傳中...' : '上傳頭像'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="export-section">
          <h4>匯出功能</h4>
          <button
            onClick={handleExport}
            disabled={uploading}
            className="export-btn"
          >
            {uploading ? '匯出中...' : '匯出玩家資料 (Excel)'}
          </button>
        </div>

        {renderUploadResults()}
      </div>

      <style jsx="true">{`
        .upload-widget {
          background: transparent;
          border-radius: 0;
          padding: 20px;
          box-shadow: none;
          border: none;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: auto;
          color: #ffffff;
        }

        .widget-header {
          margin-bottom: 20px;
          border-bottom: 2px solid #daa520;
          padding-bottom: 10px;
        }

        .widget-header h3 {
          margin: 0;
          color: #ffd700;
          font-weight: 600;
        }

        .upload-controls {
          flex: 1;
        }

        .upload-type-selector {
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
        }

        .upload-type-selector label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: bold;
          color: #ffffff;
        }

        .upload-section {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #daa520;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .file-input {
          display: none;
        }

        .file-input-section {
          margin-bottom: 15px;
        }

        .file-input-label {
          display: inline-block;
          padding: 10px 20px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #daa520;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .file-input-label:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }

        .photo-upload-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .player-selector label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #ffd700;
        }

        .player-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #daa520;
          border-radius: 4px;
          font-size: 14px;
          background: linear-gradient(135deg, #333333, #404040);
          color: #ffffff;
          transition: all 0.2s ease;
        }
        
        .player-select:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
          background: linear-gradient(135deg, #404040, #4a4a4a);
        }

        .upload-info {
          background: linear-gradient(135deg, #404040 0%, #4a4a4a 100%);
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          border: 1px solid rgba(218, 165, 32, 0.3);
          box-shadow: inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .upload-info h4 {
          margin: 0 0 10px 0;
          color: #ffd700;
        }

        .upload-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .upload-info li {
          margin-bottom: 5px;
          font-size: 14px;
          color: #cccccc;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .upload-btn, .export-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #daa520, #b8860b);
          color: white;
          border: 1px solid #daa520;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .export-btn {
          background: linear-gradient(135deg, #17a2b8, #138496);
          border-color: #17a2b8;
        }

        .upload-btn:hover {
          background: linear-gradient(135deg, #b8860b, #9a7209);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(218, 165, 32, 0.3);
        }

        .export-btn:hover {
          background: linear-gradient(135deg, #138496, #117a8b);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
        }

        .upload-btn:disabled, .export-btn:disabled {
          background: linear-gradient(135deg, #666666, #555555);
          cursor: not-allowed;
          border-color: #666666;
        }

        .export-section {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #daa520;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .export-section h4 {
          margin: 0 0 10px 0;
          color: #ffd700;
          font-weight: 600;
        }

        .upload-results {
          background: linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%);
          border: 1px solid #daa520;
          border-radius: 6px;
          padding: 15px;
          margin-top: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.1);
        }

        .upload-results h4 {
          margin: 0 0 15px 0;
          color: #ffd700;
          font-weight: 600;
        }

        .result-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-item .label {
          font-weight: bold;
          color: #cccccc;
        }

        .result-item .value {
          background: linear-gradient(135deg, #404040, #4a4a4a);
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          color: #ffd700;
          border: 1px solid rgba(218, 165, 32, 0.3);
        }

        .result-item.success .value {
          color: #28a745;
          border-color: rgba(40, 167, 69, 0.5);
        }

        .result-item.error .value {
          color: #dc3545;
          border-color: rgba(220, 53, 69, 0.5);
        }

        .error-details {
          background: linear-gradient(135deg, #3a2a2a 0%, #4d3d3d 100%);
          border: 1px solid rgba(220, 53, 69, 0.5);
          border-radius: 4px;
          padding: 15px;
          margin-top: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .error-details h5 {
          margin: 0 0 10px 0;
          color: #ff6b6b;
          font-weight: 600;
        }

        .error-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .error-item {
          padding: 5px 0;
          border-bottom: 1px solid rgba(220, 53, 69, 0.3);
          font-size: 14px;
          color: #ffffff;
        }

        .more-errors {
          padding: 10px 0;
          font-style: italic;
          color: #ff9999;
        }
      `}</style>
    </div>
  );
};

export default UploadWidget;