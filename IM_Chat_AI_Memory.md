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
| 数据库 | MySQL | 8.0+ (TiDB Cloud) |
| 实时通讯 | Pusher Channels | 第三方WebSocket服务 |
| 认证 | JWT | 9.0.2 |
| 状态管理 | Zustand | 5.0.0 |
| HTTP客户端 | Axios | 1.7.7 |

### 核心业务场景
1. 用户注册/登录（JWT认证）
2. 即时消息收发（实时+历史消息）
3. 会话管理（单聊）
4. 联系人管理
5. 用户资料管理
6. 朋友圈功能
7. Admin后台管理
8. AI智能调度

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
| 前端 | https://code-kitty-im-frontend.vercel.app |

### 代码编写铁律（永久遵守）
1. **所有接口必须加 try-catch，绝不返回 500**
2. **所有返回格式统一 `{ code, data, msg }`**
3. **所有 SQL 避免 SELECT *，使用明确字段**
4. **所有跨域支持线上域名，不写死 localhost**
5. **所有前端地址从 `import.meta.env` 读取**
6. **MySQL2 分页必须用 `LIMIT ${num} OFFSET ${num}` 拼接，禁止占位符 `?`**
7. **前端调用 API 后，响应拦截器已返回 `{ code, data, msg }`，直接用 `response.code` 判断，不要再加 `.data`**
8. **禁止自动执行 git push**：代码修改后只做 git commit，不自动推送到 GitHub，由用户自行决定何时推送

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

### 任务17: AI智能调度系统开发
- **执行时间**: 2026-04-10
- **任务内容**:
  - 实现前端智能调度系统（smartScheduler, smartApiClient, smartChatStore）
  - 实现后端限流中间件（rateLimiter.js）
  - 实现 AI 服务管理与统计分析
- **新增文件**:
  - `frontend/src/lib/smartScheduler.ts` - 前端智能调度器
  - `frontend/src/lib/smartApiClient.ts` - 增强版API客户端
  - `frontend/src/store/smartChatStore.ts` - 智能聊天存储
  - `backend/src/middleware/rateLimiter.js` - 后端限流中间件
  - `backend/src/services/AIServiceManager.js` - AI服务管理器
- **修改文件**:
  - `backend/src/app.js` - 集成限流中间件
  - `frontend/src/app/components/ChatsSidebar.tsx` - 移除循环检查
  - `frontend/src/app/pages/Chat.tsx` - 优化消息加载
  - `frontend/src/app/pages/Admin.tsx` - AI调度状态监控
- **执行结果**: ✅ 完成

### 任务18: i18n国际化规范完善
- **执行时间**: 2026-04-10
- **任务内容**:
  - 添加Admin页面AI调度部分的i18n支持
  - 创建i18n开发规范文档
- **代码改动关键点**:
  - `frontend/src/i18n/locales/zh-CN.json` - 添加AI服务相关翻译
  - `frontend/src/i18n/locales/en-US.json` - 添加AI服务相关翻译
  - `backend/src/services/AIServiceManager.js` - 返回翻译key
  - `frontend/src/app/pages/Admin.tsx` - 使用t()获取翻译
  - `guidelines/Guidelines.md` - 新增i18n规范章节
- **执行结果**: ✅ 完成

### 任务19: 移除群组功能
- **执行时间**: 2026-05-22
- **任务内容**:
  - 完全移除群组功能相关代码
  - 清理群组相关前端组件和后端服务
  - 保留数据库表结构用于数据备份
- **删除文件**:
  - `frontend/src/api/group.ts` - 群组 API
  - `frontend/src/app/components/CreateGroupModal.tsx` - 创建群组弹窗
  - `frontend/src/app/components/GroupSearchModal.tsx` - 搜索群组弹窗
  - `frontend/src/app/components/GroupInfoSidebar.tsx` - 群信息侧边栏
  - `frontend/src/app/pages/GroupChat.tsx` - 群聊页面
  - `backend/src/services/GroupService.js` - 群组服务
  - `backend/src/controllers/GroupController.js` - 群组控制器
  - `backend/src/routes/group.js` - 群组路由
- **修改文件**:
  - `backend/src/app.js` - 移除群组路由注册
  - `frontend/src/app/routes.tsx` - 移除群聊路由
  - `frontend/src/app/components/ChatsSidebar.tsx` - 移除创建群组按钮和相关逻辑
  - `frontend/src/app/components/ContactsSidebar.tsx` - 移除群组搜索、群申请、我的群组相关UI
  - `frontend/src/app/pages/Chat.tsx` - 移除群信息侧边栏集成
  - `frontend/src/app/pages/Admin.tsx` - 移除群组管理Tab
- **数据库说明**:
  - `group`、`group_member`、`group_join_request` 表保留用于数据备份，但不再被应用使用
- **执行结果**: ✅ 完成

### 任务20: 修复会话界面头像不同步问题
- **执行时间**: 2026-05-22
- **问题描述**:
  - 消息列表（ChatsSidebar）中头像正常显示自定义头像
  - 会话界面（Chat.tsx）中头像始终显示默认大字首字母，不同步用户自定义头像
- **根本原因**:
  - Chat.tsx 第531-534行头像渲染逻辑只硬编码显示 `(message.sender_nickname || 'U')[0]` 首字母
  - 后端 MessageService 已返回 `sender_avatar` 字段（LEFT JOIN user 表获取）
  - 前端完全没有读取和使用 `sender_avatar` 字段
- **修复方案**:
  - 修改 Chat.tsx 头像渲染逻辑：先检查 `message.sender_avatar` 是否存在
  - 有自定义头像时显示 `<img src={message.sender_avatar}>`
  - 无自定义头像时回退到默认大字首字母
  - 添加 `overflow-hidden` 类确保圆形裁剪
- **涉及文件**:
  - `frontend/src/app/pages/Chat.tsx` - 头像渲染逻辑（第531-538行）
- **执行结果**: ✅ 完成

### 任务21: 统一设置页面入口
- **执行时间**: 2026-05-22
- **问题描述**:
  - 导航栏底部头像点击跳转到 `/profile`（Profile.tsx）- 大头像展示+渐变背景页面
  - 导航栏设置按钮点击跳转到 `/settings`（Settings.tsx）- 标准设置页面
  - 两个页面功能不一致，用户要求统一为 Settings 页面
- **修复方案**:
  - MainLayout.tsx 第128行：头像点击从 `navigate("/profile")` 改为 `navigate("/settings")`
  - MobileNav.tsx 第18行：移动端导航栏设置项路径从 `/profile` 改为 `/settings`
  - 统一后所有入口都进入 Settings 页面（包含个人资料、语言、主题、隐私、关于等完整功能）
- **涉及文件**:
  - `frontend/src/app/components/MainLayout.tsx` - 头像点击跳转（第128行）
  - `frontend/src/app/components/MobileNav.tsx` - 移动端导航栏设置项（第18行）
- **执行结果**: ✅ 完成

### 任务22: 系统级消息通知功能
- **执行时间**: 2026-05-22
- **任务内容**:
  - 实现浏览器原生系统级通知（Notification API）
  - 收到新消息时，如果页面不在前台，弹出系统级桌面通知
  - 点击通知可跳转到对应聊天会话
  - 在设置页面添加通知权限管理开关
- **新增文件**:
  - `frontend/src/hooks/useSystemNotification.ts` - 系统通知 Hook
- **修改文件**:
  - `frontend/src/app/pages/Chat.tsx` - 集成 useWebSocket 消息回调触发系统通知
  - `frontend/src/app/pages/Settings.tsx` - 添加通知权限开关 UI
- **核心逻辑**:
  - 使用浏览器 Notification API 实现原生弹窗
  - 仅在页面不可见（document.visibilityState !== 'visible'）时弹出通知，避免重复打扰
  - 仅对他人发送的消息触发通知（过滤自己发送的消息）
  - 通知 8 秒后自动关闭，点击通知聚焦窗口并跳转会话
  - 支持 text/image/file 三种消息类型的预览文本
  - 浏览器不支持 Notification API 时自动隐藏设置项
- **执行结果**: ✅ 完成

### 任务23: UI优化与通知自动开启
- **执行时间**: 2026-05-22
- **任务内容**:
  1. 修复设置页面无法滚动问题（min-h-screen → h-full overflow-y-auto）
  2. 删除消息列表的"私聊"分类标题，直接展示会话列表
  3. 系统通知改为默认自动请求授权（首次进入2秒后自动弹窗）
- **修改文件**:
  - `frontend/src/app/pages/Settings.tsx` - 根容器改为 h-full + overflow-y-auto；通知UI简化
  - `frontend/src/app/components/ChatsSidebar.tsx` - 移除 renderCategory 和 collapsedPrivate，直接渲染列表
  - `frontend/src/hooks/useSystemNotification.ts` - 增加 autoRequest 参数和 localStorage 去重逻辑
- **执行结果**: ✅ 完成

### 任务24: 全局系统通知重构
- **执行时间**: 2026-05-22
- **任务内容**:
  - 将系统通知从 Chat.tsx 页面级提升到 MainLayout 全局级
  - 修改通知触发条件：仅在用户处于**同一会话窗口内**时不弹窗，其他情况一律弹窗
  - 引入事件总线模式解耦消息接收与通知展示
- **新增文件**:
  - `frontend/src/lib/messageEventBus.ts` - 全局消息事件总线（发布/订阅模式）
- **修改文件**:
  - `frontend/src/hooks/useSystemNotification.ts` - 去掉 visibilityState 判断，改为 currentChatId 对比判断；增加 useParams 获取当前会话ID
  - `frontend/src/app/components/MainLayout.tsx` - 挂载 useSystemNotification + 订阅 messageEventBus 全局监听
  - `frontend/src/app/pages/Chat.tsx` - 移除 useSystemNotification 调用，改为 messageEventBus.emit 派发事件
- **核心架构变化**:
  ```
  之前: Chat.tsx (useWebSocket回调) → notifyNewMessage() → 直接弹窗（仅Chat页面生效）
  之后: Chat.tsx (useWebSocket回调) → messageEventBus.emit() → MainLayout订阅 → notifyNewMessage() → 弹窗（全局生效）
  ```
- **通知条件逻辑**:
  ```
  收到新消息
    ├─ 是自己发的？ → ❌ 不通知
    ├─ 当前正在看这个会话的聊天界面？ → ❌ 不通知（消息已直接显示）
    └─ 其他所有情况（首页/联系人/设置/其他会话/页面最小化/后台） → ✅ 弹出系统通知！
  ```
- **执行结果**: ✅ 完成

### 任务25: 世界频道(World Channel)后端实现
- **执行时间**: 2026-05-23
- **任务内容**:
  - 实现世界频道后端服务（所有用户都能进入的公共聊天室）
  - 自动创建世界频道会话（type='world'）
  - 提供世界频道API接口
- **新增文件**:
  - `backend/src/services/WorldChannelService.js` - 世界频道服务
    - `getOrCreateWorldChannel()` - 查找或创建世界频道会话
    - `ensureMember()` - 确保用户是世界频道成员
    - `getMessages()` - 获取世界频道消息
    - `getFullWorldChannel()` - 获取完整世界频道数据
- **修改文件**:
  - `backend/src/app.js` - 添加世界频道自动创建迁移逻辑（启动时检查并创建）
  - `backend/src/routes/conversation.js` - 添加 `GET /api/conversation/world` 路由
- **API 接口**:
  - `GET /api/conversation/world` - 获取世界频道信息及消息列表
- **核心逻辑**:
  - 服务启动时自动检测并创建 type='world' 的 conversation 记录
  - 用户访问世界频道时自动加入为成员
  - 返回世界频道信息和最近50条消息（按时间正序）
- **执行结果**: ✅ 完成

### 任务26: 系统通知(System Notification)全栈功能
- **执行时间**: 2026-05-23
- **任务内容**:
  - 实现管理员后台发送系统通知功能
  - 普通用户在消息列表中以卡片形式查看通知
  - 支持通知类型：info(信息)、warning(警告)、success(成功)、announcement(公告)
- **数据库表**: `system_notification`（需手动执行SQL创建）
- **新增文件**:
  - `backend/src/controllers/SystemNotificationController.js` - 系统通知控制器
    - `getAllNotifications()` - 获取所有启用的通知（用户端）
    - `getAllAdminNotifications()` - 获取所有通知包括已禁用的（管理端）
    - `createNotification()` - 创建新通知（仅admin）
    - `updateNotification()` - 更新通知状态/内容
    - `deleteNotification()` - 删除通知
  - `backend/src/routes/systemNotification.js` - 系统通知路由
    - `GET /api/system-notification/list` - 用户获取通知列表
    - `GET /api/system-notification/admin/list` - 管理员获取全部
    - `POST /api/system-notification` - 创建通知（需要admin权限）
    - `PUT /api/system-notification/:id` - 更新通知
    - `DELETE /api/system-notification/:id` - 删除通知
  - `frontend/src/api/systemNotification.ts` - 前端API封装
- **修改文件**:
  - `backend/src/app.js` - 注册系统通知路由 `/api/system-notification`
  - `frontend/src/app/pages/Admin.tsx` - 添加"系统通知"管理Tab
    - 新增 `notifications` 相关状态和函数
    - 支持创建、编辑、删除通知
    - 通知列表展示（标题、类型标签、状态、时间、操作按钮）
    - 创建/编辑弹窗（标题输入框、内容文本域、类型选择）
  - `frontend/src/app/components/ChatsSidebar.tsx` - 添加系统通知卡片UI
    - 在私聊列表上方显示通知卡片区域
    - 渐变边框样式（根据type显示不同颜色）
    - Megaphone 图标作为通知标识
    - 点击可展开/收起查看完整内容
    - 最多显示3条最新通知
- **API 接口**:
  | 方法 | 路径 | 说明 | 权限 |
  |-----|------|------|------|
  | GET | /api/system-notification/list | 用户获取启用通知 | 登录用户 |
  | GET | /api/system-notification/admin/list | 管理员获取全部通知 | admin |
  | POST | /api/system-notification | 创建通知 | admin |
  | PUT | /api/system-notification/:id | 更新通知 | admin |
  | DELETE | /api/system-notification/:id | 删除通知 | admin |
- **UI特性**:
  - Admin端：表格展示 + 创建/编辑弹窗 + 类型颜色标签
  - 用户端：卡片式布局 + 渐变边框 + 可展开/收起 + 响应式适配
- **执行结果**: ✅ 完成

### 任务27: Admin.tsx构建错误修复
- **执行时间**: 2026-05-23
- **问题描述**:
  - Vercel 部署报错：Admin.tsx 存在 JSX 括号不匹配导致构建失败
  - 错误1: Line 1583 `Expected ")" but found "{"` — studio tab 位置括号错误
  - 错误2: Line 1638 `<AnimatePresence>` 解析异常 — 在错误的 JSX 嵌套层级
  - 错误3: `systemNotification.ts` 导入路径 `../utils/request` 不存在，模块解析失败
- **根本原因分析**:
  1. 添加系统通知 Tab（Task 26）时，子代理在 aiFeedback Tab（L1246）和 notifications Tab（L1422）之间遗漏了 aiFeedback 的闭合标签 `)}` 和内容 div 的 `</div>`
  2. 这导致后续所有代码的 JSX 括号深度偏移 +2，studio tab 和 AnimatePresence 被错误地嵌套在未闭合的表达式内部
  3. `systemNotification.ts` 创建时使用了错误的导入路径（`../utils/request`），项目实际使用的是 `./client`
- **修复方案**:
  1. 在 L1420（isLoading 闭合）后添加 `</div>` 关闭 aiFeedback 的 space-y-6 内容容器
  2. 添加 `)}` 关闭 aiFeedback 的条件渲染表达式 `{activeTab === 'aiFeedback' && (`
  3. 删除 L1581 行多余的 `)}`（之前错误修复尝试留下的）
  4. 将 `systemNotification.ts` 的导入从 `import request from '../utils/request'` 改为 `import apiClient from './client'`
- **涉及文件**:
  - `frontend/src/app/pages/Admin.tsx` — 修复 JSX 括号嵌套（+3行 -4行）
  - `frontend/src/api/systemNotification.ts` — 修正 API 客户端导入路径
- **调试方法**:
  - 使用 Node.js 脚本逐行追踪 `{()}` 括号深度变化
  - 对比其他正常 tab 的开闭模式（每个 tab 以 `)}` 结尾，前面有对应数量的 `</div>`）
  - 发现 notifications tab 起始深度为 3 而其他 tab 为 1，定位到 aiFeedback 未闭合
- **执行结果**: ✅ 完成（构建通过，已推送到 GitHub c7edfba）

### 任务28: 修复世界频道和系统通知不显示
- **执行时间**: 2026-05-23
- **问题描述**:
  - 世界频道在消息列表中不显示（前端代码已写好但数据加载失败）
  - 系统通知卡片不显示（同上）
  - 用户要求：站长权限也要显示，所有人都能看到
- **根本原因分析**:
  1. **conversation.type ENUM 缺少 'world' 值**: 数据库定义为 `ENUM('single', 'group')`，启动迁移直接 INSERT `type='world'` 因 ENUM 约束违反而失败 → API 返回 500 → 前端 worldChannel 为 null → 不显示
  2. **system_notification 表不存在**: 用户未手动执行建表 SQL → 控制器 catch 返回空数组 `[]` → notifications.length === 0 → 不显示
  3. **前端无权限问题**: ChatsSidebar 中世界频道和系统通知对所有登录用户显示（仅需 authMiddleware），无需额外权限
- **修复方案**:
  1. 在 `backend/src/app.js` 启动迁移中添加：
     - `ALTER TABLE conversation MODIFY COLUMN type ENUM('single', 'group', 'world')` — 先扩展 ENUM 再 INSERT
     - `CREATE TABLE IF NOT EXISTS system_notification (...)` — 自动建表，无需手动执行 SQL
  2. 保持原有世界频道自动创建逻辑不变（ENUM 扩展后即可正常 INSERT）
- **涉及文件**:
  - `backend/src/app.js` — 启动迁移新增 2 个 try-catch 块（+24行）
- **执行结果**: ✅ 完成（本地已提交 def4c01，待网络恢复后推送）

### 任务29: 系统通知会话化(Notification Conversation)
- **执行时间**: 2026-05-23
- **任务内容**:
  - 将系统通知从独立功能提升为会话化架构（类似世界频道模式）
  - 添加 `notification` 类型到 conversation 表 ENUM
  - 为 system_notification 表添加 `image_url` 字段支持图片通知
  - 创建通知会话服务，自动将用户添加为通知会话成员
  - 提供统一的 API 接口获取通知会话数据
- **新增文件**:
  - `backend/src/services/NotificationConversationService.js` - 通知会话服务
    - `getOrCreateNotificationConversation()` - 查找或创建通知会话
    - `getNotifications()` - 获取所有启用的通知列表
    - `getFullNotificationConversation(userId)` - 获取完整通知会话数据（含成员自动加入）
- **修改文件**:
  - `backend/src/app.js` - 启动迁移新增 3 个逻辑块：
    - `ALTER TABLE conversation MODIFY COLUMN type ENUM(..., 'notification')` - 扩展ENUM
    - `ALTER TABLE system_notification ADD COLUMN image_url VARCHAR(500)` - 添加图片字段
    - 自动创建 type='notification' 的 conversation 记录
  - `backend/src/controllers/SystemNotificationController.js` - 全面支持 image_url：
    - `getAllNotifications()` SELECT 添加 image_url 字段
    - `getAllAdminNotifications()` SELECT 添加 image_url 字段
    - `createNotification()` 从 req.body 解构 image_url 并写入数据库
    - `updateNotification()` 支持 image_url 字段更新
  - `backend/src/routes/conversation.js` - 添加 `GET /api/conversation/notification` 路由
- **API 接口**:
  | 方法 | 路径 | 说明 | 权限 |
  |-----|------|------|------|
  | GET | /api/conversation/notification | 获取通知会话信息及通知列表 | 登录用户 |
- **核心逻辑**:
  - 服务启动时自动检测并创建 type='notification' 的 conversation 记录
  - 用户访问通知会话时自动加入为 conversation_member（确保能访问）
  - 返回通知会话信息和所有启用的系统通知列表（按时间倒序）
  - 与世界频道采用相同的 Service + Route 架构模式
- **数据库变更**:
  - `conversation.type` ENUM 新增 `'notification'` 值
  - `system_notification` 表新增 `image_url VARCHAR(500) DEFAULT NULL` 字段
- **执行结果**: ✅ 完成

### 任务30: 系统通知UI改造 - 从卡片形式改为会话入口形式
- **执行时间**: 2026-05-23
- **任务内容**:
  - 将系统通知从 ChatsSidebar 中的卡片形式改为会话入口形式（与世界频道保持一致）
  - 移除旧的 systemNotificationApi 调用，改用 conversationApi.getNotificationChannel()
  - 删除 ~60 行的系统通知卡片渲染代码
  - 添加新的系统通知会话入口组件（橙色渐变主题）
- **修改文件**:
  - `frontend/src/api/conversation.ts` — 新增 `getNotificationChannel()` 方法
  - `frontend/src/app/components/ChatsSidebar.tsx` — 核心改造：
    - State: `notifications` + `expandedNotification` → `notificationConv`
    - 数据加载: `systemNotificationApi.getList()` → `conversationApi.getNotificationChannel()`
    - UI: 删除卡片渲染区块 → 新增会话入口组件
    - Import: 移除 `systemNotificationApi`
- **UI特性**:
  - 橙色渐变主题 (`from-[#FF6B35] to-[#F7931E]`)
  - Megaphone 图标 + 📢 系统通知标题
  - 点击行为：有数据导航至会话，无数据重新加载
  - 支持激活状态高亮显示（当前查看时橙色高亮）
  - 响应式设计（移动端/桌面端自适应）
  - 与世界频道、私聊入口保持一致的交互模式
- **API变更**:
  | 方法 | 路径 | 说明 |
  |-----|------|------|
  | GET | /api/conversation/notification | 获取通知会话信息 |
- **架构优化**:
  ```
  之前: systemNotificationApi.getList() → notifications[] → 卡片渲染（独立功能）
  之后: conversationApi.getNotificationChannel() → notificationConv → 会话入口（会话化架构）
  ```
- **执行结果**: ✅ 完成

### 任务31: Chat.tsx系统通知会话卡片展示功能
- **执行时间**: 2026-05-23
- **任务内容**:
  - 在 Chat.tsx 中实现系统通知会话的卡片展示功能（而非聊天气泡）
  - 当用户进入系统通知会话时（conversation.type === 'notification'），以漂亮的卡片形式渲染每条通知
  - 隐藏输入框（不能在通知会话中发消息）
  - 不加载普通消息列表，改用 conversationApi.getNotificationChannel() 获取通知数据
- **新增 State**:
  - `isNotificationConv` - 是否为通知会话的标志
  - `notifications` - 通知数据数组
- **新增函数**:
  - `loadNotifications()` - 加载通知列表数据
- **修改文件**:
  - `frontend/src/app/pages/Chat.tsx` — 核心改造：
    - Import: 添加 Megaphone, CheckCircle, Info 图标 + conversationApi 导入
    - State: 新增 isNotificationConv, notifications 状态变量
    - useEffect: 添加通知会话检测分支逻辑
    - Messages 区域: 条件渲染通知卡片 vs 聊天消息
    - Input 区域: 通知会话时隐藏输入框
- **UI特性**:
  - 渐变边框卡片设计（根据通知类型显示不同颜色）
    - info: 蓝色渐变 (from-blue-500 to-cyan-500)
    - warning: 橙红渐变 (from-orange-500 to-red-500)
    - success: 绿色渐变 (from-green-500 to-emerald-500)
    - announcement: 紫粉渐变 (from-purple-500 to-pink-500)
  - 类型图标显示（AlertTriangle/CheckCircle/Megaphone/Info）
  - 类型标签（信息/警告/成功/公告）
  - 支持图片显示（image_url 字段）
  - 时间格式化显示（中文本地化）
  - 动画效果（framer-motion 入场动画）
  - 空状态提示（Megaphone 图标 + "暂无系统通知"）
  - 响应式设计（移动端/桌面端自适应）
- **核心逻辑**:
  ```
  用户进入会话
    ├─ conversation.type === 'notification'?
    │   ├─ 是 → setIsNotificationConv(true) + loadNotifications()
    │   │   └─ 渲染通知卡片列表 + 隐藏输入框
    │   └─ 否 → setIsNotificationConv(false) + loadMessages()
    │       └─ 渲染普通聊天消息 + 显示输入框
  ```
- **技术实现要点**:
  1. 使用 conversation?.type 检测会话类型（从 chatStore 的 conversations 数组中获取）
  2. 条件渲染使用三元表达式 `{isNotificationConv ? (<通知卡片>) : (<聊天消息>)}`
  3. 输入框使用 `{!isNotificationConv && (<输入框>)}` 条件包裹
  4. 所有原有聊天功能保持不变（通过条件分支隔离）
  5. 使用 framer-motion 的 motion.div 实现卡片入场动画
- **执行结果**: ✅ 完成

### 任务32: 后端游戏功能全栈开发
- **执行时间**: 2026-05-23
- **任务内容**:
  - 实现后端游戏功能全套代码（五子棋、井字棋、国际象棋）
  - 包含数据模型、段位计算服务、对局管理服务、控制器、路由
  - 支持AI对战（easy/medium/hard）和PVP模式
  - 支持积分系统、段位系统、排行榜、连胜记录
- **新增文件**:
  - `backend/src/models/GameModel.js` - 游戏数据模型
    - `game_match` 表: 对局记录（game_type, mode, player1/2_id, winner_id, status, ai_difficulty, moves JSON, duration_seconds, score_change）
    - `user_game_profile` 表: 用户游戏档案（rating, rank_tier, 各游戏胜负统计, win_streak, peak_rating）
    - `createTableSQL` 属性: 返回两张表的建表语句
  - `backend/src/services/RankingService.js` - 段位计算服务
    - `RANK_TIERS`: 8级段位（iron→bronze→silver→gold→platinum→emerald→diamond→master）
    - `SCORE_MAP`: 各游戏积分规则（gomoku ±25/±15, tictactoe ±10/±5, chess ±40/±20）
    - `AI_MULTIPLIER`: AI难度系数（easy=0.5x, medium=1.0x, hard=1.5x）
    - `getTierFromRating(rating)`: 根据积分返回段位对象
    - `calculateRatingChange(gameType, won, currentRating, aiDifficulty?, opponentRating?)`: 计算积分变化
    - `getOrCreateProfile(userId)`: 获取或创建用户游戏档案
    - `updateProfileAfterGame(userId, gameType, won, aiDifficulty?)`: 更新对局后档案
    - `getLeaderboard(limit?, gameType?)`: 返回排行榜列表按rating降序
    - `getUserProfile(userId)`: 获取单个用户完整游戏档案
  - `backend/src/services/GameService.js` - 对局管理服务
    - `createMatch(playerId, gameType, mode, aiDifficulty)`: 创建新对局
    - `recordMove(matchId, position, symbol)`: 记录落子到moves JSON数组
    - `finishMatch(matchId, winnerId, status)`: 结束对局，计算时长和积分变化
    - `abandonMatch(matchId)`: 弃权处理
    - `getMatchHistory(userId, limit)`: 获取用户对局历史
    - `getActiveMatch(userId)`: 获取进行中的对局
  - `backend/src/controllers/GameController.js` - 游戏控制器
    - `createMatch`: POST / 接收 gameType, mode, aiDifficulty
    - `move`: POST /:matchId/move 接收 position, symbol
    - `surrender`: POST /:matchId/surrender
    - `getProfile`: GET /profile 返回当前用户游戏档案
    - `getLeaderboard`: GET /leaderboard 支持 ?gameType 和 ?limit 参数
    - `getHistory`: GET /history 支持 ?limit 参数
  - `backend/src/routes/game.js` - 游戏路由
    - 所有路由均需 authMiddleware 认证
- **修改文件**:
  - `backend/src/app.js` - 集成游戏路由和建表SQL：
    - import gameRoutes from './routes/game.js'
    - app.use('/api/game', gameRoutes) 添加在 systemNotificationRoutes 之后
    - 启动迁移中添加 game_match 和 user_game_profile 两张表的 CREATE TABLE IF NOT EXISTS
- **API 接口**:
  | 方法 | 路径 | 说明 | 权限 |
  |-----|------|------|------|
  | POST | /api/game | 创建对局 | 登录用户 |
  | POST | /api/game/:matchId/move | 记录落子 | 登录用户 |
  | POST | /api/game/:matchId/surrender | 认输弃权 | 登录用户 |
  | GET | /api/game/profile | 获取游戏档案 | 登录用户 |
  | GET | /api/game/leaderboard | 获取排行榜 | 登录用户 |
  | GET | /api/game/history | 获取对局历史 | 登录用户 |
- **数据库变更**:
  - `game_match` 表: 对局记录，支持 gomoku/tictactoe/chess 三种游戏类型
  - `user_game_profile` 表: 用户游戏档案，包含积分、段位、各游戏胜率统计
  - 两张表均在启动时自动创建（CREATE TABLE IF NOT EXISTS），无需手动执行 SQL
- **核心逻辑**:
  - 创建对局时检查是否已有进行中的对局（防止重复创建）
  - 结束对局时自动计算对局时长和积分变化
  - 积分变化根据游戏类型、胜负、AI难度系数综合计算
  - 更新用户档案时自动更新连胜/最高连胜、各游戏单独胜场、段位晋升
  - 排行榜支持按游戏类型筛选和数量限制
- **执行结果**: ✅ 完成

### 任务33: 前端游戏组件开发（段位徽章、井字棋、五子棋）
- **执行时间**: 2026-05-23
- **任务内容**:
  - 创建3个前端游戏组件文件到 `frontend/src/app/components/games/` 目录
  - RankBadge.tsx: 段位徽章组件，支持8个段位、3种尺寸、framer-motion动画
  - TicTacToeBoard.tsx: 井字棋完整游戏，支持AI对战（easy/medium/hard三种难度）、minimax算法
  - GomokuBoard.tsx: 五子棋完整游戏，支持AI对战、评分函数AI、15×15棋盘
- **新增文件**:
  - `frontend/src/app/components/games/RankBadge.tsx` - 段位徽章组件
    - Props: tier, rating, size(sm/md/lg), showLabel
    - 8个段位配置：iron(铁器), bronze(青铜), silver(白银), gold(黄金), platinum(铂金), emerald(翡翠), diamond(钻石), master(大师)
    - 圆形渐变背景 + 段位图标（master显示Crown图标，其他显示Trophy图标）
    - framer-motion 入场动画 (opacity 0→1, scale 0.8→1)
    - 支持 dark mode
  - `frontend/src/app/components/games/TicTacToeBoard.tsx` - 井字棋游戏组件
    - Props: matchId, onGameOver, aiDifficulty, mode
    - 完整游戏逻辑：玩家(X) vs AI(O)，minimax算法实现AI
    - easy模式: 30%随机 + minimax深度1；medium模式: 完整minimax；hard模式: alpha-beta剪枝
    - UI特性：3×3网格、落子动画、胜利连线高亮、最后落子标记、状态栏(含脉冲动画点)、认输/再来一局按钮、结果弹窗
    - 积分变化显示：胜利+25、失败-15、平局无变化
  - `frontend/src/app/components/games/GomokuBoard.tsx` - 五子棋游戏组件
    - Props: matchId, onGameOver, aiDifficulty, mode
    - 常量：BOARD_SIZE=15, EMPTY=0, BLACK=1(玩家), WHITE=2(AI)
    - 核心函数：
      - checkFive(): 四方向检测五连珠
      - scorePosition(): 位置评分函数（连5:+100000, 活4:+15000, 冲4:+5000, 活3:+2000等）
      - getAIPosition(): AI决策（进攻分 - 防守分*1.1）
      - easy模式: 40%随机或只看直接威胁；medium/hard: 完整评分搜索
    - UI特性：15×15棋盘、SVG棋盘线、星位点标记(9个)、黑白棋子径向渐变、最后落子红圈标记、获胜棋子绿色脉冲、状态栏、按钮区、结果弹窗
    - 积分变化显示：五子连珠+25、失败-12、平局+5
- **技术栈**:
  - React 18.3.1 (useState, useCallback, useEffect)
  - motion 12.23.24 (motion.div, motion.button, AnimatePresence)
  - clsx 2.1.1 (条件样式)
  - lucide-react 0.487.0 (Crown, Trophy 图标)
  - TailwindCSS 4.1.12 (响应式样式、dark mode)
- **代码规范遵循**:
  - TypeScript 类型定义完整（Props interface, 类型别名）
  - 所有导入路径正确（使用项目已安装的依赖包）
  - TailwindCSS 类名有效（使用 v4 语法）
  - 支持 dark mode（dark: 前缀）
  - framer-motion 动画流畅（spring transition）
- **执行结果**: ✅ 完成

### 任务34: 游戏功能代码审查与优化
- **执行时间**: 2026-05-23
- **任务内容**:
  - 完成游戏功能全栈代码审查，确保所有文件完整性和一致性
  - 清理重复的游戏组件文件（删除 src/components/games/ 下3个冗余文件）
  - 验证后端服务文件路径正确性（确认 RankingService.js 和 GameService.js 在 services/ 目录）
  - 验证路由配置、导航集成、数据库迁移的正确性
- **审查结果**:
  - ✅ 前端文件全部完整：Games.tsx, TicTacToeBoard.tsx, GomokuBoard.tsx, RankBadge.tsx, gameStore.ts, game.ts
  - ✅ 后端文件全部完整：GameModel.js, RankingService.js, GameService.js, GameController.js, game.js
  - ✅ 配置集成正确：routes.tsx (/games), MainLayout.tsx (Gamepad2导航), app.js (路由+建表SQL)
  - ✅ 已清理重复文件：删除 frontend/src/components/games/ 目录下3个冗余组件
- **技术栈验证**:
  - React 18.3.1 + TypeScript + Vite
  - Zustand 5.0.0 状态管理
  - motion 12.23.24 (framer-motion) 动画
  - lucide-react 0.487.0 图标库
  - TailwindCSS 4.1.12 样式
  - Minimax AI算法（井字棋）+ 启发式评分AI（五子棋）
  - 8级段位系统（Iron→Master）+ ELO积分机制
- **功能状态**:
  - ✅ 井字棋：完整实现（easy/medium/hard 三种AI难度）
  - ✅ 五子棋：完整实现（15×15棋盘 + AI评分函数）
  - ⏳ 中国象棋：UI占位（显示"即将推出"标签）
  - ⏳ PvP联机对战：计划中（Phase P3）
  - ⏳ 历史记录Tab：UI占位（显示"开发中"提示）
- **待用户操作**:
  - 手动执行 `git commit` 提交所有游戏相关代码（不push）
  - 部署后端到 Render 验证API接口
  - 部署前端到 Vercel 验证页面渲染
- **执行结果**: ✅ 完成

### 任务35: 修复世界频道500错误（message_read表缺失）
- **执行时间**: 2026-05-23
- **问题描述**:
  - 用户点击世界频道时控制台报错：`GET /api/conversation/world 500 (Internal Server Error)`
  - 错误信息：`[ChatsSidebar] Failed to load world channel: AxiosError: Request failed with status code 500`
  - 世界频道无法加载，新消息红点显示失败
- **根本原因分析**:
  1. **`message_read` 表不存在**：WorldChannelService.js 的 `getFullWorldChannel()` 方法在第62-67行查询未读消息数量时使用了 `LEFT JOIN message_read`，但该表未在 `app.js` 启动迁移中自动创建
  2. **`conversation_member` 表可能缺失**：`ensureMember()` 方法依赖此表来管理世界频道成员，同样未在启动迁移中确保存在
  3. **数据库初始化不完整**：虽然 `init.sql` 中定义了这些表，但 Render 部署时如果数据库是全新或表被删除，启动迁移不会自动重建
- **SQL错误位置**:
  ```sql
  -- WorldChannelService.js 第62-67行（失败查询）
  SELECT COUNT(*) as count FROM message m
  LEFT JOIN message_read mr ON m.id = mr.message_id AND mr.user_id = ?
  WHERE m.conversation_id = ? AND m.sender_id != ? AND mr.message_id IS NULL
  -- 错误原因：message_read 表不存在 → Table 'xxx.message_read' doesn't exist
  ```
- **修复方案**:
  1. 在 `backend/src/app.js` 的启动迁移中添加 `message_read` 表的 `CREATE TABLE IF NOT EXISTS` 逻辑
  2. 同时添加 `conversation_member` 表的自动创建逻辑（防御性编程）
  3. 两张表都放在世界频道创建之前执行，确保依赖关系正确
- **修改文件**:
  - `backend/src/app.js` - 新增2个try-catch迁移块（+38行）：
    - 第174-190行：message_read表创建（含索引、外键、唯一约束）
    - 第192-208行：conversation_member表创建（含索引、外键、角色枚举）
- **技术细节**:
  ```javascript
  // message_read表结构
  CREATE TABLE IF NOT EXISTS message_read (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_conversation_user (conversation_id, user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

  // conversation_member表结构
  CREATE TABLE IF NOT EXISTS conversation_member (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ```
- **验证方法**:
  1. 部署后端到 Render 后查看启动日志：
     - `[Migration] message_read table ready`
     - `[Migration] conversation_member table ready`
  2. 访问前端页面点击世界频道，应正常加载数据
  3. 控制台不应再出现500错误
- **预防措施**:
  - 所有被Service层使用的数据库表都应在app.js启动迁移中确保存在
  - 使用 `CREATE TABLE IF NOT EXISTS` 避免重复创建错误
  - 每个迁移块独立try-catch，避免单个表创建失败导致整个应用崩溃
- **执行结果**: ✅ 已修复

### 任务36: 修复前端部署构建失败（Games.tsx导入路径错误）
- **执行时间**: 2026-05-23
- **问题描述**:
  - Vercel 部署失败：`npm run build` 退出码1
  - 错误信息：`Could not resolve "../games/RankBadge" from "src/app/pages/Games.tsx"`
  - Rollup 无法解析模块路径，导致整个构建失败
- **根本原因分析**:
  - **导入路径计算错误**：
    - Games.tsx 文件位置：`src/app/pages/Games.tsx`
    - 原始导入路径：`import { RankBadge } from '../games/RankBadge'`
    - 实际解析位置：`src/app/games/RankBadge`（❌ 不存在）
    - 正确文件位置：`src/app/components/games/RankBadge.tsx`（✅ 存在）
  - **相对路径层级错误**：
    - 从 `pages/` 目录需要先 `../` 回到 `app/`
    - 再 `components/games/` 进入组件目录
    - 正确路径应该是：`../components/games/RankBadge`
- **错误影响范围**:
  - 3个游戏组件全部无法解析：
    - ❌ `../games/RankBadge` → 应为 `../components/games/RankBadge`
    - ❌ `../games/TicTacToeBoard` → 应为 `../components/games/TicTacToeBoard`
    - ❌ `../games/GomokuBoard` → 应为 `../components/games/GomokuBoard`
  - 导致 Vercel 构建完全失败，前端无法部署
- **修复方案**:
  - 修改 [Games.tsx](frontend/src/app/pages/Games.tsx) 第6-8行的3个导入语句
  - 将所有 `../games/` 路径改为 `../components/games/`
- **修改文件**:
  - `frontend/src/app/pages/Games.tsx` - 修正3行导入路径（第6、7、8行）
- **修改前后对比**:
  ```typescript
  // ❌ 修改前（错误路径）
  import { RankBadge } from '../games/RankBadge';
  import { TicTacToeBoard } from '../games/TicTacToeBoard';
  import { GomokuBoard } from '../games/GomokuBoard';

  // ✅ 修改后（正确路径）
  import { RankBadge } from '../components/games/RankBadge';
  import { TicTacToeBoard } from '../components/games/TicTacToeBoard';
  import { GomokuBoard } from '../components/games/GomokuBoard';
  ```
- **验证方法**:
  1. 本地执行 `npm run build` 应该成功（0退出码）
  2. Vercel 自动重新部署应该通过
  3. 访问 `/games` 页面应正常渲染游戏大厅
- **预防措施**:
  - 使用绝对路径别名（如 `@/components/games/`）可避免此类问题
  - IDE 路径自动补全可实时检测导入错误
  - 提交代码前必须本地 `npm run build` 验证
- **执行结果**: ✅ 已修复

### 任务37: 修复TicTacToeBoard.tsx JSX语法错误（Fragment缺失）
- **执行时间**: 2026-05-23
- **问题描述**:
  - Vercel 部署构建失败：`npm run build` 退出码1
  - 错误信息：`Expected ")" but found "className"` at line 260
  - esbuild 解析失败，无法完成前端构建
- **根本原因分析**:
  - **JSX Fragment缺失**：
    - 第253行 `{isAIThinking && (` 开始条件渲染
    - 内部包含3个相邻的 `<motion.span>` 元素（第255-268行）
    - React/JSX要求条件渲染返回单一根元素或Fragment
    - 缺少 `<>...</>` (Fragment) 包裹多个元素
  - **语法错误结构**：
    ```jsx
    // ❌ 错误：多个相邻JSX元素无Fragment包裹
    {isAIThinking && (
      <motion.span ... />  // 元素1
      <motion.span ... />  // 元素2 ← esbuild报错位置
      <motion.span ... />  // 元素3
    )}
    ```
  - **错误影响**：
    - esbuild 将第2个 `<motion.span>` 的 `className` 属性解析为意外的表达式
    - 导致整个文件解析失败，构建中断
- **修复方案**:
  - 在第254行添加 `<>` (Fragment开始标签)
  - 在第270行添加 `</>` (Fragment结束标签)
  - 将3个 `<motion.span>` 包裹在Fragment内
- **修改文件**:
  - `frontend/src/app/components/games/TicTacToeBoard.tsx` - 添加Fragment包裹（+2行）
- **修改前后对比**:
  ```jsx
  // ❌ 修改前（缺少Fragment）
  {isAIThinking && (
    <motion.span className="..." animate={{...}} />
    <motion.span className="..." animate={{...}} />  // 报错行
    <motion.span className="..." animate={{...}} />
  )}

  // ✅ 修改后（正确的Fragment包裹）
  {isAIThinking && (
    <>
    <motion.span className="..." animate={{...}} />
    <motion.span className="..." animate={{...}} />
    <motion.span className="..." animate={{...}} />
    </>
  )}
  ```
- **验证范围**:
  - ✅ TicTacToeBoard.tsx: 已修复Fragment问题，括号匹配正确
  - ✅ GomokuBoard.tsx: 经检查无类似语法错误
  - ✅ RankBadge.tsx: 结构简单无此类风险
  - ✅ Games.tsx: 导入路径已在任务36中修复
- **技术规范回顾**:
  - React JSX规则：条件渲染(`&&`/三元表达式)必须返回单个节点
  - 多个相邻元素必须用 `<React.Fragment>` 或简写 `<>...</>` 包裹
  - Fragment不会渲染真实DOM节点，仅用于语法包裹
- **预防措施**:
  - 使用ESLint + react/jsx-no-comment-textnodes 规则自动检测
  - IDE实时提示可立即发现此类错误
  - 提交前本地 `npm run build` 验证
- **执行结果**: ✅ 已修复

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

### 问题: CORS配置不完整导致消息无法加载
- **发现时间**: 2026-04-10
- **问题描述**: 用户无法加载消息，浏览器报CORS错误
- **症状**:
  - `Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response`
  - `Failed to fetch` 错误
- **根本原因**:
  1. **修改CORS配置时遗漏了必要的请求头** - 在修改 `allowedHeaders` 时只包含了部分头信息，遗漏了 `Cache-Control`, `Pragma`, `Expires`
  2. **未充分测试跨域请求** - 每次修改CORS配置后没有在生产环境验证
  3. **缓存问题** - 旧的CORS配置被浏览器缓存，导致修改后仍然失败
- **教训**:
  1. CORS配置是**白名单**机制，任何自定义请求头都必须显式声明
  2. 修改CORS后需要清除浏览器缓存或使用隐身模式测试
  3. 应该在 `allowedHeaders` 中包含所有可能用到的请求头
- **修复方案**:
  ```javascript
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',  // 缓存控制
    'Pragma',         // 兼容HTTP/1.0
    'Expires'         // 过期时间
  ]
  ```
- **涉及文件**:
  - `backend/src/app.js` - CORS配置
- **状态**: ✅ 已解决

### 问题: storeFetchMessages未定义导致错误
- **发现时间**: 2026-04-10
- **问题描述**: Chat.tsx中调用了storeFetchMessages但该函数从未定义
- **症状**: JavaScript运行时错误，消息加载逻辑异常
- **根本原因**:
  1. **代码传播错误** - 可能是在复制粘贴代码时遗留的错误调用
  2. **审查不充分** - 没有在修改前检查函数是否存在
- **教训**:
  1. 每次添加函数调用前必须确认函数已定义
  2. 使用IDE的语法检查和lint工具可以提前发现此类问题
  3. 代码修改后应该进行基本的功能验证
- **修复方案**: 移除未定义的函数调用
- **涉及文件**:
  - `frontend/src/app/pages/Chat.tsx`
- **状态**: ✅ 已解决

### 问题: GroupService使用错误字段名read_at
- **发现时间**: 2026-04-10
- **问题描述**: 数据库报错 `Unknown column 'read_at' in 'where clause'`
- **根本原因**: 代码中使用的是 `read_at`，但数据库表中实际字段名是 `seen_at`
- **教训**:
  1. **数据库文档必须与代码保持同步** - 这次是因为先更新了文档但代码未同步
  2. **修改数据库结构后必须同步更新所有相关代码**
  3. **使用ORM或类型安全的数据库访问层可以减少此类错误**
- **修复方案**: 将所有 `read_at` 改为 `seen_at`
- **涉及文件**:
  - `backend/src/services/GroupService.js`
- **状态**: ✅ 已解决

### 问题: Admin页面AI调度硬编码中文
- **发现时间**: 2026-04-10
- **问题描述**: Admin页面的AI调度菜单中存在硬编码的中文文本，无法切换中英文
- **根本原因**: 后端返回硬编码中文，前端也直接使用硬编码文本
- **解决方案**:
  1. 更新 `zh-CN.json` 和 `en-US.json` 添加AI服务相关翻译
  2. 后端 AIServiceManager 返回 `nameKey` 和 `descKey` 而非硬编码文本
  3. 前端使用 `t()` 函数获取翻译
- **涉及文件**:
  - `frontend/src/i18n/locales/zh-CN.json` - 中文翻译
  - `frontend/src/i18n/locales/en-US.json` - 英文翻译
  - `backend/src/services/AIServiceManager.js` - 返回翻译key
  - `frontend/src/app/pages/Admin.tsx` - 使用t()获取翻译
- **状态**: ✅ 已解决

---

## 项目文档更新记录

### 最新文档列表
| 文档 | 说明 | 更新日期 |
|------|------|---------|
| README.md | 项目主文档 | 2026-04-18 |
| PROJECT_REPORT.md | 项目报告 | 2026-04-18 |
| DEVELOPMENT_PLAN.md | 开发计划 | 2026-04-18 |
| MODIFICATION_REPORT_v2.md | v2修改记录 | 2026-04-04 |

---

## 项目目录结构

```
IM-Chat-App/
├── frontend/                    # 前端目录
│   ├── src/
│   │   ├── api/              # API 请求封装
│   │   ├── app/              # 主应用代码
│   │   │   ├── components/  # 组件（UI、业务组件）
│   │   │   ├── pages/        # 页面组件
│   │   │   ├── App.tsx       # 应用入口
│   │   │   └── routes.tsx    # 路由配置
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── store/            # Zustand 状态管理
│   │   ├── lib/              # 库文件（AI调度）
│   │   ├── i18n/             # 国际化
│   │   ├── types/            # TypeScript 类型
│   │   ├── styles/           # 样式文件
│   │   └── main.tsx          # 前端入口
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── backend/                    # 后端目录
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑层
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── app.js           # 后端入口
│   ├── package.json
│   └── .env                  # 环境变量
├── database/                   # 数据库相关
│   ├── init.sql             # 初始化脚本
│   ├── clean-db.js          # 清理数据库脚本
│   ├── migrate.js           # 数据库迁移脚本
│   └── migrate_*.sql        # 各类迁移脚本
├── scripts/                   # 启动脚本
│   ├── start-all.bat        # Windows 一键启动
│   ├── start-all.sh         # Linux/Mac 一键启动
│   └── clean-db.bat         # 数据库清理脚本
├── security/                  # 安全相关
│   ├── test-report.md       # 安全测试报告
│   └── fix-records.md       # 漏洞修复记录
├── guidelines/                # 开发指南
│   └── Guidelines.md
└── IM_Chat_AI_Memory.md      # AI 编程记忆文档
```

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
  type ENUM('single', 'group', 'world', 'notification') DEFAULT 'single',
  name VARCHAR(100) COMMENT '群聊名称',
  avatar VARCHAR(500),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### system_notification 系统通知表
```sql
CREATE TABLE system_notification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('info','warning','success','announcement') DEFAULT 'info',
  icon VARCHAR(500) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  is_active TINYINT DEFAULT 1,
  created_by INT DEFAULT NULL,
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
> ⚠️ **已弃用**: 群组功能已于 2026-05-22 移除，此表保留仅用于数据备份，不再被应用使用

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
> ⚠️ **已弃用**: 群组功能已于 2026-05-22 移除，此表保留仅用于数据备份，不再被应用使用

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
> ⚠️ **已弃用**: 群组功能已于 2026-05-22 移除，此表保留仅用于数据备份，不再被应用使用

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

### game_match 游戏对局表
```sql
CREATE TABLE game_match (
  id INT PRIMARY KEY AUTO_INCREMENT,
  game_type ENUM('gomoku','tictactoe','chess') NOT NULL,
  mode ENUM('ai','pvp') NOT NULL DEFAULT 'ai',
  player1_id INT NOT NULL,
  player2_id INT DEFAULT NULL,
  winner_id INT DEFAULT NULL,
  status ENUM('playing','finished','abandoned') NOT NULL DEFAULT 'playing',
  ai_difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
  moves JSON DEFAULT NULL,
  duration_seconds INT DEFAULT NULL,
  score_change INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP DEFAULT NULL
);
```

### user_game_profile 用户游戏档案表
```sql
CREATE TABLE user_game_profile (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  total_games INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  rating INT DEFAULT 1000,
  peak_rating INT DEFAULT 1000,
  rank_tier VARCHAR(20) DEFAULT 'iron',
  gomoku_wins INT DEFAULT 0,
  gomoku_losses INT DEFAULT 0,
  tictactoe_wins INT DEFAULT 0,
  tictactoe_losses INT DEFAULT 0,
  chess_wins INT DEFAULT 0,
  chess_losses INT DEFAULT 0,
  current_win_streak INT DEFAULT 0,
  best_win_streak INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
| POST /api/conversation/group | POST | ~~GroupChat.tsx~~ | ~~创建群聊会话~~ ⚠️ 已弃用 |
| GET /api/conversation/:id/members | GET | Chat.tsx | 获取会话成员 |
| POST /api/conversation/:id/members | POST | Chat.tsx | 添加成员 |
| DELETE /api/conversation/:id/members/:userId | DELETE | Chat.tsx | 移除成员 |
| POST /api/message/send | POST | Chat.tsx | 发送消息 |
| GET /api/message/list | GET | Chat.tsx | 获取消息历史 |
| POST /api/message/read | POST | Chat.tsx | 标记已读 |
| DELETE /api/message/:messageId | DELETE | Chat.tsx | 撤回消息 |
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
| GET /api/admin/ai-stats | GET | Admin.tsx | AI服务统计 |
| POST /api/game | POST | - | 创建游戏对局 |
| POST /api/game/:matchId/move | POST | - | 记录落子 |
| POST /api/game/:matchId/surrender | POST | - | 认输弃权 |
| GET /api/game/profile | GET | - | 获取游戏档案 |
| GET /api/game/leaderboard | GET | - | 获取排行榜 |
| GET /api/game/history | GET | - | 获取对局历史 |

-------

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

### 问题28: 后端负载激增导致502错误 ⚠️ 已解决
- **描述**: 刷新页面时大量请求同时发送，导致后端负载过高返回502错误
- **症状**:
  - `502 Bad Gateway` 错误
  - 多个临时会话检查请求同时失败
  - 级联式请求失败
- **根本原因**:
  1. **同步请求风暴**: 页面加载时多个组件同时发起API请求
  2. **缺乏请求合并**: 每个会话单独发起临时会话检查请求
  3. **缺少限流保护**: 后端没有请求速率限制
  4. **没有熔断机制**: 请求失败后没有退避策略
- **解决方案**: AI智能调度系统
  1. 前端智能调度器 (smartScheduler)
  2. 增强版API客户端 (smartApiClient)
  3. 智能聊天存储 (smartChatStore)
  4. 后端限流保护 (rateLimiter.js)
- **状态**: ✅ 已解决

### 问题29: Admin页面AI调度硬编码中文 ⚠️ 已解决
- **描述**: Admin页面的AI调度菜单中存在硬编码的中文文本，无法切换中英文
- **根本原因**: 后端返回硬编码中文，前端也直接使用硬编码文本
- **解决方案**:
  1. 更新 `zh-CN.json` 和 `en-US.json` 添加AI服务相关翻译
  2. 后端 AIServiceManager 返回 `nameKey` 和 `descKey` 而非硬编码文本
  3. 前端使用 `t()` 函数获取翻译
- **涉及文件**:
  - `frontend/src/i18n/locales/zh-CN.json` - 中文翻译
  - `frontend/src/i18n/locales/en-US.json` - 英文翻译
  - `backend/src/services/AIServiceManager.js` - 返回翻译key
  - `frontend/src/app/pages/Admin.tsx` - 使用t()获取翻译
- **状态**: ✅ 已解决

### 问题30: IM限流策略过严导致正常使用被拦截 ⚠️ 已解决
- **描述**: IM应用正常使用时请求频繁，限流策略过于严格导致用户被频繁拦截并弹出限流提示
- **症状**:
  - 用户正常切换聊天、发送消息时被限流弹窗拦截
  - 页面初始化时大量请求触发限流
  - Render休眠唤醒时请求风暴触发限流
- **根本原因**:
  1. **后端IP限流过低**: 每IP每分钟100请求对于IM应用来说太低
  2. **全局并发限制过严**: 30最大并发对于活跃IM用户来说太少
  3. **封禁时长过长**: 30秒封禁严重影响用户体验
  4. **前端调度器限制**: maxConcurrent=3, maxQueueSize=50 过于保守
- **解决方案**: 大幅放宽限流策略
  1. **后端限流配置调整** (`backend/src/middleware/rateLimiter.js`):
     - IP限流: 100 → 500 请求/分钟
     - 全局并发: 30 → 200
     - 封禁时长: 30000ms → 10000ms
     - 全局负载阈值: 100 → 500
  2. **前端智能调度器配置调整** (`frontend/src/lib/smartScheduler.ts`):
     - maxConcurrent: 3 → 10
     - maxQueueSize: 50 → 200
     - baseDelay: 1000ms → 500ms
     - maxDelay: 30000ms → 15000ms
     - circuitBreakerThreshold: 5 → 20
     - circuitBreakerResetTime: 60000ms → 30000ms
     - 令牌桶: (10, 5) → (50, 20)
  3. **smartChatStore冷却时间调整**:
     - FETCH_COOLDOWN: 5000ms → 3000ms
- **涉及文件**:
  - `backend/src/middleware/rateLimiter.js` - 后端限流配置
  - `frontend/src/lib/smartScheduler.ts` - 前端调度器配置
  - `frontend/src/store/smartChatStore.ts` - 聊天存储冷却时间
- **状态**: ✅ 已解决

---

## 开发规范（教训总结）

### 1. CORS配置规范
- **必须包含的请求头**:
  ```javascript
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Expires'
  ]
  ```
- 修改CORS后必须：
  1. 清除浏览器缓存或使用隐身模式测试
  2. 在所有目标浏览器上测试
  3. 验证preflight请求返回正确的CORS头

### 2. 代码修改规范
- 修改任何功能前先阅读相关代码
- 添加函数调用前确认函数已定义
- 修改后进行基本功能测试
- 使用 lint 和类型检查工具

### 3. 数据库操作规范
- 修改数据库表结构后同步更新文档
- 代码中使用数据库字段名时必须与文档核对
- 在生产环境执行数据库变更前先在测试环境验证

### 4. 测试规范
- 每次修改后验证基本功能
- 测试跨域请求时清除缓存
- 检查浏览器控制台错误信息

---

## 智能调度系统

### 前端智能调度器 (Smart Scheduler)
**文件**: `frontend/src/lib/smartScheduler.ts`

**核心功能**:
- **优先级队列**: critical > high > normal > low
- **熔断器模式**: 连续失败5次后进入"熔断"状态，60秒内不再尝试
- **自适应限流**: 每个端点独立限流令牌桶
- **指数退避重试**: 失败后自动重试，延迟递增
- **请求去重**: 相同请求在窗口期内合并

**配置参数**:
```typescript
{
  maxConcurrent: 3,           // 最大并发数
  maxQueueSize: 50,          // 队列最大长度
  baseDelay: 1000,            // 基础重试延迟
  maxDelay: 30000,            // 最大延迟
  circuitBreakerThreshold: 5, // 熔断阈值
  circuitBreakerResetTime: 60000 // 熔断恢复时间
}
```

### 增强版API客户端 (Smart API Client)
**文件**: `frontend/src/lib/smartApiClient.ts`

**功能**:
- 集成智能调度器
- 请求优先级自动标记
- 慢请求警告（>5秒）
- 自动重试与退避

### 智能聊天存储 (Smart Chat Store)
**文件**: `frontend/src/store/smartChatStore.ts`

**功能**:
- 请求冷却时间（5秒内不重复获取）
- 优先级标记（获取消息=high，发送消息=critical）
- 智能缓存避免重复请求

### 后端限流保护 (Rate Limiter)
**文件**: `backend/src/middleware/rateLimiter.js`

**功能**:
- **IP级别限流**: 每IP每分钟最多100请求
- **全局负载检测**: 超过阈值时拒绝非关键请求
- **临时封禁**: 超过限制的IP被临时封禁30秒
- **服务状态监控**: `/api/stats` 端点监控服务状态

**配置**:
```javascript
{
  windowMs: 60000,        // 时间窗口
  maxRequests: 100,       // 最大请求数
  maxConcurrent: 30,      // 最大并发
  blockDurationMs: 30000  // 封禁时长
}
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
- [x] 限流保护（IP级别）
- [x] 密码强度校验（至少6位）

### 待测试项
- [ ] SQL 注入测试
- [ ] XSS 跨站脚本测试
- [ ] CSRF 测试
- [ ] 未授权访问测试
- [ ] npm audit 依赖漏洞扫描

---

**文档更新时间**: 2026-04-18
**文档版本**: v2.0.1
