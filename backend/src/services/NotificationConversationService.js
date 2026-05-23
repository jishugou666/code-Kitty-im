import { query } from '../utils/db.js';

const NotificationConversationService = {
  async getOrCreateNotificationConversation() {
    let [conv] = await query("SELECT * FROM conversation WHERE type = 'notification' LIMIT 1");
    if (!conv) {
      await query("INSERT INTO conversation (type, name, created_at) VALUES ('notification', '系统通知', NOW())");
      [conv] = await query("SELECT * FROM conversation WHERE type = 'notification' LIMIT 1");
    }
    return conv;
  },

  async getNotifications() {
    const results = await query(
      "SELECT * FROM system_notification WHERE is_active = 1 ORDER BY created_at DESC"
    );
    return results;
  },

  async getFullNotificationConversation(userId) {
    const conv = await this.getOrCreateNotificationConversation();
    const [member] = await query(
      "SELECT * FROM conversation_member WHERE conversation_id = ? AND user_id = ?",
      [conv.id, userId]
    );
    if (!member) {
      await query(
        "INSERT INTO conversation_member (conversation_id, user_id, role, joined_at) VALUES (?, ?, 'member', NOW())",
        [conv.id, userId]
      );
    }
    const notifications = await this.getNotifications();
    const latestNotif = notifications[0] || null;
    return {
      ...conv,
      notifications,
      last_message: latestNotif?.title || null,
      last_message_time: latestNotif?.created_at || null,
      unread_count: notifications.length
    };
  }
};

export default NotificationConversationService;
