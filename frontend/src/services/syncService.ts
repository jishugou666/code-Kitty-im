import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { DeviceManager } from '../utils/deviceManager';
import { conversationApi } from '../api/conversation';
import { messageApi } from '../api/message';

export class SyncService {
  private static SYNC_INTERVAL = 30000; // 30秒同步一次
  private static syncInterval: NodeJS.Timeout | null = null;

  static startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncData();
    }, this.SYNC_INTERVAL);
  }

  static stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  static async syncData() {
    const { isAuthenticated, token } = useAuthStore.getState();
    if (!isAuthenticated || !token) return;

    try {
      // 同步会话列表
      await this.syncConversations();
      
      // 同步当前会话的消息
      const { currentConversation } = useChatStore.getState();
      if (currentConversation) {
        await this.syncMessages(currentConversation.id);
      }

      // 上报设备信息
      await this.reportDeviceInfo();
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private static async syncConversations() {
    try {
      const response = await conversationApi.getList();
      const { setConversations } = useChatStore.getState();
      if (setConversations) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Sync conversations error:', error);
    }
  }

  private static async syncMessages(conversationId: number) {
    try {
      const response = await messageApi.getMessageList(conversationId);
      const { setMessages } = useChatStore.getState();
      if (setMessages) {
        setMessages(conversationId, response.data);
      }
    } catch (error) {
      console.error('Sync messages error:', error);
    }
  }

  private static async reportDeviceInfo() {
    const { token } = useAuthStore.getState();
    if (!token) return;

    try {
      const deviceInfo = DeviceManager.getDeviceInfo();
      DeviceManager.updateLastActive();

      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceInfo
        })
      });
    } catch (error) {
      console.error('Report device info error:', error);
    }
  }

  static async forceSync() {
    await this.syncData();
  }
}
