// file: love-to-song-frontend/src/services/layoutService.ts

interface LayoutData {
  layout: Array<Object>;
  components: Array<Object>;
  userId: string | number;
  lastModified: number;
}

interface UserLayout {
  [userId: string]: LayoutData;
}

const LAYOUT_STORAGE_KEY = 'user_layouts';

// Get current user ID from localStorage (V2 auth system)
function getCurrentUserId(): string {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo);
      return user.id ? String(user.id) : 'guest';
    } catch (e) {
      return 'guest';
    }
  }
  return 'guest';
}

// Get all saved layouts from localStorage
function getAllLayouts(): UserLayout {
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved layouts:', e);
    }
  }
  return {};
}

// Save all layouts to localStorage
function saveAllLayouts(layouts: UserLayout): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    console.log('✅ 布局已保存到本地存儲');
  } catch (e) {
    console.error('Failed to save layouts:', e);
  }
}

// Fetch the saved layout for the current user
export async function getLayout(): Promise<LayoutData | null> {
  const userId = getCurrentUserId();
  const allLayouts = getAllLayouts();
  
  const userLayout = allLayouts[userId];
  if (userLayout) {
    console.log(`📋 為用戶 ${userId} 加載布局 (最後修改: ${new Date(userLayout.lastModified).toLocaleString()})`);
    return userLayout;
  }
  
  console.log(`📋 用戶 ${userId} 沒有保存的布局，使用默認布局`);
  return null;
}

// Save the current layout for the user
export async function saveLayout(layout: Array<Object>, components: Array<Object>): Promise<void> {
  const userId = getCurrentUserId();
  const allLayouts = getAllLayouts();
  
  const layoutData: LayoutData = {
    layout,
    components,
    userId,
    lastModified: Date.now()
  };
  
  allLayouts[userId] = layoutData;
  saveAllLayouts(allLayouts);
  
  console.log(`💾 用戶 ${userId} 的布局已保存 (共 ${layout.length} 個組件)`);
}

// Reset layout for current user
export async function resetLayout(): Promise<void> {
  const userId = getCurrentUserId();
  const allLayouts = getAllLayouts();
  
  if (allLayouts[userId]) {
    delete allLayouts[userId];
    saveAllLayouts(allLayouts);
    console.log(`🔄 用戶 ${userId} 的布局已重置`);
  }
}

// Get layout statistics
export function getLayoutStats(): { totalUsers: number, currentUser: string, hasLayout: boolean } {
  const userId = getCurrentUserId();
  const allLayouts = getAllLayouts();
  
  return {
    totalUsers: Object.keys(allLayouts).length,
    currentUser: userId,
    hasLayout: !!allLayouts[userId]
  };
}

// Export user-specific layouts (for debugging/backup)
export function exportUserLayouts(): UserLayout {
  return getAllLayouts();
}

// Import user layouts (for restore)
export function importUserLayouts(layouts: UserLayout): void {
  saveAllLayouts(layouts);
  console.log('📥 用戶布局已導入');
}
