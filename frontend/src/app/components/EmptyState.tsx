import { motion } from 'motion/react';
import { MessageSquare, Users, UserPlus } from 'lucide-react';

interface EmptyStateProps {
  type: 'noMessages' | 'noConversation' | 'noContacts' | 'noSearchResults';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const config = {
  noMessages: {
    icon: MessageSquare,
    title: '暂无消息',
    description: '发送一条消息开始聊天吧',
    gradient: 'from-blue-500 to-blue-600'
  },
  noConversation: {
    icon: Users,
    title: '暂无会话',
    description: '从联系人列表中选择一个开始聊天',
    gradient: 'from-green-500 to-green-600'
  },
  noContacts: {
    icon: UserPlus,
    title: '暂无联系人',
    description: '搜索用户并添加为好友',
    gradient: 'from-purple-500 to-purple-600'
  },
  noSearchResults: {
    icon: MessageSquare,
    title: '未找到结果',
    description: '尝试使用不同的关键词搜索',
    gradient: 'from-gray-500 to-gray-600'
  }
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const item = config[type];
  const displayTitle = title || item.title;
  const displayDesc = description || item.description;
  const Icon = item.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg`}>
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        {displayDesc}
      </p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-sm"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
