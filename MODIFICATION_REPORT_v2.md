# IM Chat App 修改报告 v2

## 📅 更新日期：2026-04-04

---

## 一、已完成的功能

### 1. ✅ 国际化 (i18n)
- 安装 i18next + react-i18next
- 创建 `src/i18n/index.ts` 配置文件
- 创建中文翻译文件 `src/i18n/locales/zh-CN.json`
- 创建英文翻译文件 `src/i18n/locales/en-US.json`
- 默认中文，支持中英文切换

### 2. ✅ 联系人页面优化
- 好友申请显示在消息框位置
- 搜索功能改为高斯模糊弹窗
- 创建 `src/app/components/SearchModal.tsx` 搜索弹窗组件
- 修改 `src/app/components/ContactsSidebar.tsx` 联系人侧边栏

### 3. ✅ 朋友圈功能
- 后端 API：
  - `MomentsService.js` - 服务层
  - `MomentsController.js` - 控制器
  - `routes/moments.js` - 路由
- 前端：
  - `src/api/moments.ts` - API 客户端
  - `src/app/pages/Moments.tsx` - 朋友圈页面

### 4. ✅ 设置页面
- 后端：
  - `SettingsService.js` - 设置服务
  - `SettingsController.js` - 设置控制器
  - `routes/settings.js` - 设置路由
- 前端：
  - `src/api/settings.ts` - API 客户端
  - `src/app/pages/Settings.tsx` - 设置页面

### 5. ✅ Admin 后台
- 后端：
  - `AdminService.js` - 管理服务
  - `AdminController.js` - 管理控制器
  - `routes/admin.js` - 管理路由
- 前端：
  - `src/api/admin.ts` - API 客户端
  - `src/app/pages/Admin.tsx` - Admin 页面

### 6. ✅ 左侧菜单栏更新
- 添加朋友圈按钮 (Globe 图标)
- Admin 按钮（仅对邮箱 3121601311@qq.com 显示）

### 7. ✅ 前端路由更新
- 添加 `/settings` 路由
- 添加 `/moments` 路由
- 添加 `/admin` 路由

---

## 二、数据库迁移 SQL

在 TiDB Cloud 执行以下 SQL：

```sql
-- 1. 朋友圈动态表
CREATE TABLE IF NOT EXISTS `moments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '发布者用户ID',
  `content` TEXT COMMENT '动态内容',
  `images` JSON COMMENT '图片URL数组',
  `likes_count` INT DEFAULT 0 COMMENT '点赞数',
  `comments_count` INT DEFAULT 0 COMMENT '评论数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL COMMENT '软删除时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 朋友圈点赞表
CREATE TABLE IF NOT EXISTS `moments_like` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moment_id` INT NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '点赞用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`),
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 朋友圈评论表
CREATE TABLE IF NOT EXISTS `moments_comment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moment_id` INT NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '评论用户ID',
  `parent_id` INT NULL COMMENT '父评论ID（用于回复）',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL COMMENT '软删除时间',
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 用户设置表
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE COMMENT '用户ID',
  `language` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言设置 zh-CN/en-US',
  `theme` VARCHAR(20) DEFAULT 'light' COMMENT '主题设置 light/dark',
  `privacy_mode` TINYINT DEFAULT 0 COMMENT '隐私模式 0关闭 1开启',
  `notification_sound` TINYINT DEFAULT 1 COMMENT '通知声音 0关闭 1开启',
  `notification_push` TINYINT DEFAULT 1 COMMENT '推送通知 0关闭 1开启',
  `show_online_status` TINYINT DEFAULT 1 COMMENT '显示在线状态 0关闭 1开启',
  `allow_stranger_msg` TINYINT DEFAULT 1 COMMENT '允许陌生人消息 0关闭 1开启',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 管理员操作日志表
CREATE TABLE IF NOT EXISTS `admin_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL COMMENT '管理员ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) COMMENT '目标类型 user/message/moment',
  `target_id` INT COMMENT '目标ID',
  `details` JSON COMMENT '操作详情',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 临时会话记录表
CREATE TABLE IF NOT EXISTS `temp_conversation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL COMMENT '会话ID',
  `user_id` INT NOT NULL COMMENT '发起方用户ID',
  `target_user_id` INT NOT NULL COMMENT '目标用户ID',
  `is_blocked` TINYINT DEFAULT 0 COMMENT '是否被封禁',
  `warning_count` INT DEFAULT 0 COMMENT '警告次数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL COMMENT '过期时间',
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_target_user_id` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 好友关系增强表（添加字段）
ALTER TABLE `contact` ADD COLUMN `is_friend` TINYINT DEFAULT 0 COMMENT '是否为好友 0否 1是';
ALTER TABLE `contact` ADD COLUMN `friend_time` TIMESTAMP NULL COMMENT '成为好友时间';
```

---

## 三、新增 API 端点

### 朋友圈 API (`/api/moments`)
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/` | 发布朋友圈动态 |
| GET | `/list` | 获取朋友圈列表 |
| DELETE | `/:id` | 删除动态 |
| POST | `/:id/like` | 点赞/取消点赞 |
| GET | `/:id/comments` | 获取评论列表 |
| POST | `/:id/comments` | 添加评论 |
| DELETE | `/comments/:commentId` | 删除评论 |
| GET | `/user/:userId` | 获取用户朋友圈 |

### 设置 API (`/api/settings`)
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 获取用户设置 |
| PUT | `/` | 更新设置 |
| PUT | `/profile` | 更新个人资料 |
| PUT | `/password` | 修改密码 |

### Admin API (`/api/admin`)
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/dashboard` | 获取统计数据 |
| GET | `/users` | 用户列表 |
| PUT | `/users/status` | 更新用户状态 |
| DELETE | `/users/:userId` | 删除用户 |
| GET | `/conversations` | 会话列表 |
| GET | `/conversations/:id/messages` | 会话消息 |
| GET | `/moments` | 朋友圈列表 |
| DELETE | `/moments/:momentId` | 删除朋友圈 |
| GET | `/tables` | 数据表列表 |
| GET | `/tables/:tableName` | 表数据 |
| POST | `/query` | 执行 SQL 查询 |

---

## 四、环境变量配置

### 后端 Render 环境变量
```env
PUSHER_APP_ID=2136881
PUSHER_KEY=c83b4566e58d78c1dd50
PUSHER_SECRET=ed4de7ef1448ce39c28e
PUSHER_CLUSTER=ap1
PUSHER_ENCRYPTED=true
```

### 前端 Vercel 环境变量
```env
VITE_API_BASE_URL=https://code-kitty-im-backend.onrender.com/api
VITE_PUSHER_KEY=c83b4566e58d78c1dd50
VITE_PUSHER_CLUSTER=ap1
```

---

## 五、部署步骤

### 1. 数据库迁移
在 TiDB Cloud SQL Editor 中执行上述 SQL

### 2. 后端部署
```bash
cd backend
git add .
git commit -m "feat: 完整功能更新 v2"
git push origin main
# Render 会自动部署
```

### 3. 前端部署
```bash
cd frontend
git add .
git commit -m "feat: 完整功能更新 v2"
git push origin main
# Vercel 会自动部署
```

---

## 六、注意事项

### ⚠️ 核心逻辑保护
以下文件是即时通讯核心逻辑，**禁止修改**：
1. `frontend/src/hooks/useWebSocket.ts` - Pusher WebSocket 核心
2. `frontend/src/store/chatStore.ts` - 聊天状态管理核心
3. `frontend/src/app/pages/Chat.tsx` - 即时通讯页面核心
4. `backend/src/services/MessageService.js` - 消息服务核心
5. `backend/src/services/ConversationService.js` - 会话服务核心
6. `backend/src/utils/pusher.js` - Pusher 广播工具

### ⚠️ 临时会话功能（待完善）
临时会话功能（警告标签、反诈提示）尚未完全实现，需要后续开发：
- 数据库已有 `temp_conversation` 表
- 需要在 Chat.tsx 中添加判断逻辑
- 需要添加警告弹窗

---

## 七、后续开发计划

1. 临时会话功能完善
2. 消息已读状态同步
3. 表情包功能
4. 文件传输功能
5. 语音/视频通话（需要第三方服务）
