import React, { useState } from 'react';

const BatchOperations = ({
  entityType,
  selectedItems = [],
  onBatchAction,
  onSelectAll,
  onSelectNone,
  availableActions = [],
  loading = false,
  className = ''
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // 預設操作配置
  const defaultActions = {
    delete: {
      id: 'delete',
      label: '刪除選中項目',
      icon: '🗑️',
      confirmText: '確定要刪除選中的 {count} 個項目嗎？此操作無法復原。',
      buttonClass: 'danger',
      requireConfirm: true
    },
    export: {
      id: 'export',
      label: '導出選中項目',
      icon: '📤',
      confirmText: '導出選中的 {count} 個項目為 CSV 文件？',
      buttonClass: 'primary',
      requireConfirm: false
    },
    activate: {
      id: 'activate',
      label: '啟用選中項目',
      icon: '✅',
      confirmText: '確定要啟用選中的 {count} 個項目嗎？',
      buttonClass: 'success',
      requireConfirm: true
    },
    deactivate: {
      id: 'deactivate',
      label: '停用選中項目',
      icon: '❌',
      confirmText: '確定要停用選中的 {count} 個項目嗎？',
      buttonClass: 'warning',
      requireConfirm: true
    },
    archive: {
      id: 'archive',
      label: '歸檔選中項目',
      icon: '📦',
      confirmText: '確定要歸檔選中的 {count} 個項目嗎？',
      buttonClass: 'secondary',
      requireConfirm: true
    },
    duplicate: {
      id: 'duplicate',
      label: '複製選中項目',
      icon: '📋',
      confirmText: '確定要複製選中的 {count} 個項目嗎？',
      buttonClass: 'primary',
      requireConfirm: false
    },
    move: {
      id: 'move',
      label: '移動選中項目',
      icon: '📁',
      confirmText: '選擇要移動到的目標位置',
      buttonClass: 'primary',
      requireConfirm: false
    }
  };

  // 執行批量操作
  const handleBatchAction = (action) => {
    if (selectedItems.length === 0) {
      alert('請先選擇要操作的項目');
      return;
    }

    const actionConfig = defaultActions[action.id] || action;
    
    if (actionConfig.requireConfirm) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      executeBatchAction(action);
    }
  };

  // 確認並執行批量操作
  const confirmBatchAction = () => {
    if (pendingAction) {
      executeBatchAction(pendingAction);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // 執行批量操作
  const executeBatchAction = (action) => {
    onBatchAction({
      actionId: action.id,
      items: selectedItems,
      entityType
    });
  };

  // 取消確認對話框
  const cancelConfirmDialog = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // 獲取確認文字
  const getConfirmText = () => {
    if (!pendingAction) return '';
    const actionConfig = defaultActions[pendingAction.id] || pendingAction;
    return actionConfig.confirmText.replace('{count}', selectedItems.length);
  };

  // 獲取實體類型的中文名稱
  const getEntityDisplayName = () => {
    const names = {
      songs: '歌曲',
      users: '用戶',
      events: '活動',
      requests: '點歌請求',
      singers: '歌手',
      notifications: '通知'
    };
    return names[entityType] || '項目';
  };

  // 合併可用操作與預設操作
  const getAvailableActions = () => {
    return availableActions.map(actionId => {
      if (typeof actionId === 'string') {
        return defaultActions[actionId];
      }
      return actionId;
    }).filter(Boolean);
  };

  const actions = getAvailableActions();

  return (
    <div className={`batch-operations ${className}`}>
      <div className="batch-header">
        <div className="selection-info">
          <span className="selection-count">
            已選擇 {selectedItems.length} 個{getEntityDisplayName()}
          </span>
          <div className="selection-controls">
            <button 
              className="select-btn select-all"
              onClick={onSelectAll}
              disabled={loading}
            >
              全選
            </button>
            <button 
              className="select-btn select-none"
              onClick={onSelectNone}
              disabled={loading}
            >
              清除選擇
            </button>
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="batch-actions">
          <div className="actions-label">批量操作:</div>
          <div className="actions-buttons">
            {actions.map(action => (
              <button
                key={action.id}
                className={`batch-action-btn ${action.buttonClass || 'primary'}`}
                onClick={() => handleBatchAction(action)}
                disabled={loading}
                title={action.label}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="dialog-header">
              <h4>確認操作</h4>
              <button 
                className="close-btn"
                onClick={cancelConfirmDialog}
              >
                ✕
              </button>
            </div>
            
            <div className="dialog-content">
              <div className="confirm-icon">⚠️</div>
              <p>{getConfirmText()}</p>
            </div>
            
            <div className="dialog-actions">
              <button 
                className="cancel-btn"
                onClick={cancelConfirmDialog}
              >
                取消
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmBatchAction}
                disabled={loading}
              >
                {loading ? '處理中...' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .batch-operations {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .batch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .selection-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .selection-count {
          color: #ffd700;
          font-weight: 600;
          font-size: 16px;
        }

        .selection-controls {
          display: flex;
          gap: 8px;
        }

        .select-btn {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #cccccc;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .select-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .select-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .batch-actions {
          border-top: 1px solid rgba(218, 165, 32, 0.3);
          padding-top: 16px;
        }

        .actions-label {
          color: #ffd700;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .actions-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .batch-action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .batch-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .batch-action-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .batch-action-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }

        .batch-action-btn.danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .batch-action-btn.danger:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }

        .batch-action-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .batch-action-btn.success:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
        }

        .batch-action-btn.warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .batch-action-btn.warning:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-1px);
        }

        .batch-action-btn.secondary {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
        }

        .batch-action-btn.secondary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
          transform: translateY(-1px);
        }

        /* 確認對話框樣式 */
        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-dialog {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #daa520;
          border-radius: 16px;
          min-width: 400px;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          border-bottom: 2px solid rgba(218, 165, 32, 0.3);
          border-radius: 14px 14px 0 0;
        }

        .dialog-header h4 {
          margin: 0;
          color: #ffd700;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #cccccc;
          cursor: pointer;
          font-size: 20px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .dialog-content {
          padding: 24px;
          text-align: center;
        }

        .confirm-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .dialog-content p {
          color: #cccccc;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid rgba(218, 165, 32, 0.2);
        }

        .cancel-btn, .confirm-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffd700;
        }

        .confirm-btn {
          background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
          color: white;
          border: 1px solid #daa520;
        }

        .confirm-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #b8860b 0%, #9a7209 100%);
          transform: translateY(-1px);
        }

        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .batch-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .selection-info {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .actions-buttons {
            flex-direction: column;
          }

          .confirm-dialog {
            min-width: auto;
            margin: 0 16px;
            max-width: calc(100vw - 32px);
          }

          .dialog-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default BatchOperations;