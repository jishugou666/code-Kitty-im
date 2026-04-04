# Code Kitty IM - 即时通讯应用

一款功能完整的全栈即时通讯(IM)应用，采用 React + Node.js + MySQL 技术栈构建。

## 项目截图

<!-- 添加项目截图 -->

## 功能特性

### 用户功能
- ✅ 用户注册与登录（JWT认证）
- ✅ 用户资料管理
- ✅ 搜索用户
- ✅ 在线状态显示

### 即时通讯
- ✅ 单聊和群聊
- ✅ 实时消息收发（WebSocket）
- ✅ 消息类型支持：文本、图片、文件
- ✅ 消息搜索
- ✅ 消息已读未读状态
- ✅ 历史消息加载

### 联系人管理
- ✅ 添加/删除联系人
- ✅ 联系人列表管理
- ✅ 联系人搜索

### 群聊功能
- ✅ 创建群聊
- ✅ 群聊成员管理（添加/移除）
- ✅ 群聊信息展示

## 技术栈

### 前端
- **框架**: React 18 + Vite 6
- **语言**: TypeScript
- **样式**: TailwindCSS
- **UI组件**: Radix UI + shadcn/ui + MUI Icons
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **路由**: React Router v7
- **动画**: Motion

### 后端
- **运行环境**: Node.js
- **框架**: Express 4
- **数据库**: MySQL 8.0+
- **实时通讯**: WebSocket (ws)
- **认证**: JWT + bcrypt
- **数据验证**: express-validator

### 数据库
- **类型**: MySQL
- **连接池**: mysql2/promise

## 项目结构

```
CDK IM/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务服务
│   │   ├── utils/          # 工具函数
│   │   └── app.js          # 主入口
│   ├── .env                # 环境变量
│   └── package.json
│
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── api/           # API封装
│   │   ├── app/           # 应用页面和组件
│   │   ├── hooks/        # 自定义Hooks
│   │   ├── store/        # 状态管理
│   │   └── types/        # 类型定义
│   └── package.json
│
├── database/               # 数据库脚本
│   ├── init.sql          # 初始化脚本
│   └── migrate.js        # 迁移工具
│
├── scripts/               # 启动脚本
│   ├── start-all.bat     # Windows启动脚本
│   └── start-all.sh       # Unix启动脚本
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
cp .env.example .env  # 如果存在示例文件
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

### 联系人接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/contact/list | 获取联系人列表 | 是 |
| POST | /api/contact/add | 添加联系人 | 是 |
| DELETE | /api/contact/:userId | 删除联系人 | 是 |

## 数据库表结构

### user 用户表
- `id` - 主键
- `username` - 用户名（唯一）
- `password` - 密码哈希
- `nickname` - 昵称
- `avatar` - 头像URL
- `email` - 邮箱
- `phone` - 电话
- `status` - 在线状态(0:离线, 1:在线)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### conversation 会话表
- `id` - 主键
- `type` - 类型(single/group)
- `name` - 群聊名称
- `avatar` - 群头像
- `created_by` - 创建者ID
- `created_at` - 创建时间
- `updated_at` - 更新时间

### conversation_member 会话成员表
- `id` - 主键
- `conversation_id` - 会话ID
- `user_id` - 用户ID
- `role` - 角色(admin/member)
- `joined_at` - 加入时间

### message 消息表
- `id` - 主键
- `conversation_id` - 会话ID
- `sender_id` - 发送者ID
- `content` - 消息内容
- `type` - 类型(text/image/file)
- `is_read` - 是否已读
- `created_at` - 创建时间

### contact 联系人表
- `id` - 主键
- `user_id` - 用户ID
- `contact_id` - 联系人ID
- `created_at` - 添加时间

## 安全特性

- ✅ 密码 bcrypt 加密存储
- ✅ JWT Token 认证
- ✅ 参数化查询防止 SQL 注入
- ✅ XSS 防护
- ✅ CORS 配置
- ✅ 输入验证

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

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

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
