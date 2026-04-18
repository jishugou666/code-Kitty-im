import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { query } from '../utils/db.js';

const router = Router();

router.use(authMiddleware);

router.post('/single', ConversationController.createSingle);
router.post('/group', ConversationController.createGroup);
router.get('/list', ConversationController.getList);
router.get('/:id', ConversationController.getConversation);
router.get('/:id/members', ConversationController.getMembers);
router.post('/:id/members', ConversationController.addMembers);
router.delete('/:id/members/:userId', ConversationController.removeMember);

router.get('/debug/all', async (req, res) => {
  try {
    const userId = req.userId;
    console.log('[Debug] Checking all conversations for userId:', userId);

    const directQuery = await query(
      `SELECT c.id, c.type, c.name, c.updated_at,
       (SELECT COUNT(*) FROM conversation_member cm WHERE cm.conversation_id = c.id) as member_count,
       (SELECT MAX(created_at) FROM message m WHERE m.conversation_id = c.id) as last_message_time
       FROM conversation c
       WHERE EXISTS (SELECT 1 FROM conversation_member cm WHERE cm.conversation_id = c.id AND cm.user_id = ?)
       ORDER BY last_message_time DESC`,
      [userId]
    );

    console.log('[Debug] Direct query result:', directQuery);

    res.json({ code: 200, data: directQuery, msg: 'ok' });
  } catch (err) {
    console.error('[Debug] Error:', err);
    res.status(500).json({ code: 500, data: null, msg: err.message });
  }
});

export default router;
