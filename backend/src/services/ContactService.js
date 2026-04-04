import { query } from '../utils/db.js';

export const ContactService = {
  async addContact(userId, contactUserId) {
    if (userId === contactUserId) {
      throw new Error('Cannot add yourself as contact');
    }

    const existing = await query(
      'SELECT * FROM contact WHERE (user_id = ? AND contact_user_id = ?) OR (user_id = ? AND contact_user_id = ?)',
      [userId, contactUserId, contactUserId, userId]
    );

    if (existing.length > 0) {
      throw new Error('Contact already exists');
    }

    const result = await query(
      'INSERT INTO contact (user_id, contact_user_id, status) VALUES (?, ?, ?)',
      [userId, contactUserId, 'pending']
    );

    return { id: result.insertId, status: 'pending' };
  },

  async acceptContact(userId, contactUserId) {
    const result = await query(
      'UPDATE contact SET status = ? WHERE user_id = ? AND contact_user_id = ?',
      ['accepted', contactUserId, userId]
    );

    if (result.affectedRows === 0) {
      const reverseResult = await query(
        'UPDATE contact SET status = ? WHERE user_id = ? AND contact_user_id = ?',
        ['accepted', userId, contactUserId]
      );
      if (reverseResult.affectedRows === 0) {
        throw new Error('Contact request not found');
      }
    }
  },

  async rejectContact(userId, contactUserId) {
    await query(
      'DELETE FROM contact WHERE user_id = ? AND contact_user_id = ?',
      [userId, contactUserId]
    );
  },

  async blockContact(userId, contactUserId) {
    await query(
      'UPDATE contact SET status = ? WHERE user_id = ? AND contact_user_id = ?',
      ['blocked', userId, contactUserId]
    );
  },

  async unblockContact(userId, contactUserId) {
    await query(
      'DELETE FROM contact WHERE user_id = ? AND contact_user_id = ? AND status = ?',
      [userId, contactUserId, 'blocked']
    );
  },

  async getContactList(userId) {
    const contacts = await query(
      `SELECT u.id, u.username, u.nickname, u.avatar, u.status, c.created_at as added_at
       FROM contact c
       JOIN user u ON c.contact_user_id = u.id
       WHERE c.user_id = ? AND c.status = 'accepted'`,
      [userId]
    );
    return contacts;
  },

  async getPendingRequests(userId) {
    const requests = await query(
      `SELECT u.id, u.username, u.nickname, u.avatar, c.created_at
       FROM contact c
       JOIN user u ON c.user_id = u.id
       WHERE c.contact_user_id = ? AND c.status = 'pending'`,
      [userId]
    );
    return requests;
  },

  async deleteContact(userId, contactUserId) {
    await query(
      'DELETE FROM contact WHERE (user_id = ? AND contact_user_id = ?) OR (user_id = ? AND contact_user_id = ?)',
      [userId, contactUserId, contactUserId, userId]
    );
  }
};
