# Code Kitty IM 开发指南

## 一、国际化(i18n)规范 ⚠️ 重要

### 1.1 必须使用 i18n

**所有用户可见的文本必须使用 i18n，不得硬编码中文或英文。**

用户界面中包含的文本必须通过 i18n 系统获取，包括：
- 页面标题和标题
- 按钮文本
- 表单标签和占位符
- 提示信息和错误消息
- 下拉菜单选项
- 弹窗内容
- Admin 后台所有文本

### 1.2 i18n 文件位置

| 文件 | 语言 |
|------|------|
| `frontend/src/i18n/locales/zh-CN.json` | 中文 |
| `frontend/src/i18n/locales/en-US.json` | 英文 |

### 1.3 翻译 key 命名规范

```
模块.具体内容
```

示例：
```json
{
  "admin": {
    "title": "后台管理",
    "users": "用户管理",
    "refresh": "刷新"
  },
  "aiServices": {
    "title": "AI智能调度中心",
    "intelligentCache": "智能缓存服务"
  }
}
```

### 1.4 前端组件中使用

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('admin.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 1.5 后端返回可翻译 key

后端 API 返回的用户可见文本必须使用翻译 key，而非硬编码文本：

```javascript
// ❌ 错误 - 硬编码中文
return {
  name: '智能缓存服务',
  description: 'AI驱动的智能缓存系统'
};

// ✅ 正确 - 返回翻译 key
return {
  nameKey: 'aiServices.intelligentCache',
  descKey: 'aiServices.intelligentCacheDesc'
};
```

### 1.6 新增翻译流程

1. 在 `zh-CN.json` 和 `en-US.json` 中添加翻译
2. 使用 `t('key')` 在组件中获取翻译
3. 后端使用 `nameKey`/`descKey` 模式返回翻译 key

---

## 二、代码编写规范

### 2.1 API 规范

1. **所有接口必须加 try-catch，绝不返回 500**
2. **所有返回格式统一 `{ code, data, msg }`**
3. **所有 SQL 避免 SELECT *，使用明确字段**
4. **所有跨域支持线上域名，不写死 localhost**
5. **所有前端地址从 `import.meta.env` 读取**
6. **MySQL2 分页必须用 `LIMIT ${num} OFFSET ${num}` 拼接，禁止占位符 `?`**
7. **前端调用 API 后，响应拦截器已返回 `{ code, data, msg }`，直接用 `response.code` 判断**

### 2.2 CORS 配置规范

修改 CORS 配置时必须包含以下请求头：

```javascript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',   // 必须
  'Pragma',         // 必须
  'Expires'         // 必须
]
```

### 2.3 核心逻辑保护

以下文件是即时通讯核心逻辑，**禁止随意修改**：

1. `frontend/src/hooks/useWebSocket.ts` - Pusher WebSocket 实时通信核心
2. `frontend/src/store/chatStore.ts` - 聊天状态管理核心
3. `frontend/src/app/pages/Chat.tsx` - 即时通讯页面核心
4. `backend/src/services/MessageService.js` - 消息服务核心
5. `backend/src/services/ConversationService.js` - 会话服务核心
6. `backend/src/utils/pusher.js` - Pusher 广播工具

如需修改即时通讯相关功能，必须：
1. 先备份原文件
2. 通知团队成员
3. 修改后进行全面测试
4. 确保不影响 Pusher 实时推送功能

---

## 三、数据库规范

### 3.1 字段命名

- 使用小写下划线命名：`user_id`, `created_at`
- 避免使用 SQL 保留字作为字段名
- 时间字段使用 `created_at`, `updated_at` 命名

### 3.2 字段类型参考

| 数据类型 | 使用场景 |
|----------|----------|
| INT | 主键、计数 |
| VARCHAR | 短文本（用户名、邮箱） |
| TEXT | 长文本（消息内容、动态） |
| ENUM | 有限选项（状态、角色） |
| TIMESTAMP | 时间记录 |
| JSON | 结构化数据（图片数组） |

### 3.3 索引规范

- 主键自动索引
- 外键字段添加索引
- 频繁查询的字段添加索引
- 避免过多索引影响写入性能

---

## 四、安全规范

### 4.1 密码安全

- 使用 bcrypt 加密密码
- 不得明文存储密码
- Token 使用 JWT，设置合理过期时间

### 4.2 SQL 注入防护

- 使用参数化查询
- 禁止拼接用户输入到 SQL 语句
- 对用户输入进行验证和过滤

### 4.3 XSS 防护

- React 默认转义 HTML
- 避免使用 `dangerouslySetInnerHTML`
- 用户输入需要显示时进行转义

---

## 五、Git 协作规范

### 5.1 提交信息规范

```
<type>: <subject>

<body>
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关

### 5.2 分支管理

- `main`: 主分支，稳定版本
- `feature/*`: 功能分支
- `fix/*`: 修复分支

---

## 六、测试规范

### 6.1 功能测试

每次修改后验证：
1. 相关页面正常加载
2. 核心功能正常工作
3. 无控制台错误

### 6.2 CORS 测试

修改 CORS 配置后：
1. 清除浏览器缓存
2. 使用隐身模式测试
3. 验证 preflight 请求返回正确 CORS 头

---

## 七、部署规范

### 7.1 环境变量

开发时确保 `.env` 文件包含所有必要变量，参考 `.env.example`。

### 7.2 数据库迁移

1. 修改数据库表结构后同步更新文档
2. 在生产环境执行迁移前先在测试环境验证
3. 记录所有数据库变更

### 7.3 Render 部署

- 确认 Node.js 版本兼容（>=18）
- 检查环境变量是否完整设置
- 部署后检查日志确认无错误
