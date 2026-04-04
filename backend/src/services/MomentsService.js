import { query } from '../utils/db.js';

export const MomentsService = {
  async createMoment(userId, content, images = []) {
    try {
      if (!content && (!images || images.length === 0)) {
        return { code: 400, data: null, msg: '内容或图片不能为空' };
      }

      const result = await query(
        'INSERT INTO moments (user_id, content, images) VALUES (?, ?, ?)',
        [userId, content || '', JSON.stringify(images)]
      );

      if (!result || !result.insertId) {
        return { code: 500, data: null, msg: '发布失败' };
      }

      const moments = await query(
        `SELECT m.*, u.nickname, u.avatar,
         (SELECT COUNT(*) FROM moments_like WHERE moment_id = m.id) AS likes_count,
         (SELECT COUNT(*) FROM moments_comment WHERE moment_id = m.id AND deleted_at IS NULL) AS comments_count
         FROM moments m
         LEFT JOIN user u ON m.user_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      return { code: 200, data: moments[0], msg: '发布成功' };
    } catch (err) {
      console.error('createMoment error:', err);
      return { code: 200, data: null, msg: '发布失败' };
    }
  },

  async getMoments(userId, page = 1, limit = 20) {
    try {
      const safeLimit = parseInt(limit) || 20;
      const offset = (parseInt(page) - 1) * safeLimit;

      const moments = await query(
        `SELECT m.*, u.nickname, u.avatar,
         (SELECT COUNT(*) FROM moments_like WHERE moment_id = m.id) AS likes_count,
         (SELECT COUNT(*) FROM moments_comment WHERE moment_id = m.id AND deleted_at IS NULL) AS comments_count,
         EXISTS(SELECT 1 FROM moments_like WHERE moment_id = m.id AND user_id = ?) AS is_liked
         FROM moments m
         LEFT JOIN user u ON m.user_id = u.id
         WHERE m.deleted_at IS NULL
         AND (
           m.user_id = ?
           OR EXISTS(SELECT 1 FROM contact c WHERE c.user_id = ? AND c.contact_user_id = m.user_id AND c.status = 'accepted' AND c.is_friend = 1)
           OR m.user_id = ?
         )
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, userId, userId, userId, safeLimit, offset]
      );

      for (let moment of moments) {
        if (moment.images) {
          try {
            moment.images = JSON.parse(moment.images);
          } catch {
            moment.images = [];
          }
        }
        moment.is_liked = moment.is_liked === 1;
      }

      return { code: 200, data: moments, msg: '成功' };
    } catch (err) {
      console.error('getMoments error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async deleteMoment(momentId, userId) {
    try {
      const result = await query(
        'UPDATE moments SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
        [momentId, userId]
      );

      if (result.affectedRows === 0) {
        return { code: 403, data: null, msg: '无权删除' };
      }

      return { code: 200, data: null, msg: '删除成功' };
    } catch (err) {
      console.error('deleteMoment error:', err);
      return { code: 200, data: null, msg: '删除失败' };
    }
  },

  async likeMoment(momentId, userId) {
    try {
      const existing = await query(
        'SELECT id FROM moments_like WHERE moment_id = ? AND user_id = ?',
        [momentId, userId]
      );

      if (existing.length > 0) {
        await query(
          'DELETE FROM moments_like WHERE moment_id = ? AND user_id = ?',
          [momentId, userId]
        );
        await query(
          'UPDATE moments SET likes_count = likes_count - 1 WHERE id = ?',
          [momentId]
        );
        return { code: 200, data: { liked: false }, msg: '取消点赞' };
      } else {
        await query(
          'INSERT INTO moments_like (moment_id, user_id) VALUES (?, ?)',
          [momentId, userId]
        );
        await query(
          'UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?',
          [momentId]
        );
        return { code: 200, data: { liked: true }, msg: '点赞成功' };
      }
    } catch (err) {
      console.error('likeMoment error:', err);
      return { code: 200, data: null, msg: '操作失败' };
    }
  },

  async getComments(momentId) {
    try {
      const comments = await query(
        `SELECT c.*, u.nickname, u.avatar
         FROM moments_comment c
         LEFT JOIN user u ON c.user_id = u.id
         WHERE c.moment_id = ? AND c.deleted_at IS NULL
         ORDER BY c.created_at ASC`,
        [momentId]
      );

      const commentMap = {};
      const rootComments = [];
      comments.forEach(c => {
        commentMap[c.id] = { ...c, replies: [] };
      });
      comments.forEach(c => {
        if (c.parent_id) {
          commentMap[c.parent_id]?.replies.push(commentMap[c.id]);
        } else {
          rootComments.push(commentMap[c.id]);
        }
      });

      return { code: 200, data: rootComments, msg: '成功' };
    } catch (err) {
      console.error('getComments error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async addComment(momentId, userId, content, parentId = null) {
    try {
      if (!content || !content.trim()) {
        return { code: 400, data: null, msg: '评论内容不能为空' };
      }

      const result = await query(
        'INSERT INTO moments_comment (moment_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
        [momentId, userId, parentId, content]
      );

      if (!result || !result.insertId) {
        return { code: 500, data: null, msg: '评论失败' };
      }

      await query(
        'UPDATE moments SET comments_count = comments_count + 1 WHERE id = ?',
        [momentId]
      );

      const comments = await query(
        `SELECT c.*, u.nickname, u.avatar
         FROM moments_comment c
         LEFT JOIN user u ON c.user_id = u.id
         WHERE c.id = ?`,
        [result.insertId]
      );

      return { code: 200, data: comments[0], msg: '评论成功' };
    } catch (err) {
      console.error('addComment error:', err);
      return { code: 200, data: null, msg: '评论失败' };
    }
  },

  async deleteComment(commentId, userId) {
    try {
      const result = await query(
        'UPDATE moments_comment SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
        [commentId, userId]
      );

      if (result.affectedRows === 0) {
        return { code: 403, data: null, msg: '无权删除' };
      }

      return { code: 200, data: null, msg: '删除成功' };
    } catch (err) {
      console.error('deleteComment error:', err);
      return { code: 200, data: null, msg: '删除失败' };
    }
  },

  async getUserMoments(userId, currentUserId, page = 1, limit = 20) {
    try {
      const safeLimit = parseInt(limit) || 20;
      const offset = (parseInt(page) - 1) * safeLimit;

      const isFriend = await query(
        `SELECT id FROM contact
         WHERE user_id = ? AND contact_user_id = ? AND status = 'accepted' AND is_friend = 1`,
        [currentUserId, userId]
      );

      if (isFriend.length === 0 && currentUserId !== userId) {
        return { code: 403, data: [], msg: '仅好友可见' };
      }

      const moments = await query(
        `SELECT m.*, u.nickname, u.avatar,
         (SELECT COUNT(*) FROM moments_like WHERE moment_id = m.id) AS likes_count,
         (SELECT COUNT(*) FROM moments_comment WHERE moment_id = m.id AND deleted_at IS NULL) AS comments_count,
         EXISTS(SELECT 1 FROM moments_like WHERE moment_id = m.id AND user_id = ?) AS is_liked
         FROM moments m
         LEFT JOIN user u ON m.user_id = u.id
         WHERE m.user_id = ? AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [currentUserId, userId, safeLimit, offset]
      );

      for (let moment of moments) {
        if (moment.images) {
          try {
            moment.images = JSON.parse(moment.images);
          } catch {
            moment.images = [];
          }
        }
        moment.is_liked = moment.is_liked === 1;
      }

      return { code: 200, data: moments, msg: '成功' };
    } catch (err) {
      console.error('getUserMoments error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  }
};