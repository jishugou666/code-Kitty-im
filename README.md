# Code Kitty IM - 即时通讯应用

![Version](https://img.shields.io/badge/version-2.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

一款功能完整的全栈即时通讯(IM)应用，采用 React + Node.js + MySQL 技术栈构建，支持单聊、群聊、朋友圈等核心功能。

## 项目截图

<!-- 添加项目截图 -->

## 功能特性

### 用户功能
- ✅ 用户注册与登录（JWT认证）
- ✅ 用户资料管理（头像、昵称、邮箱）
- ✅ 搜索用户
- ✅ 在线状态显示
- ✅ 账户封禁系统（临时/永久封禁）
- ✅ 用户IP记录与追踪
- ✅ 已注销用户显示"账户已注销"
- ✅ 密码强度校验（至少6位字符）

### 即时通讯
- ✅ 单聊和群聊
- ✅ 实时消息收发（WebSocket + Pusher）
- ✅ 消息类型支持：文本、图片、文件
- ✅ 乐观消息发送（发送即显示，后台上传）
- ✅ 消息已读未读状态
- ✅ 历史消息加载
- ✅ 消息撤回功能（5分钟内）
- ✅ 消息转发功能

### 联系人管理
- ✅ 添加/删除联系人
- ✅ 联系人列表管理
- ✅ 联系人搜索
- ✅ 好友请求处理

### 群聊功能
- ✅ 创建群聊
- ✅ 群聊成员管理（添加/移除）
- ✅ 群聊信息展示
- ✅ 群管理员设置
- ✅ 加群申请审批
- ✅ 禁言功能（群主/管理员可禁言成员）

### 朋友圈功能
- ✅ 发布朋友圈动态
- ✅ 图片上传（最多9张，[IMG]标签嵌入）
- ✅ 点赞/取消点赞
- ✅ 评论功能
- ✅ 删除动态

### Admin后台管理
- ✅ 用户管理（查看、封禁、解封、删除）
- ✅ 会话管理
- ✅ 朋友圈管理
- ✅ 数据表查看
- ✅ SQL查询执行
- ✅ AI智能调度状态监控

### 系统设置
- ✅ 中英文切换（i18n）
- ✅ 主题切换（浅色/深色）
- ✅ 隐私设置
- ✅ 通知设置

### AI与安全
- ✅ AI智能调度（前端缓存策略）
- ✅ 后端限流保护（IP级别）
- ✅ AI反垃圾服务（已实现，待完善数据库表）
- ✅ IP封禁服务（已实现，待完善数据库表）

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI框架 |
| Vite | 6.3.5 | 构建工具 |
| TypeScript | 5.x | 类型系统 |
| TailwindCSS | 4.1.12 | CSS框架 |
| Radix UI | 1.x | 无头UI组件 |
| MUI Icons | 7.3.5 | 图标库 |
| Zustand | ^5.0.0 | 状态管理 |
| Axios | ^1.7.7 | HTTP客户端 |
| React Router | 7.13.0 | 路由管理 |
| Motion | 12.23.24 | 动画库 |
| i18next | - | 国际化 |
| Pusher JS | 8.0.0 | 实时通信 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=18 | 运行环境 |
| Express | 4.21.0 | Web框架 |
| MySQL2 | 3.11.0 | 数据库驱动 |
| bcrypt | 5.1.1 | 密码加密 |
| jsonwebtoken | 9.0.2 | JWT认证 |
| Pusher | 5.0.0 | 实时通信服务端 |
| cors | 2.8.5 | 跨域处理 |
| express-validator | 7.2.0 | 参数校验 |

### 数据库
- **类型**: MySQL 8.0+ (TiDB Cloud兼容)
- **连接池**: mysql2/promise

## 项目结构

```
CDK IM/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   │   ├── AdminController.js
│   │   │   ├── AIController.js
│   │   │   ├── ContactController.js
│   │   │   ├── ConversationController.js
│   │   │   ├── GroupController.js
│   │   │   ├── MessageController.js
│   │   │   ├── MomentsController.js
│   │   │   ├── SettingsController.js
│   │   │   ├── TempConversationController.js
│   │   │   └── UserController.js
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.js       # JWT认证
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js # 限流中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务服务
│   │   │   ├── AIService.js           # AI服务
│   │   │   ├── AIServiceManager.js    # AI服务管理器
│   │   │   ├── AdminService.js        # 管理员服务
│   │   │   ├── antiSpamService.js     # 反垃圾服务
│   │   │   ├── ContactService.js
│   │   │   ├── ConversationService.js
│   │   │   ├── GroupService.js
│   │   │   ├── IPBanService.js        # IP封禁服务
│   │   │   ├── MessageService.js
│   │   │   ├── MomentsService.js
│   │   │   ├── SettingsService.js
│   │   │   ├── TempConversationService.js
│   │   │   └── UserService.js
│   │   ├── utils/           # 工具函数
│   │   │   ├── crypto.js
│   │   │   ├── db.js
│   │   │   ├── imgbb.js
│   │   │   ├── pusher.js
│   │   │   ├── response.js
│   │   │   └── websocket.js
│   │   └── app.js           # 主入口
│   ├── .env                 # 环境变量
│   ├── init-db.js          # 数据库初始化
│   └── package.json
│
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── api/            # API封装
│   │   ├── app/            # 应用页面和组件
│   │   │   ├── components/ # 组件
│   │   │   │   ├── ui/     # UI基础组件 (40+)
│   │   │   │   ├── BanOverlay.tsx      # 封禁提示组件
│   │   │   │   ├── ChatsSidebar.tsx    # 聊天列表侧边栏
│   │   │   │   ├── ContactsSidebar.tsx  # 联系人侧边栏
│   │   │   │   ├── CreateGroupModal.tsx # 创建群组弹窗
│   │   │   │   ├── GroupInfoSidebar.tsx # 群信息侧边栏
│   │   │   │   ├── GroupSearchModal.tsx # 群搜索弹窗
│   │   │   │   ├── MainLayout.tsx       # 主布局
│   │   │   │   ├── MobileNav.tsx        # 移动端导航
│   │   │   │   ├── RateLimitOverlay.tsx  # 限流提示
│   │   │   │   └── SearchModal.tsx      # 搜索弹窗
│   │   │   └── pages/      # 页面
│   │   │       ├── Admin.tsx            # 管理后台
│   │   │       ├── Chat.tsx             # 聊天页面
│   │   │       ├── EmptyState.tsx       # 空状态
│   │   │       ├── GroupChat.tsx        # 群聊页面
│   │   │       ├── Login.tsx            # 登录页面
│   │   │       ├── Moments.tsx         # 朋友圈
│   │   │       ├── Profile.tsx          # 个人资料
│   │   │       └── Settings.tsx        # 设置页面
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── i18n/           # 国际化
│   │   ├── lib/            # 库文件
│   │   │   ├── aiScheduler.ts  # AI智能调度
│   │   │   ├── smartScheduler.ts # 智能调度器
│   │   │   └── smartApiClient.ts # 增强版API客户端
│   │   ├── store/          # 状态管理
│   │   │   ├── authStore.ts
│   │   │   ├── chatStore.ts
│   │   │   ├── contactStore.ts
│   │   │   └── smartChatStore.ts
│   │   ├── styles/         # 样式文件
│   │   └── types/          # 类型定义
│   └── package.json
│
├── database/               # 数据库脚本
│   ├── init.sql           # 初始化脚本
│   ├── clean-db.js        # 清空数据库
│   ├── migrate.js         # 迁移工具
│   ├── migrate_*.sql      # 各类迁移脚本
│   └── migrate_ban_system.sql  # 封禁系统迁移
│
├── scripts/               # 启动脚本
│   ├── start-all.bat     # Windows启动
│   ├── start-all.sh      # Unix启动
│   └── clean-db.bat      # 数据库清理
│
├── security/             # 安全文档
│   ├── test-report.md    # 安全测试报告
│   └── fix-records.md    # 漏洞修复记录
│
├── guidelines/           # 开发指南
│   └── Guidelines.md
│
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### 1. 克隆项目

```bash
git clone https://github.com/jishugou666/code-Kitty-im.git
cd code-Kitty-im
```

### 2. 配置数据库

确保 MySQL 服务正在运行，并创建数据库：

```sql
CREATE DATABASE im_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置后端

进入后端目录，复制环境变量文件并修改配置：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，修改数据库配置：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=im_chat
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 4. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 5. 初始化数据库

```bash
cd ../database
node init-db.js
```

### 6. 启动服务

**方式一：使用启动脚本**

```bash
# Windows
.\scripts\start-all.bat

# Linux/Mac
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

**方式二：手动启动**

```bash
# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm run dev
```

### 7. 访问应用

- 前端地址: http://localhost:5173
- 后端API: http://localhost:3000
- WebSocket: ws://localhost:3000/ws

## 云端部署指南

本项目支持云端部署，使用 Vercel（前端）+ Render（后端）+ TiDB Cloud（数据库）的架构。

### 部署架构

| 服务 | 平台 | 用途 |
|------|------|------|
| 前端 | Vercel | React 应用托管 |
| 后端 | Render | Node.js API 服务 |
| 数据库 | TiDB Cloud | MySQL 兼容数据库 |
| 实时通讯 | Pusher Channels | WebSocket实时推送 |

### 1. 部署后端到 Render

1. 登录 [Render](https://render.com/) 并连接你的 GitHub 仓库
2. 创建一个新的 Web Service
3. 配置以下设置：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. 添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `PORT` | 10000 |
| `DB_HOST` | 你的 TiDB Cloud 主机 |
| `DB_PORT` | 4000 |
| `DB_USER` | 你的 TiDB Cloud 用户名 |
| `DB_PASSWORD` | 你的 TiDB Cloud 密码 |
| `DB_NAME` | im_chat |
| `JWT_SECRET` | 你的 JWT 密钥（随机字符串） |
| `JWT_EXPIRES_IN` | 7d |
| `CORS_ORIGIN` | 你的 Vercel 前端地址 |
| `PUSHER_*` | Pusher 配置信息 |

5. 部署后记下后端 URL（如：`https://code-kitty-im-backend.onrender.com`）

### 2. 部署前端到 Vercel

1. 登录 [Vercel](https://vercel.com/) 并导入 GitHub 仓库
2. 配置以下设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
3. 添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | 你的 Render 后端地址 |
| `VITE_PUSHER_KEY` | Pusher Key |
| `VITE_PUSHER_CLUSTER` | Pusher Cluster |

4. 部署

### 3. 配置 TiDB Cloud 数据库

1. 登录 [TiDB Cloud](https://tidbcloud.com/)
2. 创建一个 Serverless 集群
3. 获取连接信息并填写到 Render 环境变量中
4. 在 SQL Editor 中执行初始化脚本

### 4. 执行数据库迁移

如果部署后遇到问题，需要执行以下迁移：

```bash
# 登录 TiDB Cloud SQL Editor，依次执行：
# 1. 初始化数据库
USE im_chat;
SOURCE /path/to/database/init.sql;

# 2. 执行迁移脚本（按需）
SOURCE /path/to/database/migrate_add_role.sql;
SOURCE /path/to/database/migrate_add_unique_constraints.sql;
SOURCE /path/to/database/migrate_ban_system.sql;
```

### Render 部署说明

- Render 免费套餐会自动在 15 分钟无活动后休眠
- 首次请求可能需要 30-60 秒唤醒服务
- 生产环境建议升级到付费套餐避免休眠

## API 文档

### 用户接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/user/register | 用户注册 | 否 |
| POST | /api/user/login | 用户登录 | 否 |
| GET | /api/user/profile | 获取用户资料 | 是 |
| PUT | /api/user/profile | 更新用户资料 | 是 |
| GET | /api/user/search | 搜索用户 | 是 |
| POST | /api/user/logout | 退出登录 | 是 |

### 会话接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/conversation/single | 创建单聊 | 是 |
| POST | /api/conversation/group | 创建群聊 | 是 |
| GET | /api/conversation/list | 获取会话列表 | 是 |
| GET | /api/conversation/:id | 获取会话详情 | 是 |
| GET | /api/conversation/:id/members | 获取成员列表 | 是 |
| POST | /api/conversation/:id/members | 添加成员 | 是 |
| DELETE | /api/conversation/:id/members/:userId | 移除成员 | 是 |

### 消息接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/message/send | 发送消息 | 是 |
| GET | /api/message/list | 获取消息列表 | 是 |
| GET | /api/message/search | 搜索消息 | 是 |
| POST | /api/message/read | 标记消息已读 | 是 |
| DELETE | /api/message/:messageId | 撤回消息 | 是 |

### 联系人接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/contact/list | 获取联系人列表 | 是 |
| GET | /api/contact/requests | 获取待处理请求 | 是 |
| POST | /api/contact/add | 添加联系人 | 是 |
| POST | /api/contact/accept | 接受联系人请求 | 是 |
| POST | /api/contact/reject | 拒绝联系人请求 | 是 |
| DELETE | /api/contact/:userId | 删除联系人 | 是 |

### 朋友圈接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/moments | 发布动态 | 是 |
| GET | /api/moments/list | 获取动态列表 | 是 |
| DELETE | /api/moments/:id | 删除动态 | 是 |
| POST | /api/moments/:id/like | 点赞/取消点赞 | 是 |
| GET | /api/moments/:id/comments | 获取评论列表 | 是 |
| POST | /api/moments/:id/comments | 添加评论 | 是 |
| DELETE | /api/moments/comments/:commentId | 删除评论 | 是 |

### 群组接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/group | 创建群组 | 是 |
| GET | /api/group | 获取我的群组 | 是 |
| GET | /api/group/search | 搜索群组 | 是 |
| GET | /api/group/:groupId | 获取群组信息 | 是 |
| POST | /api/group/:groupId/join | 申请加入 | 是 |
| POST | /api/group/:groupId/leave | 退出群组 | 是 |
| PUT | /api/group/:groupId/admin/:userId | 设置管理员 | 是 |
| DELETE | /api/group/:groupId/members/:userId | 移除成员 | 是 |
| GET | /api/group/:groupId/requests | 获取加群申请 | 是 |
| PUT | /api/group/:groupId/requests/:requestId | 处理加群申请 | 是 |

### 设置接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/settings | 获取设置 | 是 |
| PUT | /api/settings | 更新设置 | 是 |
| PUT | /api/settings/profile | 更新个人资料 | 是 |
| PUT | /api/settings/password | 修改密码 | 是 |

### Admin接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/admin/dashboard | 统计数据 | 是 |
| GET | /api/admin/users | 用户列表 | 是 |
| PUT | /api/admin/users/status | 更新用户状态 | 是 |
| DELETE | /api/admin/users/:userId | 删除用户 | 是 |
| GET | /api/admin/conversations | 会话列表 | 是 |
| GET | /api/admin/moments | 朋友圈列表 | 是 |
| DELETE | /api/admin/moments/:momentId | 删除朋友圈 | 是 |
| GET | /api/admin/tables | 数据表列表 | 是 |
| GET | /api/admin/tables/:tableName | 表数据 | 是 |
| POST | /api/admin/query | 执行SQL | 是 |
| GET | /api/admin/ai-stats | AI服务统计 | 是 |

## 数据库表结构

### user 用户表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| username | VARCHAR(50) | YES | | 用户名 |
| password | VARCHAR(255) | NO | | 密码哈希 |
| nickname | VARCHAR(100) | NO | | 昵称 |
| avatar | VARCHAR(500) | YES | | 头像URL |
| email | VARCHAR(100) | NO | | 邮箱 |
| phone | VARCHAR(20) | YES | | 电话 |
| role | ENUM('user','admin','tech_god') | YES | user | 角色 |
| status | TINYINT | YES | 1 | 1在线 0离线 |
| ban_status | ENUM('active','banned') | YES | active | 账户状态 |
| banned_at | TIMESTAMP | YES | | 封禁时间 |
| ban_expires_at | TIMESTAMP | YES | | 封禁到期时间 |
| ban_reason | VARCHAR(500) | YES | | 封禁原因 |
| banned_by | INT | YES | | 封禁者ID |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新时间 |

### conversation 会话表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| type | ENUM('single','group') | YES | single | 类型 |
| name | VARCHAR(100) | YES | | 群聊名称 |
| avatar | VARCHAR(500) | YES | | 群头像 |
| created_by | INT | YES | | 创建者ID |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新时间 |

### message 消息表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| conversation_id | INT | NO | | 会话ID |
| sender_id | INT | NO | | 发送者ID |
| type | ENUM('text','image','file','system') | YES | text | 类型 |
| content | TEXT | YES | | 消息内容 |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |

### group 群组表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| name | VARCHAR(100) | NO | | 群组名称 |
| description | TEXT | YES | | 群组介绍 |
| avatar | VARCHAR(500) | YES | | 群头像 |
| owner_id | INT | NO | | 群主ID |
| need_approval | TINYINT | YES | 0 | 是否需要审批 |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新时间 |

### moments 朋友圈表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| user_id | INT | NO | | 发布者ID |
| content | TEXT | YES | | 动态内容 |
| images | JSON | YES | | 图片URL数组 |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |

### user_settings 用户设置表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| user_id | INT | NO | | 用户ID |
| language | VARCHAR(10) | YES | zh-CN | 语言设置 |
| theme | VARCHAR(20) | YES | light | 主题设置 |
| notification_enabled | TINYINT | YES | 1 | 通知开启 |
| sound_enabled | TINYINT | YES | 1 | 声音开启 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新时间 |

### ip_ban IP封禁表
| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | INT | NO | | 主键 |
| ip_address | VARCHAR(45) | NO | | IP地址 |
| ban_type | ENUM('exact','range','subnet') | YES | exact | 封禁类型 |
| ban_reason | VARCHAR(500) | YES | | 封禁原因 |
| ban_by | INT | YES | | 封禁者ID |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 创建时间 |
| expires_at | TIMESTAMP | YES | | 到期时间 |
| is_active | TINYINT | YES | 1 | 是否生效 |

## 安全特性

- ✅ 密码 bcrypt 加密存储
- ✅ JWT Token 认证
- ✅ 参数化查询防止 SQL 注入
- ✅ XSS 防护（React默认转义）
- ✅ CORS 配置
- ✅ 输入验证
- ✅ 账户封禁系统
- ✅ IP记录与追踪
- ✅ AI反垃圾检测服务
- ✅ 后端限流保护（IP级别）

## 开发说明

### 前端开发

```bash
cd frontend
npm run dev    # 开发模式
npm run build  # 生产构建
```

### 后端开发

```bash
cd backend
npm run dev    # 开发模式（支持热重载）
npm start      # 生产模式
```

### 数据库开发

```bash
cd database
node init-db.js    # 初始化数据库
node migrate.js    # 运行迁移
node clean-db.js   # 清空数据库
```

## 环境变量说明

### 后端环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户名 | root |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名称 | im_chat |
| JWT_SECRET | JWT密钥 | - |
| JWT_EXPIRES_IN | Token过期时间 | 7d |
| CORS_ORIGIN | CORS允许的源 | http://localhost:5173 |
| PUSHER_APP_ID | Pusher App ID | - |
| PUSHER_KEY | Pusher Key | - |
| PUSHER_SECRET | Pusher Secret | - |
| PUSHER_CLUSTER | Pusher Cluster | - |

### 前端环境变量

| 变量名 | 描述 |
|--------|------|
| VITE_API_BASE_URL | 后端API地址 |
| VITE_PUSHER_KEY | Pusher Key |
| VITE_PUSHER_CLUSTER | Pusher Cluster |

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 核心逻辑保护声明

以下文件和代码是即时通讯核心逻辑，**禁止随意修改**：

1. `frontend/src/hooks/useWebSocket.ts` - Pusher WebSocket 实时通信核心
2. `frontend/src/store/chatStore.ts` - 聊天状态管理核心
3. `frontend/src/app/pages/Chat.tsx` - 即时通讯页面核心逻辑
4. `backend/src/services/MessageService.js` - 消息服务核心
5. `backend/src/services/ConversationService.js` - 会话服务核心
6. `backend/src/utils/pusher.js` - Pusher 广播工具

**如需修改即时通讯相关功能，必须：**
- 先备份原文件
- 通知团队成员
- 修改后进行全面测试
- 确保不影响 Pusher 实时推送功能

## 代码编写规范

1. **所有接口必须加 try-catch，绝不返回 500**
2. **所有返回格式统一 `{ code, data, msg }`**
3. **所有 SQL 避免 SELECT *，使用明确字段**
4. **所有跨域支持线上域名，不写死 localhost**
5. **所有前端地址从 `import.meta.env` 读取**
6. **MySQL2 分页必须用 `LIMIT ${num} OFFSET ${num}` 拼接，禁止占位符 `?`**
7. **前端调用 API 后，响应拦截器已返回 `{ code, data, msg }`，直接用 `response.code` 判断**

## 项目文档

| 文档 | 路径 | 说明 |
|------|------|------|
| README | README.md | 项目主文档 |
| 项目报告 | PROJECT_REPORT.md | 项目详细报告 |
| 记忆文档 | IM_Chat_AI_Memory.md | AI编程记忆 |
| 修改报告 | MODIFICATION_REPORT_v2.md | v2更新记录 |
| 开发计划 | DEVELOPMENT_PLAN.md | 下一步开发计划 |
| 安全报告 | security/test-report.md | 安全测试 |
| 修复记录 | security/fix-records.md | 漏洞修复 |
| 开发指南 | guidelines/Guidelines.md | 开发规范 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## License

MIT License - 详见 [ATTRIBUTIONS.md](ATTRIBUTIONS.md)

## 致谢

- 基于 Figma [IM Chat App UI Design](https://www.figma.com/design/TqtOpBvGH9HfmpAsgBlkGj/IM-Chat-App-UI-Design) 构建
- UI 组件来自 [shadcn/ui](https://ui.shadcn.com/)
- 图标来自 [MUI Icons](https://mui.com/material-ui/material-icons/)

---

**版本**: v2.0.1
**更新日期**: 2026-04-18
