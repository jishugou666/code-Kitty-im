import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Image, Send, Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { momentsApi } from '../../api/moments';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export function Moments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();

  const [moments, setMoments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishContent, setPublishContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async () => {
    setIsLoading(true);
    try {
      const response = await momentsApi.getList({ page: 1, limit: 20 });
      if (response.data.code === 200) {
        setMoments(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load moments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!publishContent.trim()) {
      toast(t('moments.contentPlaceholder'), 'warning');
      return;
    }
    setIsPublishing(true);
    try {
      const response = await momentsApi.create({ content: publishContent });
      if (response.data.code === 200) {
        setPublishContent('');
        setShowPublishModal(false);
        loadMoments();
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (momentId: number) => {
    try {
      const response = await momentsApi.like(momentId);
      if (response.data.code === 200) {
        setMoments(prev => prev.map(m =>
          m.id === momentId
            ? { ...m, is_liked: response.data.data.liked, likes_count: response.data.data.liked ? m.likes_count + 1 : m.likes_count - 1 }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleAddComment = async (momentId: number) => {
    const content = commentInputs[momentId];
    if (!content?.trim()) return;

    try {
      const response = await momentsApi.addComment(momentId, { content });
      if (response.data.code === 200) {
        setCommentInputs({ ...commentInputs, [momentId]: '' });
        loadMoments();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = async (momentId: number) => {
    try {
      const response = await momentsApi.delete(momentId);
      if (response.data.code === 200) {
        setMoments(prev => prev.filter(m => m.id !== momentId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#13161A]">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
              <ArrowLeft size={20} className="text-black dark:text-white" />
            </button>
            <h1 className="text-lg font-semibold text-black dark:text-white">{t('moments.title')}</h1>
          </div>
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 bg-[#007AFF] hover:bg-[#006CE0] text-white text-sm font-medium rounded-full transition-colors"
          >
            {t('moments.publish')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : moments.length === 0 ? (
          <div className="text-center text-black/40 dark:text-white/40 py-20">
            <p>{t('moments.noMoments')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {moments.map((moment) => (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
                    {moment.nickname?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-black dark:text-white">{moment.nickname}</h3>
                      <span className="text-xs text-black/40 dark:text-white/40">{formatTime(moment.created_at)}</span>
                    </div>
                    <p className="mt-2 text-[15px] text-black dark:text-white whitespace-pre-wrap">{moment.content}</p>

                    {moment.images && moment.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {moment.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-6">
                      <button
                        onClick={() => handleLike(moment.id)}
                        className={`flex items-center gap-1.5 text-sm ${moment.is_liked ? 'text-red-500' : 'text-black/60 dark:text-white/60'}`}
                      >
                        <Heart size={18} fill={moment.is_liked ? 'currentColor' : 'none'} />
                        <span>{moment.likes_count || 0}</span>
                      </button>
                      <button
                        onClick={() => setExpandedComments(expandedComments === moment.id ? null : moment.id)}
                        className="flex items-center gap-1.5 text-sm text-black/60 dark:text-white/60"
                      >
                        <MessageCircle size={18} />
                        <span>{moment.comments_count || 0}</span>
                      </button>
                      {moment.user_id === user?.id && (
                        <button
                          onClick={() => handleDelete(moment.id)}
                          className="ml-auto text-black/40 dark:text-white/40 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {expandedComments === moment.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder={t('moments.commentPlaceholder')}
                              value={commentInputs[moment.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [moment.id]: e.target.value })}
                              className="flex-1 h-9 px-3 bg-black/5 dark:bg-white/5 rounded-full outline-none text-sm text-black dark:text-white"
                            />
                            <button
                              onClick={() => handleAddComment(moment.id)}
                              className="px-3 h-9 bg-[#007AFF] text-white text-sm rounded-full"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPublishModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1D21] rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">{t('moments.publish')}</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-black/60 dark:text-white/60">×</button>
            </div>
            <textarea
              value={publishContent}
              onChange={(e) => setPublishContent(e.target.value)}
              placeholder={t('moments.contentPlaceholder')}
              className="w-full h-40 p-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <button className="p-2 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full">
                <Image size={20} />
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2 bg-[#007AFF] hover:bg-[#006CE0] text-white font-medium rounded-full disabled:opacity-50"
              >
                {isPublishing ? t('common.loading') : t('moments.publish')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}