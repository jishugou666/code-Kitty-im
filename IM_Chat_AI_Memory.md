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
| 实时通讯 | WebSocket (ws) | 8.18.0 |
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

### 代码编写铁律（永久遵守）
1. **所有接口必须加 try-catch，绝不返回 500**
2. **所有返回格式统一 `{ code, data, msg }`**
3. **所有 SQL 避免 SELECT *，使用明确字段**
4. **所有跨域支持线上域名，不写死 localhost**
5. **所有前端地址从 `import.meta.env` 读取**

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

---

## 全局依赖映射

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

### 后端依赖 (backend/package.json)
| 依赖包 | 版本 | 用途 |
|--------|------|------|
| express | ^4.21.0 | Web框架 |
| mysql2 | ^3.11.0 | MySQL驱动 |
| bcrypt | ^5.1.1 | 密码加密 |
| jsonwebtoken | ^9.0.2 | JWT认证 |
| ws | ^8.18.0 | WebSocket |
| cors | ^2.8.5 | 跨域处理 |
| dotenv | ^16.4.5 | 环境变量 |
| express-validator | ^7.2.0 | 参数校验 |
| uuid | ^10.0.0 | UUID生成 |

---

## 数据库表结构

### user 用户表
```sql
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  avatar VARCHAR(500),
  email VARCHAR(100),
  phone VARCHAR(20),
  status TINYINT DEFAULT 1 COMMENT '1在线 0离线',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

### contact 联系人表
```sql
CREATE TABLE contact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  contact_user_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES user(id) ON DELETE CASCADE
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
