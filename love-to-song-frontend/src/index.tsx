import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 添加全局錯誤捕獲
window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.error, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[UNHANDLED PROMISE REJECTION]', e.reason);
});

// 調試用：顯示當前的認證狀態
console.log('[DEBUG] Current token:', localStorage.getItem('token'));
console.log('[DEBUG] Current userInfo:', localStorage.getItem('userInfo'));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
