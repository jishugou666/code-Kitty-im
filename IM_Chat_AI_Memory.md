# IM_Chat_AI_Memory.md

## 项目基础信息

### 项目概述
- **项目名称**: IM Chat App - 即时通讯全栈项目
- **项目路径**: d:\Desktop\CDK IM
- **UI设计文件来源**: 基于 Figma 设计的 IM Chat App UI

### 技术栈
| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端框架 | React + Vite | 18.3.1 / 6.3.5 |
| 前端UI | TailwindCSS + radix-ui + MUI | 4.1.12 / 7.3.5 |
| 后端框架 | Node.js + Express | Express 4.21.0 |
| 数据库 | MySQL | 8.0+ |
| 实时通讯 | Pusher Channels | 第三方WebSocket服务 |
| 认证 | JWT | 9.0.2 |
| 状态管理 | Zustand | 5.0.0 |
| HTTP客户端 | Axios | 1.7.7 |

### 核心业务场景
1. 用户注册/登录（JWT认证）
2. 即时消息收发（实时+历史消息）
3. 会话管理（单聊/群聊）
4. 联系人管理
5. 用户资料管理

### 部署环境（重要 - 永久遵守）
| 服务 | 平台 | 说明 |
|------|------|------|
| 前端 | Vercel | SPA应用，需支持跨域、环境变量 |
| 后端 | Render | Node.js + Express，会休眠需稳定异常捕获 |
| 数据库 | TiDB Cloud | MySQL兼容，严格字段约束 |
| 实时通信 | Pusher Channels | 第三方WebSocket服务，解决Render休眠问题 |

### Pusher 配置（重要 - 永久保存）
| 变量 | 值 |
|------|-----|
| APP_ID | 2136881 |
| KEY | c83b4566e58d78c1dd50 |
| SECRET | ed4de7ef1448ce39c28e |
| CLUSTER | ap1 |
| ENCRYPTED | true |

### 线上服务地址
| 服务 | 地址 |
|------|------|
| 后端 API | https://code-kitty-im-backend.onrender.com |
| 前端 | https://code-kitty-im-frontend.vercel.app (推测) |

### 代码编写铁律（永久遵守）
1. **所有接口必须加 try-catch，绝不返回 500**
2. **所有返回格式统一 `{ code, data, msg }`**
3. **所有 SQL 避免 SELECT *，使用明确字段**
4. **所有跨域支持线上域名，不写死 localhost**
5. **所有前端地址从 `import.meta.env` 读取**
6. **MySQL2 分页必须用 `LIMIT ${num} OFFSET ${num}` 拼接，禁止占位符 `?`**
7. **前端调用 API 后，响应拦截器已返回 `{ code, data, msg }`，直接用 `response.code` 判断，不要再加 `.data`**

### ⚠️ 核心逻辑保护声明（绝对禁止修改）

以下文件和代码是即时通讯核心逻辑，**禁止修改**：
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

---

## 历史任务日志

### 任务1: 项目初始化与目录结构建设
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建 IM_Chat_AI_Memory.md 记忆文档
  - 重新组织项目目录结构（frontend/backend/database/scripts/security）
  - 迁移现有 UI 文件到 frontend 目录
- **执行结果**: ✅ 完成
- **代码改动关键点**:
  - 创建目录: frontend/src, backend/src, database/, scripts/, security/
  - 迁移文件: package.json, vite.config.ts, index.html, src/ → frontend/src/
- **问题与修复**: 无

### 任务2: 后端 Node.js + Express 项目创建
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建后端完整项目结构和代码
  - 实现用户、消息、会话、联系人等核心服务
  - 配置 JWT 认证和密码加密
- **执行结果**: ✅ 完成
- **代码改动关键点**:
  - 创建 backend/src/config/index.js - 配置文件
  - 创建 backend/src/utils/db.js - 数据库工具
  - 创建 backend/src/utils/crypto.js - 加密工具
  - 创建 backend/src/utils/response.js - 响应处理
  - 创建 backend/src/utils/websocket.js - WebSocket 处理
  - 创建 backend/src/middleware/auth.js - 认证中间件
  - 创建 backend/src/middleware/errorHandler.js - 错误处理
  - 创建 backend/src/models/*.js - 数据模型
  - 创建 backend/src/services/*.js - 业务服务层
  - 创建 backend/src/controllers/*.js - 控制器
  - 创建 backend/src/routes/*.js - 路由定义
  - 创建 backend/src/app.js - 主入口
- **接口/数据库变更**:
  - 新增用户注册/登录/资料接口
  - 新增会话CRUD接口
  - 新增消息收发接口
  - 新增联系人管理接口
- **测试结果**: ✅ 基础功能已实现
- **新发现问题**: 需安装 npm 依赖

### 任务3: 数据库初始化脚本创建
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建 database/init.sql 建表脚本
  - 创建 database/clean-db.js 清空数据库脚本
  - 创建 database/migrate.js 数据库迁移脚本
- **执行结果**: ✅ 完成
- **代码改动关键点**:
  - 创建 database/init.sql - 完整建表语句
  - 创建 database/clean-db.js - 带二次确认的清理脚本
  - 创建 database/migrate.js - 数据库迁移工具

### 任务4: 前端 API 封装和状态管理
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建前端 API 封装层（axios + 拦截器）
  - 创建 Zustand 状态管理 stores
  - 创建 WebSocket Hook
  - 更新 Login 页面集成真实认证
- **执行结果**: ✅ 完成
- **代码改动关键点**:
  - 创建 frontend/src/api/client.ts - axios 封装
  - 创建 frontend/src/api/user.ts - 用户 API
  - 创建 frontend/src/api/conversation.ts - 会话 API
  - 创建 frontend/src/api/message.ts - 消息 API
  - 创建 frontend/src/api/contact.ts - 联系人 API
  - 创建 frontend/src/store/authStore.ts - 认证状态
  - 创建 frontend/src/store/chatStore.ts - 聊天状态
  - 创建 frontend/src/store/contactStore.ts - 联系人状态
  - 创建 frontend/src/hooks/useWebSocket.ts - WebSocket Hook
  - 创建 frontend/src/types/index.ts - TypeScript 类型
  - 更新 frontend/src/app/pages/Login.tsx - 集成认证

### 任务5: 一键启动脚本开发
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建 scripts/start-all.bat (Windows)
  - 创建 scripts/start-all.sh (Linux/Mac)
  - 创建 scripts/clean-db.bat (数据库清理)
- **执行结果**: ✅ 完成

### 任务6: 安全测试与文档
- **执行时间**: 2026-04-04
- **任务内容**:
  - 创建 security/test-report.md 安全测试报告
  - 创建 security/fix-records.md 漏洞修复记录
- **执行结果**: ✅ 完成

### 任务7: UI优化与问题修复
- **执行时间**: 2026-04-04
- **任务内容**:
  - 修复左侧菜单栏底部用户头像显示真实头像（使用useAuthStore中的user数据）
  - 添加页面切换过渡动画（使用framer-motion的AnimatePresence）
  - 将系统alert/confirm弹窗替换为自定义毛玻璃模态框
- **代码改动关键点**:
  - 修改 frontend/src/app/components/MainLayout.tsx - 用户头像和过渡动画
  - 创建 frontend/src/hooks/useConfirmDialog.tsx - 确认对话框Hook
  - 创建 frontend/src/hooks/useToast.tsx - Toast通知Hook
  - 修改 frontend/src/app/pages/Profile.tsx - 使用自定义对话框和Toast
  - 修改 frontend/src/app/pages/Chat.tsx - 使用Toast通知
  - 修改 frontend/src/app/components/ContactsSidebar.tsx - 使用Toast通知
- **执行结果**: ✅ 完成

### 任务8: 项目配置与部署
- **执行时间**: 2026-04-04
- **任务内容**:
  - 添加 SSL 配置到数据库连接（TiDB 等云数据库需要）
  - 修改 frontend/src/api/client.ts 使用环境变量 VITE_API_BASE_URL
  - 创建 frontend/.env.example 环境变量示例
  - 创建 frontend/vercel.json Vercel 部署配置
  - 创建 .gitignore 文件
  - 初始化 Git 仓库
- **代码改动关键点**:
  - 修改 backend/src/utils/db.js - 添加 SSL 配置
  - 修改 frontend/src/api/client.ts - baseURL 使用环境变量
  - 创建 frontend/.env.example
  - 创建 frontend/vercel.json
  - 创建 .gitignore
- **执行结果**: ✅ 完成

### 任务9: UI问题修复与功能增强
- **执行时间**: 2026-04-04
- **任务内容**:
  - 修复联系人添加按钮弹窗功能
  - 修改注册功能：昵称+邮箱+密码
  - 修改登录功能：支持昵称/邮箱+密码双要素
  - 添加用户权限管理（user/admin/tech_god）
- **代码改动关键点**:
  - 修改 frontend/src/app/components/ContactsSidebar.tsx - 修复添加联系人按钮
  - 修改 frontend/src/app/pages/Login.tsx - 更新注册/登录表单
  - 修改 frontend/src/api/user.ts - 更新类型定义
  - 修改 backend/src/controllers/UserController.js - 更新注册/登录接口
  - 修改 backend/src/services/UserService.js - 更新业务逻辑
  - 修改 database/init.sql - 更新表结构
  - 创建 database/migrate_add_role.sql - 权限管理迁移脚本
- **执行结果**: ✅ 完成

### 任务10: 云端部署配置
- **执行时间**: 2026-04-04
- **任务内容**:
  - 更新 README.md 添加云端部署指南
  - 配置 Vercel + Render + TiDB Cloud 部署架构
- **部署架构**:
  - 前端: Vercel (React/Vite)
  - 后端: Render (Node.js/Express)
  - 数据库: TiDB Cloud (MySQL)
- **代码改动关键点**:
  - 修改 README.md - 添加完整的云端部署文档
- **执行结果**: ✅ 完成

### 任务11: 修复注册500错误
- **执行时间**: 2026-04-04
- **问题描述**:
  - 云端部署后注册接口返回 500 Internal Server Error
  - 原因：数据库缺少 role 字段
- **修复内容**:
  - 修改 backend/src/services/UserService.js - 移除 INSERT 语句中的 role 字段（依赖数据库默认值）
- **执行结果**: ✅ 完成

### 任务12: 修复发送消息500错误
- **执行时间**: 2026-04-04
- **问题描述**:
  - POST /api/message/send 返回 500
  - 原因：sendMessage 捕获异常后 throw err 导致500
- **修复内容**:
  - 修改 backend/src/services/MessageService.js - sendMessage 改为返回错误格式而非抛出异常
  - 所有方法确保返回 `{ code, data, msg }` 格式
- **执行结果**: ✅ 完成

### 任务13: 完整功能更新 v2
- **执行时间**: 2026-04-04
- **任务内容**:
  - i18n 国际化（中英文切换）
  - 联系人页面优化（好友申请显示、搜索弹窗化）
  - 朋友圈功能开发（动态发布、点赞、评论）
  - 设置页面功能完善
  - Admin 后台开发（用户管理、聊天管理、数据表管理）
  - 左侧菜单栏添加朋友圈和 Admin 按钮
- **新增文件**:
  - frontend/src/i18n/index.ts - i18n 配置
  - frontend/src/i18n/locales/zh-CN.json - 中文翻译
  - frontend/src/i18n/locales/en-US.json - 英文翻译
  - frontend/src/api/moments.ts - 朋友圈 API
  - frontend/src/api/settings.ts - 设置 API
  - frontend/src/api/admin.ts - Admin API
  - frontend/src/app/pages/Moments.tsx - 朋友圈页面
  - frontend/src/app/pages/Settings.tsx - 设置页面
  - frontend/src/app/pages/Admin.tsx - Admin 页面
  - frontend/src/app/components/SearchModal.tsx - 搜索弹窗组件
  - backend/src/services/MomentsService.js - 朋友圈服务
  - backend/src/services/SettingsService.js - 设置服务
  - backend/src/services/AdminService.js - Admin 服务
  - backend/src/controllers/MomentsController.js
  - backend/src/controllers/SettingsController.js
  - backend/src/controllers/AdminController.js
  - backend/src/routes/moments.js
  - backend/src/routes/settings.js
  - backend/src/routes/admin.js
  - database/migrate_v2_features.sql - 新功能数据库迁移
- **修改文件**:
  - frontend/src/app/components/MainLayout.tsx - 添加朋友圈和 Admin 按钮
  - frontend/src/app/routes.tsx - 添加新路由
  - frontend/src/app/components/ContactsSidebar.tsx - 优化好友申请显示
  - backend/src/app.js - 注册新路由
- **数据库变更**: 执行 database/migrate_v2_features.sql
- **执行结果**: ✅ 完成

### 任务14: 群组功能开发
- **执行时间**: 2026-04-05
- **任务内容**:
  - 群组创建功能（群名称、介绍、成员选择、审核开关）
  - 群组搜索功能
  - 群申请消息通知
  - 群聊界面侧边栏（成员列表、身份标签、管理功能）
  - Admin 后台群组管理
- **新增文件**:
  - `frontend/src/api/group.ts` - 群组 API
  - `frontend/src/app/components/CreateGroupModal.tsx` - 创建群组弹窗
  - `frontend/src/app/components/GroupSearchModal.tsx` - 搜索群组弹窗
  - `frontend/src/app/components/GroupInfoSidebar.tsx` - 群信息侧边栏
  - `backend/src/services/GroupService.js` - 群组服务
  - `backend/src/controllers/GroupController.js` - 群组控制器
  - `backend/src/routes/group.js` - 群组路由
- **修改文件**:
  - `frontend/src/app/components/ChatsSidebar.tsx` - 添加创建群组按钮
  - `frontend/src/app/components/ContactsSidebar.tsx` - 添加群搜索、群申请、我的群组
  - `frontend/src/app/pages/Chat.tsx` - 集成群信息侧边栏
  - `frontend/src/app/pages/Admin.tsx` - 添加群组管理 Tab
  - `backend/src/services/GroupService.js` - 修复群组与会话关联（group.id = conversation.id）
- **数据库变更**:
  - `group` 表：群组基本信息
  - `group_member` 表：群组成员
  - `group_join_request` 表：加群申请
- **重要修复**: `GroupService.createGroup` 先创建 conversation 获取 ID，然后用该 ID 作为 group.id，确保群组能显示在消息列表
- **执行结果**: ✅ 完成

### 任务15: BUG修复与功能完善
- **执行时间**: 2026-04-05
- **任务内容**:
  - BUG-01: 修复 useGlobalWebSocket user 未定义（实时通知失效）
  - BUG-02: Pusher 密钥硬编码改为环境变量
  - OPT-01: 移除生产环境 console.log
  - F-01: 主题切换功能
  - F-02: 隐私设置功能
  - F-03: 关于页面
  - F-04: Moments 图片上传功能
  - F-05: 消息撤回功能（5分钟内可撤回）
  - F-06: 消息转发功能
- **代码改动关键点**:
  - frontend/src/hooks/useWebSocket.ts - 修复 user 引用，移除硬编码 Pusher Key
  - frontend/src/app/pages/Settings.tsx - 添加主题切换、隐私设置、关于页面
  - frontend/src/app/pages/Moments.tsx - 添加图片上传功能
  - frontend/src/app/pages/Chat.tsx - 添加消息撤回/转发菜单
  - backend/src/services/MessageService.js - 添加 recallMessage 方法
  - backend/src/controllers/MessageController.js - 添加 recallMessage 端点
  - backend/src/routes/message.js - 添加 DELETE /:messageId 路由
- **API 变更**:
  - DELETE /api/message/:messageId - 撤回消息
- **环境变量更新**:
  - .env.example 中 Pusher 配置改为 placeholder 值
- **执行结果**: ✅ 完成

### 任务16: 移动端适配与UI优化
- **执行时间**: 2026-04-05
- **任务内容**:
  - 移动端布局全面适配（消息列表直接显示、聊天界面隐藏底部导航）
  - 灵动岛风格底部导航栏（胶囊状毛玻璃高斯模糊效果）
  - 移动端输入区域优化（按钮尺寸、间距、触控体验）
  - 群聊输入框移动端适配
  - 所有默认头像统一改为蓝紫渐变样式
- **代码改动关键点**:
  - `frontend/src/app/components/MobileNav.tsx` - 灵动岛导航栏（rounded-full胶囊、backdrop-blur-xl毛玻璃、bg-white/70半透明）
  - `frontend/src/app/pages/Chat.tsx` - 输入区域优化（px-3 py-2.5、按钮p-2.5、发送按钮w-11 h-11）
  - `frontend/src/app/pages/GroupChat.tsx` - 引入useIsMobile hook、输入框移动端适配
  - `frontend/src/app/pages/Moments.tsx` - 头像改为蓝紫渐变
  - `frontend/src/app/pages/Settings.tsx` - 头像改为蓝紫渐变
  - `frontend/src/app/pages/Profile.tsx` - 头像改为蓝紫渐变
  - `frontend/src/app/components/ChatsSidebar.tsx` - 头像改为蓝紫渐变
  - `frontend/src/app/components/ContactsSidebar.tsx` - 头像改为蓝紫渐变（2处）
  - `frontend/src/app/components/SearchModal.tsx` - 头像改为蓝紫渐变
- **UI设计规范**:
  - 灵动岛导航: `rounded-full` + `backdrop-blur-xl` + `bg-white/70` + `shadow`
  - 移动端按钮最小触控: `p-2.5` (10px触控区域)
  - 移动端输入框: `h-11` + `text-[15px]`
  - 默认头像渐变: `bg-gradient-to-br from-[#007AFF] to-[#5856D6]`
- **执行结果**: ✅ 完成

---

## 重要问题修复记录

### 问题: 注册逻辑缺少唯一性检查
- **发现时间**: 2026-04-05
- **问题描述**: 用户使用重复的昵称或邮箱能够成功注册，破坏了数据的唯一性约束
- **原因分析**:
  1. 数据库 `user` 表中 `email` 和 `nickname` 字段缺少 `UNIQUE` 约束
  2. 后端 `UserService.register` 只检查了 email 是否存在，未检查 nickname
- **修复内容**:
  1. 修改数据库 `init-db.js` 和 `clean-db.js`：为 `email` 和 `nickname` 添加 `UNIQUE` 约束
  2. 修改 `backend/src/services/UserService.js`：同时检查 email 和 nickname 的存在性
  3. 修改 `backend/src/controllers/UserController.js`：添加 nickname 重复的 409 错误处理
- **新增文件**:
  - `database/migrate_add_unique_constraints.sql` - 线上数据库迁移脚本
- **状态**: ✅ 已修复

### 问题: 加好友请求返回409错误
- **发现时间**: 2026-04-05
- **问题描述**: 用户点击添加好友时收到 "Request failed with status code 409" 错误
- **原因分析**: 409表示请求冲突，尝试添加的联系人已经存在（已经是好友关系）
- **解决方案**: 这是正常的业务逻辑返回，需要前端做好友好提示，而非真正的BUG
- **建议改进**: 前端应检查好友关系后再显示添加按钮，避免用户重复点击
- **状态**: ✅ 已向用户解释说明

---

## UI设计规范（重要）

### 移动端设计规范
| 元素 | 样式 | 说明 |
|------|------|------|
| 底部导航栏 | `rounded-full` + `backdrop-blur-xl` + `bg-white/70` | 灵动岛胶囊毛玻璃效果 |
| 导航阴影 | `shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1)]` | 多层阴影营造浮起感 |
| 按钮触控区 | `p-2.5` (10px) | 最小触控区域 |
| 输入框高度 | `h-11` | 适合触控的高度 |
| 输入框字体 | `text-[15px]` | 清晰的文字大小 |
| 间距 | `gap-2` / `px-3 py-2.5` | 舒适的间距 |

### 默认头像样式
```tsx
// 蓝紫渐变头像
className="bg-gradient-to-br from-[#007AFF] to-[#5856D6]"
```
- 用于：消息列表、联系人列表、搜索结果、个人资料、朋友圈、设置页
- 只有用户自定义头像才显示真实图片

### 主题色
| 用途 | 色值 |
|------|------|
| 主色 | `#007AFF` (iOS Blue) |
| 辅助色 | `#5856D6` (iOS Purple) |
| 成功色 | `#34C759` (iOS Green) |
| 警告色 | `#FF9500` (iOS Orange) |
| 错误色 | `#FF3B30` (iOS Red) |

### 前端依赖 (frontend/package.json)
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| react | 18.3.1 | UI框架 |
| react-dom | 18.3.1 | DOM渲染 |
| react-router | 7.13.0 | 路由管理 |
| @radix-ui/* | 1.x | 无头UI组件库 |
| @mui/material | 7.3.5 | Material UI组件 |
| tailwindcss | 4.1.12 | CSS框架 |
| lucide-react | 0.487.0 | 图标库 |
| react-hook-form | 7.55.0 | 表单管理 |
| motion | 12.23.24 | 动画库 |
| zustand | ^5.0.0 | 状态管理 |
| axios | ^1.7.7 | HTTP请求 |
| pusher-js | ^8.0.0 | Pusher实时通信客户端 |

### 后端依赖 (backend/package.json)
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| express | ^4.21.0 | Web框架 |
| mysql2 | ^3.11.0 | MySQL驱动 |
| bcrypt | ^5.1.1 | 密码加密 |
| jsonwebtoken | ^9.0.2 | JWT认证 |
| cors | ^2.8.5 | 跨域处理 |
| dotenv | ^16.4.5 | 环境变量 |
| express-validator | ^7.2.0 | 参数校验 |
| uuid | ^10.0.0 | UUID生成 |
| pusher | ^5.0.0 | Pusher实时通信 |

---

## 数据库表结构

### user 用户表
```sql
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar VARCHAR(500),
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user','admin','tech_god') DEFAULT 'user',
  status TINYINT DEFAULT 1 COMMENT '1在线 0离线',
  ban_status ENUM('active','banned') DEFAULT 'active' COMMENT '账户状态',
  banned_at TIMESTAMP NULL COMMENT '封禁时间',
  ban_expires_at TIMESTAMP NULL COMMENT '封禁到期时间',
  ban_reason VARCHAR(500) COMMENT '封禁原因',
  banned_by INT COMMENT '封禁者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### user_settings 用户设置表
```sql
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  language VARCHAR(10) DEFAULT 'zh-CN',
  theme VARCHAR(20) DEFAULT 'light',
  notification_enabled TINYINT DEFAULT 1,
  sound_enabled TINYINT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id)
);
```

### conversation 会话表
```sql
CREATE TABLE conversation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('single', 'group') DEFAULT 'single',
  name VARCHAR(100) COMMENT '群聊名称',
  avatar VARCHAR(500),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### conversation_member 会话成员表
```sql
CREATE TABLE conversation_member (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### message 消息表
```sql
CREATE TABLE message (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### message_read 消息已读表
```sql
CREATE TABLE message_read (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### contact 联系人表
```sql
CREATE TABLE contact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  contact_user_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  is_friend TINYINT DEFAULT 0 COMMENT '是否为好友',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  friend_time TIMESTAMP NULL COMMENT '成为好友时间',
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### group 群组表
```sql
CREATE TABLE `group` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar VARCHAR(500),
  owner_id INT NOT NULL,
  need_approval TINYINT DEFAULT 0 COMMENT '0不需要审核 1需要审核',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### group_member 群组成员表
```sql
CREATE TABLE group_member (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  muted_until TIMESTAMP NULL COMMENT '禁言截止时间',
  FOREIGN KEY (group_id) REFERENCES `group`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### group_join_request 群加入申请表
```sql
CREATE TABLE group_join_request (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `group`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### moments 朋友圈表
```sql
CREATE TABLE moments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT,
  images JSON COMMENT '图片URL数组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### moments_comment 朋友圈评论表
```sql
CREATE TABLE moments_comment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  moment_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### moments_like 朋友圈点赞表
```sql
CREATE TABLE moments_like (
  id INT PRIMARY KEY AUTO_INCREMENT,
  moment_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE KEY uk_moment_user (moment_id, user_id)
);
```

### user_ip_log 用户IP记录表
```sql
CREATE TABLE user_ip_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(500),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_ip_address (ip_address),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

### ip_ban IP封禁表
```sql
CREATE TABLE ip_ban (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45) NOT NULL,
  ban_type ENUM('exact', 'range', 'subnet') DEFAULT 'exact',
  ban_reason VARCHAR(500),
  ban_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active TINYINT DEFAULT 1,
  INDEX idx_ip_address (ip_address),
  INDEX idx_expires_at (expires_at)
);
```

### temp_conversation 临时会话表
```sql
CREATE TABLE temp_conversation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  target_user_id INT NOT NULL,
  is_blocked TINYINT DEFAULT 0 COMMENT '是否被封禁',
  warning_count INT DEFAULT 0 COMMENT '警告次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

---

## API 接口与前端组件映射

| API | 方法 | 前端组件 | 功能 |
|-----|------|---------|------|
| POST /api/user/register | POST | Login.tsx | 用户注册 |
| POST /api/user/login | POST | Login.tsx | 用户登录 |
| GET /api/user/profile | GET | Profile.tsx | 获取用户资料 |
| PUT /api/user/profile | PUT | Profile.tsx | 更新用户资料 |
| GET /api/user/search | GET | - | 搜索用户 |
| POST /api/user/logout | POST | - | 退出登录 |
| GET /api/conversation/list | GET | ChatsSidebar.tsx | 获取会话列表 |
| GET /api/conversation/:id | GET | Chat.tsx | 获取会话详情 |
| POST /api/conversation/single | POST | Chat.tsx | 创建单聊会话 |
| POST /api/conversation/group | POST | GroupChat.tsx | 创建群聊会话 |
| GET /api/conversation/:id/members | GET | Chat.tsx | 获取会话成员 |
| POST /api/conversation/:id/members | POST | Chat.tsx | 添加成员 |
| DELETE /api/conversation/:id/members/:userId | DELETE | Chat.tsx | 移除成员 |
| POST /api/message/send | POST | Chat.tsx | 发送消息 |
| GET /api/message/list | GET | Chat.tsx | 获取消息历史 |
| POST /api/message/read | POST | Chat.tsx | 标记已读 |
| GET /api/contact/list | GET | ContactsSidebar.tsx | 获取联系人列表 |
| GET /api/contact/requests | GET | ContactsSidebar.tsx | 获取待处理请求 |
| POST /api/contact/add | POST | ContactsSidebar.tsx | 添加联系人 |
| POST /api/contact/accept | POST | ContactsSidebar.tsx | 接受联系人请求 |
| POST /api/contact/reject | POST | ContactsSidebar.tsx | 拒绝联系人请求 |
| POST /api/contact/block | POST | - | 阻止联系人 |
| POST /api/contact/unblock | POST | - | 取消阻止 |
| DELETE /api/contact/:userId | DELETE | - | 删除联系人 |
| POST /api/group | POST | CreateGroupModal.tsx | 创建群组 |
| GET /api/group | GET | ContactsSidebar.tsx | 获取我的群组列表 |
| GET /api/group/search | GET | GroupSearchModal.tsx | 搜索群组 |
| GET /api/group/:groupId | GET | GroupInfoSidebar.tsx | 获取群组信息 |
| POST /api/group/:groupId/join | POST | GroupSearchModal.tsx | 申请/加入群组 |
| POST /api/group/:groupId/leave | POST | GroupInfoSidebar.tsx | 退出群组 |
| PUT /api/group/:groupId/admin/:userId | PUT | GroupInfoSidebar.tsx | 设置/取消管理员 |
| DELETE /api/group/:groupId/members/:userId | DELETE | GroupInfoSidebar.tsx | 移除群成员 |
| GET /api/group/:groupId/requests | GET | ContactsSidebar.tsx | 获取加群申请 |
| PUT /api/group/:groupId/requests/:requestId | PUT | ContactsSidebar.tsx | 处理加群申请 |
| GET /api/admin/groups | GET | Admin.tsx | 获取群组列表(后台) |
| GET /api/admin/groups/:groupId/members | GET | Admin.tsx | 获取群组成员(后台) |
| DELETE /api/admin/groups/:groupId | DELETE | Admin.tsx | 删除群组(后台) |
| DELETE /api/message/:messageId | DELETE | Chat.tsx | 撤回消息 |

---

## 已知问题与解决方案

### 问题1: 前端状态管理未集成 ✅ 已解决
- **描述**: 前端仅有 UI 组件，缺少状态管理
- **解决方案**: 引入 Zustand 管理全局状态，创建 authStore, chatStore, contactStore
- **状态**: ✅ 已完成

### 问题2: 后端项目未创建 ✅ 已解决
- **描述**: 仅前端 UI，无后端 API
- **解决方案**: 创建 backend 目录和 Express 项目，包含完整的服务层、控制器层、路由
- **状态**: ✅ 已完成

### 问题3: 数据库未初始化 ✅ 已解决
- **描述**: 无 MySQL 数据库和表结构
- **解决方案**: 创建 database/init.sql 和 clean-db.js
- **状态**: ✅ 已完成

### 问题4: npm audit 依赖漏洞扫描 ⚠️ 待处理
- **描述**: 需执行 npm audit 扫描前端和后端依赖
- **解决方案**: 手动执行 npm audit 并根据提示修复
- **状态**: ⚠️ 待处理

### 问题5: Admin 后台接口全部返回 403 或获取失败 ⚠️ 已解决
- **描述**:
  - authMiddleware 查询用户信息时缺少 `role` 字段
  - moments/moments_comment 表没有 `deleted_at` 软删除字段，导致查询报错
- **根本原因**:
  1. `authMiddleware` SQL: `SELECT ... status FROM user` 缺少 `role` 字段
  2. `MomentsService.js` 和 `AdminService.js` 中使用 `WHERE deleted_at IS NULL` 但表无此字段
- **修复方案**:
  1. 修改 `backend/src/middleware/auth.js` - 添加 `role` 到查询字段
  2. 修改 `MomentsService.js` - 移除所有 `deleted_at` 条件，改用直接 DELETE
  3. 修改 `AdminService.js` - 移除所有 `deleted_at` 条件，改用直接 DELETE
  4. 朋友圈删除改用 `DELETE FROM moments WHERE id = ?` 而非 `UPDATE SET deleted_at`
- **状态**: ✅ 已修复

### 问题6: 朋友圈发布失败 ⚠️ 已解决
- **描述**: 发布朋友圈返回 "发布失败"
- **根本原因**: moments 表没有 `deleted_at` 字段，`getMoments` 查询报错
- **修复方案**: 同问题5，移除所有 `deleted_at` 相关查询
- **状态**: ✅ 已修复

### 问题7: MySQL2 LIMIT 占位符报错 ⚠️ 已解决
- **描述**: 所有分页查询报错 `Incorrect arguments to LIMIT`
- **根本原因**: MySQL2 的 `execute()` 方法对 `LIMIT ? OFFSET ?` 占位符支持有问题
- **修复方案**: 将 `LIMIT ? OFFSET ?` 改为直接拼接数字 `LIMIT ${safeLimit} OFFSET ${safeOffset}`
- **涉及文件**:
  - `AdminService.js` - 7处已修复
  - `MomentsService.js` - 2处已修复
- **状态**: ✅ 已修复

### 问题8: 前端响应拦截器解析错误 ⚠️ 已解决
- **描述**: API 返回数据正确但页面不显示
- **根本原因**: `client.ts` 拦截器返回 `{ code, data, msg }`，但前端代码使用 `response.data.code`（多了一层 data）
- **修复方案**: 统一使用 `response.code` 和 `response.data`
- **涉及文件**:
  - `Moments.tsx` - loadMoments, handlePublish, handleLike, handleAddComment, handleDelete
  - `Admin.tsx` - loadDashboard, loadUsers, loadConversations, loadMoments, loadTables, loadTableData, loadMessages, handleSetRole, handleBanUser, handleDeleteUser, handleDeleteMoment
- **状态**: ✅ 已解决

### 问题9: Admin页面应隐藏消息列表 ⚠️ 已解决
- **描述**: 进入管理中心时左侧消息列表仍然显示
- **修复方案**: 在 `MainLayout.tsx` 中添加条件判断 `{!location.pathname.startsWith('/admin') && (...)}`
- **状态**: ✅ 已解决

### 问题10: 群组不显示在消息列表 ⚠️ 已解决
- **描述**: 创建群组后，群组不显示在消息列表中
- **根本原因**: `GroupService.createGroup` 只在 `group` 表创建记录，没有在 `conversation` 表创建对应记录。消息列表从 `conversation` 表获取数据。
- **修复方案**: 修改 `createGroup`，先创建 `conversation` 获取 ID，然后用该 ID 作为 `group.id`，确保群组能关联到会话
- **核心逻辑**: `group.id` 和 `conversation.id` 共用同一个 ID
- **涉及文件**:
  - `backend/src/services/GroupService.js` - `createGroup`, `joinGroup`, `handleJoinRequest`, `leaveGroup`, `removeMember`
- **状态**: ✅ 已解决

### 问题11: 前端群组API响应解析错误 ⚠️ 已解决
- **描述**: 创建群组显示失败，群组列表获取失败
- **根本原因**: axios 拦截器已返回 `{ code, data, msg }`，但前端代码使用 `response.data.code`（多了一层 data）
- **修复方案**: 统一使用 `response.code` 和 `response.data`
- **涉及文件**:
  - `CreateGroupModal.tsx` - handleSearch, handleCreate
  - `GroupSearchModal.tsx` - handleSearch, handleJoin
  - `GroupInfoSidebar.tsx` - loadGroupInfo, handleSetAdmin, handleRemoveMember, handleLeaveGroup
  - `ContactsSidebar.tsx` - fetchGroupRequests, fetchMyGroups, handleGroupJoinRequest
- **状态**: ✅ 已解决

### 问题12: Settings 页面 API 响应解析错误 ⚠️ 已解决
- **描述**: 设置页面加载失败
- **根本原因**: Settings.tsx 使用 `response.data.code` 而非 `response.code`
- **修复方案**: 统一使用 `response.code` 和 `response.data`
- **涉及文件**:
  - `frontend/src/app/pages/Settings.tsx` - loadSettings, handleSettingChange, handleProfileUpdate, handlePasswordChange
- **状态**: ✅ 已解决

### 问题13: Pusher 密钥硬编码 ⚠️ 已解决
- **描述**: Pusher API 密钥硬编码在源代码中，存在安全风险
- **修复方案**: 
  - 移除前端 `useWebSocket.ts` 中的硬编码 Pusher Key
  - 改为从 `VITE_PUSHER_KEY` 环境变量读取
  - `.env.example` 中的 Pusher 配置改为 placeholder 值
- **涉及文件**:
  - `frontend/src/hooks/useWebSocket.ts`
  - `frontend/.env.example`
  - `backend/.env.example`
- **状态**: ✅ 已解决

### AI智能调度系统 ⚠️ 已实现
- **描述**: 实现网站智能化数据处理系统
- **前端实现**:
  - `frontend/src/lib/aiScheduler.ts` - AI智能调度核心算法
    - 智能缓存管理（LRU + 优先级）
    - 用户行为预测
    - 预取机制
    - 自动清理
  - `frontend/src/hooks/useSmartData.ts` - 智能数据Hook
    - `useSmartData` - 智能数据加载
    - `useSmartCache` - 智能缓存管理
    - `usePredictivePrefetch` - 预测性预取
    - `useAIRecommendations` - AI推荐
- **后端实现**:
  - `backend/src/services/AIService.js` - AI服务
    - `IntelligentCache` - 智能缓存（命中率统计、自动淘汰）
    - `LoadBalancer` - 负载均衡
    - `QueryOptimizer` - 查询优化（慢查询分析）
    - `DataPrefetcher` - 数据预取
  - `backend/src/controllers/AdminController.js` - 添加 `getAIStats` 接口
  - `backend/src/routes/admin.js` - 添加 `/ai-stats` 路由
- **状态**: ✅ 已实现

### 问题14: 朋友圈点赞报错 Cannot read properties of null ⚠️ 已解决
- **描述**: 朋友圈点赞后全屏报错 `Cannot read properties of null (reading 'liked')`
- **根本原因**: `MomentsService.js` 异常时返回 `{ code: 200, data: null, msg: '操作失败' }`，前端直接访问 `res.data.liked` 导致报错
- **修复方案**: 前端添加 `res.data` 空值检查
- **涉及文件**:
  - `frontend/src/app/pages/Moments.tsx` - handleLike 函数
- **状态**: ✅ 已解决

### 问题15: 群管理员标签刷新后消失 ⚠️ 已解决
- **描述**: 设置群管理员后当时显示标签，但刷新页面后标签消失
- **根本原因**: 
  1. `getGroupMembers` SQL 查询返回 `role` 字段，但前端检查的是 `my_role` 字段（已在后端修复）
  2. `loadGroupInfo` 使用 `conversationApi.getConversation` 而不是 `groupApi.getInfo`，导致无法获取包含 `my_role` 的成员数据
- **修复方案**: 
  - 后端 SQL 添加 `gm.role as my_role` 别名（已在 GroupService.js 修复）
  - 前端改用 `groupApi.getInfo` 获取完整的群组成员信息
- **涉及文件**:
  - `backend/src/services/GroupService.js` - getGroupMembers 函数
  - `frontend/src/app/pages/GroupChat.tsx` - loadGroupInfo 函数
- **状态**: ✅ 已解决

### 问题16: 群聊成员操作弹窗毛玻璃背景延伸 ⚠️ 已解决
- **描述**: 成员操作弹窗和禁言弹窗的毛玻璃背景延伸到消息列表区域外
- **根本原因**: 模态框使用 `absolute inset-0` 覆盖整个容器，且主容器未限制溢出
- **修复方案**: 
  - 主容器添加 `overflow-hidden`
  - 模态框使用双层结构（背景层+内容层分离）
- **涉及文件**:
  - `frontend/src/app/pages/GroupChat.tsx` - 主容器和模态框结构
- **状态**: ✅ 已解决

### 问题17: 头像上传问题 ⚠️ 已解决
- **描述**: 用户上传头像失败
- **根本原因**: UserService.updateProfile 中头像URL生成有问题
- **修复方案**: 修正头像上传逻辑，确保URL正确生成
- **涉及文件**:
  - `backend/src/services/UserService.js` - updateProfile 函数
- **状态**: ✅ 已解决

### 问题18: AI缓存导致会话跳转错误 ⚠️ 已解决
- **描述**: 点击消息列表的会话时会错误跳转
- **根本原因**: AI缓存加速导致数据错乱
- **修复方案**: 取消AI缓存加速，只允许缓存静态文件和已存在的聊天记录
- **涉及文件**:
  - `frontend/src/lib/aiScheduler.ts` - 缓存策略修改
  - `frontend/src/hooks/useSmartData.ts` - 智能数据Hook修改
- **状态**: ✅ 已解决

### 问题19: Pin is not defined ⚠️ 已解决
- **描述**: 全屏报错 Pin is not defined
- **根本原因**: ChatsSidebar.tsx 中移除了 Pin 图标 import 但仍在使用 `<Pin>` 组件
- **修复方案**: 彻底取消置顶功能，移除所有 Pin 相关代码
- **涉及文件**:
  - `frontend/src/app/components/ChatsSidebar.tsx` - 移除 Pin 组件和功能
- **状态**: ✅ 已解决

### 问题20: 数据库密码变更 ⚠️ 已解决
- **描述**: 数据库密码从 `cyccodemao1234` 变更为 `YougCvAcH2XPXVQf`
- **根本原因**: 数据库密码重置
- **修复方案**: 更新 backend/.env 中的数据库密码配置
- **涉及文件**:
  - `backend/.env` - DB_PASSWORD
- **状态**: ✅ 已解决

### 问题21: Admin状态显示异常 ⚠️ 已解决
- **描述**: 用户状态正常却显示已封号，并且经常性反复横跳
- **根本原因**: 代码错误地将 `status = 0`（离线）当作已封禁判断
- **修复方案**: 正确使用 `ban_status === 'banned'` 进行封禁判断
- **涉及文件**:
  - `backend/src/services/UserService.js` - login, getProfile 函数
  - `backend/src/services/AdminService.js` - getUsers 函数
  - `backend/src/middleware/auth.js` - 认证中间件
- **状态**: ✅ 已解决

### 问题22: 消息发送失败 ⚠️ 已解决
- **描述**: 消息发送返回错误
- **根本原因**: MessageService 异常处理和数据库表结构问题
- **修复方案**: 修复异常处理逻辑，确保正确返回格式
- **涉及文件**:
  - `backend/src/services/MessageService.js`
  - `database/migrate_add_recalled_type.sql`
- **状态**: ✅ 已解决

### 问题23: 已注销用户显示"账户已注销" ⚠️ 已解决
- **描述**: 删除的用户显示为"Unknown"
- **根本原因**: 前端未处理用户已删除的情况
- **修复方案**: 当用户昵称为空或特定标记时显示"账户已注销"
- **涉及文件**:
  - `frontend/src/app/pages/Chat.tsx` - 消息发送者显示
  - `frontend/src/app/pages/GroupChat.tsx` - 群成员显示
  - `frontend/src/app/components/ChatsSidebar.tsx` - 会话列表显示
- **状态**: ✅ 已解决

### 问题24: 乐观消息发送逻辑 ⚠️ 已解决
- **描述**: 需要实现乐观消息发送（发送即显示）
- **根本原因**: 原逻辑需要等服务器响应才显示消息
- **修复方案**: 发送消息时先在本地显示 pending 状态，后台上传
- **涉及文件**:
  - `frontend/src/app/pages/Chat.tsx` - 消息发送逻辑
- **状态**: ✅ 已解决

### 问题25: 朋友圈图片嵌入 ⚠️ 已解决
- **描述**: 朋友圈上传图片后，图片链接未正确嵌入文本
- **根本原因**: 上传时未将图片URL一起带入文本
- **修复方案**: 使用 [IMG] 标签在文本中嵌入图片URL
- **涉及文件**:
  - `frontend/src/app/pages/Moments.tsx` - 图片上传和显示逻辑
- **状态**: ✅ 已解决

### 问题26: IP记录功能 ⚠️ 已解决
- **描述**: 需要记录用户登录和访问的IP
- **根本原因**: 新功能需求
- **修复方案**: 
  - 创建 user_ip_log 表记录IP
  - 在登录和进入网页时记录IP
  - Admin后台显示用户IP
- **涉及文件**:
  - `backend/src/services/UserService.js` - login 函数
  - `backend/src/services/IPBanService.js` - IP记录服务
  - `frontend/src/app/pages/Admin.tsx` - IP显示
- **状态**: ✅ 已解决

### 问题27: ban_status字段混淆 ⚠️ 已解决
- **描述**: status 和 ban_status 字段混淆使用
- **根本原因**: 
  - `status` = 在线状态 (0:离线, 1:在线)
  - `ban_status` = 封禁状态 (active/banned)
- **修复方案**: 明确区分两个字段的使用场景
- **涉及文件**:
  - `backend/src/services/UserService.js`
  - `backend/src/services/AdminService.js`
  - `database/migrate_ban_system.sql`
- **状态**: ✅ 已解决

---

## 项目文档

### 最新文档列表
| 文档 | 说明 | 更新日期 |
|------|------|---------|
| README.md | 项目主文档 | 2026-04-10 |
| PROJECT_REPORT.md | 项目报告 | 2026-04-10 |
| DEVELOPMENT_PLAN.md | 开发计划 | 2026-04-10 |
| MODIFICATION_REPORT_v2.md | v2修改记录 | 2026-04-04 |

---

## 项目目录结构

```
IM-Chat-App/
├── frontend/                    # 前端目录
│   ├── src/
│   │   ├── app/               # 主应用代码
│   │   │   ├── components/    # 组件（UI、业务组件）
│   │   │   ├── pages/         # 页面组件
│   │   │   ├── App.tsx        # 应用入口
│   │   │   └── routes.tsx    # 路由配置
│   │   ├── api/              # API 请求封装
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── store/            # Zustand 状态管理
│   │   ├── types/            # TypeScript 类型
│   │   ├── styles/           # 样式文件
│   │   └── main.tsx         # 前端入口
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── backend/                    # 后端目录
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑层
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── app.js          # 后端入口
│   ├── package.json
│   └── .env                # 环境变量
├── database/                  # 数据库相关
│   ├── init.sql            # 初始化脚本
│   ├── clean-db.js         # 清理数据库脚本
│   └── migrate.js          # 数据库迁移脚本
├── scripts/                   # 启动脚本
│   ├── start-all.bat       # Windows 一键启动
│   ├── start-all.sh        # Linux/Mac 一键启动
│   └── clean-db.bat        # 数据库清理脚本
├── security/                  # 安全相关
│   ├── test-report.md      # 安全测试报告
│   └── fix-records.md      # 漏洞修复记录
└── IM_Chat_AI_Memory.md     # AI 编程记忆文档
```

---

## 安全规范

### 已实施的安全措施
- [x] 密码 bcrypt 加密存储
- [x] JWT token 认证
- [x] 参数化查询防 SQL 注入
- [x] XSS 转义处理（前端 React 默认转义）
- [x] 接口权限校验（authMiddleware）
- [x] 敏感信息脱敏（手机号、邮箱）
- [x] CORS 跨域配置
- [x] 统一错误响应格式

### 待测试项
- [ ] SQL 注入测试
- [ ] XSS 跨站脚本测试
- [ ] CSRF 测试
- [ ] 未授权访问测试
- [ ] npm audit 依赖漏洞扫描
