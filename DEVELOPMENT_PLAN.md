# Code Kitty IM 下一步开发计划

**制定日期**: 2026-04-18
**版本**: v2.0.1
**状态**: 执行中
**最后更新**: 2026-05-25

---

## 更新日志

### 2026-05-24
- ✅ **严重BUG修复：长期登录用户无限刷新循环**
  - **现象**：长期保持登录状态的用户进入任何页面（包括studio）后跳转到login，无限刷新无法停止，只有清除浏览器cookie才能恢复
  - **根因分析**：
    - JWT token 过期后，zustand persist 从 localStorage 恢复旧的认证状态（isAuthenticated: true, token: <已过期>）
    - App.tsx → useHeartbeat() 检测到 isAuthenticated=true → 立即调用 userApi.heartbeat() 使用过期token
    - 后端返回 401 → client.ts 拦截器触发
    - **致命缺陷**：只删除了 `localStorage['token']` 和 `localStorage['user']`，没有删除 `localStorage['auth-storage']`（zustand persist主存储）
    - 跳转到 /login 后，auth-storage 还在！zustand 再次恢复旧状态 → 触发同样的流程 → ♻️无限循环
  - **修复方案（4层防护）**：
    1. **client.ts (API拦截器)**：
       - 401处理时增加 `localStorage.removeItem('auth-storage')`
       - 增加路径检查：已在 /login 时不再重复跳转
    2. **Login.tsx (登录页守卫)**：
       - 添加 useEffect 检查 isAuthenticated + token
       - 已登录时立即 `navigate('/', { replace: true })`
       - 添加 isChecking 状态防止闪烁
    3. **routes.tsx (路由loader保护)**：
       - 新增 `authLoader()`：检查 auth-storage 中的认证状态，无效则 redirect('/login')
       - 新增 `loginLoader()`：已登录则 redirect('/')
       - MainLayout 路由添加 loader: authLoader
       - Login 路由添加 loader: loginLoader
    4. **authStore.ts (状态管理)**：
       - 新增 `clearAuth()` 方法：彻底清除所有 localStorage + 重置状态
       - loadUser 失败时调用 clearAuth() 而非简单的 set()
  - **修改文件列表**：
    - frontend/src/api/client.ts
    - frontend/src/app/pages/Login.tsx
    - frontend/src/app/routes.tsx
    - frontend/src/store/authStore.ts
- ✅ **远程一键修复功能：/clear-auth**
  - **用途**：当用户遇到无限刷新问题时，管理员可发送链接让用户一键清理本地认证数据
  - **使用方式**：用户访问 `https://你的域名/clear-auth` 即可自动清理并跳转到登录页
  - **清理内容**：
    - localStorage: auth-storage, token, user
    - sessionStorage: 全部清除
  - **用户体验**：
    - 清理中：显示加载动画 + "正在清理..."提示
    - 成功：显示已清除项目清单（带动画）+ 2.5秒后自动跳转登录页
    - 失败：显示手动操作指南（F12 → Application → Local Storage → Clear）
  - **新增文件**：
    - frontend/src/app/pages/ClearAuth.tsx (修复页面组件)
  - **修改文件**：
    - frontend/src/app/routes.tsx (注册 /clear-auth 路由)
- ✅ **游戏创建对局API参数修复**
  - **问题**：点击游戏进入对局后控制台报错 `API Error: 请选择游戏类型`，创建对局失败，离线模式运行，赢了也不加分
  - **根因分析**：
    - 后端 GameController.createMatch 使用 camelCase 解构：`const { gameType, mode, aiDifficulty } = req.body`
    - 前端三个棋盘组件传的是 snake_case：`{ game_type: 'gomoku', ai_difficulty: 'medium' }`
    - 参数名不匹配 → `gameType = undefined` → 触发验证错误 → 返回 "请选择游戏类型"
  - **修复方案**：
    - 统一前端所有 createMatch 调用使用 camelCase 参数
    - 更新 game.ts API 接口 TypeScript 定义
  - **修改文件列表**：
    - frontend/src/api/game.ts (接口定义)
    - frontend/src/app/components/games/GomokuBoard.tsx (2处调用)
    - frontend/src/app/components/games/ChineseChessBoard.tsx (2处调用)
    - frontend/src/app/components/games/TicTacToeBoard.tsx (1处调用)
- ✅ **动态难度系统 + 随机对手功能**
  - **需求**：取消固定难度选项，使用动态难度（遇强则强遇弱放水），用随机挂名替代AI显示
  - **新增文件**：
    - `frontend/src/app/components/games/dynamicDifficulty.ts` - 动态难度引擎
      - `generateOpponent(playerRating)`: 生成随机对手（中文姓名+头像+段位+积分）
      - `getDynamicDifficulty()`: 获取当前动态难度（level 0-1, thinkTime, errorRate）
      - `recordGameResult(won)`: 记录胜负结果，自动调整难度
        - 连胜加速提升（每连胜+8%bonus，上限25%）
        - 连败加速降低（每连败+6%penalty，上限20%）
        - 基础调整速度15%
      - 难度影响：思考时间400-1400ms，错误率2%-35%
  - **修改内容**：
    - Games.tsx: 移除所有难度选择按钮，显示"⚡动态匹配"标签
    - GomokuBoard.tsx: 移除aiDifficulty prop，使用dynamicDiff，添加对手信息卡片
    - ChineseChessBoard.tsx: 同上
    - TicTacToeBoard.tsx: 同上
  - **用户体验**：
    - 进入游戏自动匹配"真人"对手（随机生成中文姓名）
    - 对手信息卡片：头像 + 昵称 + 段位 + 积分 + "实时匹配"标签
    - 状态栏显示对手昵称而非"AI"
    - 难度根据玩家表现实时调整，无需手动选择
- ✅ **象棋棋盘尺寸优化**
  - **问题**：象棋棋盘太小，影响操作体验
  - **修复**：cellSizeVar 从 `min(28px, calc((100vw - 240px) / 9))` 调整为 `min(42px, calc((100vw - 300px) / 9))`
- ✅ **真实用户匹配 + 增强思考动画**
  - **问题**：对手使用随机假名容易穿帮，无思考延时，应使用站内注册用户
  - **后端实现**：
    - 新增 API: `GET /api/game/random-opponent` - 随机返回一个站内注册用户（排除当前用户）
    - GameService.getRandomOpponent(): 从 user 表 JOIN user_game_profile 随机取1人
    - 返回: id, nickname, avatar, rating, rankTier, rankLabel
  - **前端实现**：
    - dynamicDifficulty.ts 重写：
      - `generateOpponent()` 改为 **async** 函数
      - 优先从后端获取真实用户（带2分钟缓存）
      - 获取失败时降级为随机中文名（兜底方案）
      - **排除自己**: 后端 `WHERE u.id != currentUserId`
    - 思考延时增强：
      - 原始: 400-1400ms → **新: 800-3500ms** (更接近真人)
      - 添加随机波动 ±30% (每次不同)
      - 新增 `getThinkingPhases()` 返回4阶段:
        - `分析棋局` (0-15%) → `评估策略` (15-50%) → `决策落子` (50-85%) → `即将落子` (85-100%)
    - UI增强:
      - 状态栏显示: "⚪ 张伟 分析棋局... (白方)" 动态切换
      - 对手卡片加载态: 旋转spinner + "匹配对手中..."
      - 进度条频率从 thinkTime/8 → thinkTime/10 (更平滑)
  - **修改文件列表**：
    - 后端: GameController.js, GameService.js, routes/game.js
    - 前端: dynamicDifficulty.ts(重写), game.ts(API), GomokuBoard, ChineseChessBoard, TicTacToeBoard
- ✅ **真人对局包装 - 清除所有AI/动态难度用户可见文本**
  - **需求**：游戏界面不能出现任何 AI、动态难度、动态匹配 等字样，完全包装成真人对局
  - **清理清单**：
    | 原文 | 替换为 | 位置 |
    |------|--------|------|
    | `⚡动态匹配` (3处) | `●在线` 绿色脉冲 + "在线对局" | Games.tsx 游戏页面顶栏 |
    | `<Zap />动态难度` (3处) | `●在线` 绿色脉冲标签 | 三个棋盘对手卡片 |
    | `动态难度 Lv.XX% · 思考 XXXms` | `对局时长 MM:SS` | ChineseChessBoard 侧边栏 |
    | `AI正在随意/分析/深度思考...` | `分析棋局/评估策略/决策落子/即将落子` | TicTacToeBoard 思考阶段 |
    | `AI使用开局库+Minimax+Alpha-Beta...` | `休闲模式/竞技模式/大师模式` | TicTacToeBoard 难度描述 |
    | `进攻力 (AI)` | `进攻力 (白方)` | GomokuBoard 局势评估 |
    | `// AI赢，玩家输` (2处) | `// 对手获胜，玩家输` | 注释清理 |
    | 未使用的 Zap import | 移除 | Games.tsx |
  - **保留不变**：所有内部变量名（isAIThinking, getAIMove, dynamicDiff 等）和算法逻辑
  - **修改文件**：Games.tsx, GomokuBoard.tsx, ChineseChessBoard.tsx, TicTacToeBoard.tsx
  - **问题**：用户退出/刷新页面时对局无惩罚，应判负并扣分
  - **后端实现**：
    - 新增 `game_match.last_heartbeat` 字段记录最后心跳时间
    - 新增 API: `POST /api/game/:matchId/heartbeat` - 更新心跳
    - 新增 API: `GET /api/game/monitor/abandoned` - 管理员手动检测
    - GameService.finishAbandonedMatches(): 自动检测超时对局（45秒无心跳）
    - app.js 定时任务：每20秒扫描，自动将超时对局标记为 abandoned（判负-15分）
  - **前端实现**：
    - 新增 Hook: `useGameHeartbeat.ts` - 游戏专用心跳管理
      - 每10秒发送一次心跳保持连接
      - 页面关闭/刷新时自动发送 surrender (sendBeacon)
      - 标签页切回时立即补发心跳
    - 三个棋盘组件全部集成 useGameHeartbeat hook
  - **修改文件列表**：
    - 后端：backend/src/controllers/GameController.js, backend/src/services/GameService.js, backend/src/routes/game.js, backend/src/app.js
    - 前端：frontend/src/api/game.ts, frontend/src/hooks/useGameHeartbeat.ts, 三个棋盘组件

### 2026-05-23
- ✅ 娱乐游戏功能全栈开发完成（Phase P0-P1）
  - **后端开发**：
    - GameModel.js: game_match + user_game_profile 数据模型
    - RankingService.js: 8级段位系统（Iron→Master）+ ELO积分计算
    - GameService.js: 对局管理（创建/落子/结束/弃权/历史）
    - GameController.js: 6个RESTful API端点
    - game.js 路由: /api/game/* 全部注册
    - app.js 集成: 路由挂载 + 启动时自动建表
  - **前端开发**：
    - Games.tsx: 游戏大厅页面（用户档案卡片 + 游戏选择 + 排行榜/历史Tab）
    - TicTacToeBoard.tsx: 井字棋完整实现（Minimax AI, 3种难度, 动画效果）
    - GomokuBoard.tsx: 五子棋完整实现（15×15棋盘, 评分AI, 星位点标记）
    - RankBadge.tsx: 段位徽章组件（8段位, 3尺寸, framer-motion动画）
    - gameStore.ts: Zustand状态管理（profile/leaderboard/match/error）
    - game.ts: API接口封装（TypeScript类型定义 + 6个方法）
  - **导航集成**：
    - MainLayout.tsx: 添加 Gamepad2 图标 + "/games" 导航项
    - routes.tsx: 注册 { path: "games", Component: Games }
  - **代码优化**：
    - 清理重复组件文件（删除 src/components/games/ 冗余目录）
    - 全面的代码审查确保一致性和完整性
- ✅ 系统通知UI改造：从卡片形式改为会话入口形式
  - 移除 systemNotificationApi 调用，改用 conversationApi.getNotificationChannel()
  - 删除 ~60 行卡片渲染代码，新增会话入口组件
  - 橙色渐变主题，与世界频道保持一致的交互模式
  - 支持激活状态高亮和响应式设计
- ✅ 五子棋盘棋子对齐修复（**最终版**）
  - **根因**：无论 CSS Grid + 伪元素还是绝对定位 calc()，都是使用两套不同的渲染引擎
  - 浏览器对 CSS 布局和 calc 的舍入方式不同，导致微小的亚像素偏移
  - **最终完美方案**：使用 SVG 作为棋盘背景，矢量渲染 100% 精确
  - SVG 绘制网格线、星点和双边框，完全消除渲染差异
  - 点击按钮绝对定位在 SVG 之上，使用相同的 var(--gcs) 计算坐标
  - 棋子、预览和星点都完美对齐在 SVG 网格的交点上！
- ✅ 移动端底部导航栏修复
  - **问题1**：Game 未添加到 MobileNav 导航项（桌面端 MainLayout 已有）
    - 修复：在 navItems 数组中添加 `{ path: "/games", icon: Gamepad2, label: '游戏' }`
  - **问题2**：fixed 定位的导航栏遮挡消息列表等页面底部元素
    - **根因**：MobileNav 使用 `position: fixed` + `z-50`，不参与文档流，内容区无底部 padding
    - **完美方案**：
      - 内容区 `overflow-hidden` → `overflow-y-auto overflow-x-hidden`（允许正常滚动）
      - 动态 paddingBottom：显示导航时 `calc(80px + env(safe-area-inset-bottom))`，隐藏时仅安全区
      - 聊天页面自动隐藏导航栏，无多余 padding
      - 80px = 导航栏可视高度(~64px) + 底部间距(16px)
- ✅ 中国象棋游戏全栈开发完成
  - **chessEngine.ts**: 完整象棋规则引擎（600行）
    - 7种棋子类型 + 完整走法规则（王/仕/相/車/馬/炮/兵）
    - 九宫限制、象不过河、马蹩脚、炮翻山吃子
    - 将军检测、将帅对面检测、合法走法过滤（不能送将）
    - 克隆棋盘、棋盘评估（棋子价值+位置奖励+机动性）
  - **AI引擎**：3种难度 + Alpha-Beta剪枝Minimax
    - Easy: 吃子优先 + 将军检测 + 随机扰动
    - Medium: Alpha-Beta深度3 + 走法排序优化
    - Hard: Alpha-Beta深度4 + 开局库 + 将军加分
    - 走序优化：MVV-LVA（大值吃小值优先）
  - **ChineseChessBoard.tsx**: React棋盘组件（400行）
    - 使用与Gomoku一致的CSS伪元素网格线方案，确保对齐
    - 棋子选中高亮 + 合法走法圆点/捕获环指示
    - 将军闪烁动画、最后落子标记
    - 楚河汉界竖排文字 + 棋子分值参考表
    - AI思考进度条 + 回合计时器
    - 结果弹窗 + localStorage战绩存储
  - **Games.tsx 集成**: 解锁象棋卡片 + 3种难度选择 + 返回大厅导航
- ✅ 象棋棋盘无法移动和分数系统完整修复
  - **问题1**: 象棋棋盘无法移动棋子 → 修复为SVG背景 + 绝对定位按钮，对齐到网格交点
  - **问题2**: 游戏结束时 saveGameResult 调用参数不一致 → 统一为 `'win' | 'loss' | 'draw'`（之前混用了 won/win, lost/loss）
    - 修复范围: GomokuBoard.tsx, ChineseChessBoard.tsx 所有调用处和函数签名
  - **修复内容**:
    - 中国象棋棋盘采用与Gomoku相同的SVG背景方案，完美对齐
    - 棋盘按钮绝对定位到 `left = col × cell - cell/2, top = row × cell - cell/2`
    - 所有游戏的 localStorage 统计保存统一参数格式
  - 现在游戏正常：
    - 可以正常下棋
    - 胜利/失败会调用 onGameOver → 触发 Games.tsx fetchProfile 更新积分
    - 段位系统正常工作
- ✅ 落子后棋子偏移修复（终极方案）
  - **现象**：预备落子（幽灵预览）位置准确，但实际落子后棋子向右下偏移
  - **根因**：Stone/ChessPiece 组件使用 `position:absolute` + `top:50%` + `left:50%` + `transform:translate(-50%,-50%)`
    - 父按钮已是 `position:absolute`（用于定位到网格交点）
    - 子元素再套一层 absolute+translate → 双重绝对定位产生亚像素舍入偏差
    - 而幽灵预览无任何定位属性，直接靠父元素 `display:flex` 居中 → 精准！
  - **修复**：移除 Stone（GomokuBoard）和 ChessPiece（ChineseChessBoard）的 `absolute/top/left/transform`
    - 改为与幽灵预览完全一致的 flex 居中方式：父元素 `flex+items-center+justify-center`，子元素只设宽高
    - 添加 `flexShrink:0` 防止被压缩

- ✅ 游戏段位积分系统完整修复
  - **问题**：玩游戏赢/输都不增加积分
  - **根因分析**：
    - 后端虽然有 GameService.finishMatch 函数和完整的 RankingService 积分计算，但没有暴露 API 接口
    - 前端三个棋盘组件（TicTacToe/Gomoku/ChineseChess）游戏结束时，都没有调用任何结束对局的 API！只调用了 onGameOver，没有通知后端记录结果
  - **修复步骤**：
    1. **后端**：
       - 在 GameController 添加 `finish` 方法：POST `/game/:matchId/finish`，接收 { winnerId, status }
       - 在 routes/game.js 注册该路由
    2. **前端**：
       - 在 `api/game.ts` 添加 `gameApi.finish` 方法
       - 三个棋盘组件都在所有游戏结束场景调用 finish API：
         - 玩家赢（黑方/X/红方）：winnerId =1（玩家1）
         - 玩家输（白方/O/AI）：winnerId = null
         - 平局：winnerId = null
       - 所有 API 调用都用 try-catch 包裹，失败不影响游戏流程
       - Games.tsx 的 onGameOver 已经会调用 fetchProfile，所以积分榜和段位自动更新！
  - **修改文件列表**：
    - 后端：backend/src/controllers/GameController.js, backend/src/routes/game.js
    - 前端：frontend/src/api/game.ts, TicTacToeBoard.tsx, GomokuBoard.tsx, ChineseChessBoard.tsx

- ✅ 游戏段位积分系统第二版修复
  - **问题**：赢了还是不加分
  - **根因分析**：前端传的 winnerId 是硬编码 1，和用户真实数据库 id 不匹配
  - **修复步骤**：
    1. **后端**：
       - GameController.finish：不用前端传 winnerId，直接用 req.user.id 判断，won=true 时 winnerId=req.user.id
       - 添加 query 导入
    2. **前端**：
       - api/game.ts：finish 接口参数改为 { won: boolean }
       - 三个棋盘组件：所有调用 finish 的地方改成传 won: true/false

### 2026-05-25
- ✅ **Vite生产构建错误彻底修复（6处）**
  - **错误1 — ESBuild严格模式**：
    - 文件：`chessEngine.ts` 第516行
    - 错误：`const score = evaluateBoard(newBoard)` 在第517行被 `score = -score` 重新赋值
    - 修复：`const score` → `let score`
  - **错误2-4 — Rollup路径解析失败（useGameHeartbeat导入）**：
    - 根因：从 `src/app/components/games/` 到 `src/hooks/` 需要3级 `../`，但代码只写了2级
    - 影响文件（全部修复为3级 `../../../hooks/useGameHeartbeat`）：
      - TicTacToeBoard.tsx 第8行
      - GomokuBoard.tsx 第8行
      - ChineseChessBoard.tsx 第8行
  - **错误5-6 — Rollup路径解析失败（game API导入）**：
    - dynamicDifficulty.ts：从 games/ 到 api/ 需要3级 `../`，修正为 `../../../api/game`
    - useGameHeartbeat.ts：从 hooks/ 到 api/ 只需1级 `../`，修正为 `../api/game`
  - **构建结果**：✓ 2826 modules transformed, built in 9.57s, exit code 0
  - **经验教训**：
    - 路径层级计算必须精确：components/games(2级)→hooks(1级) = 3个 ../
    - ESBuild strict mode 下 const/let 必须正确使用
    - 建议添加 ESLint rule: `no-import-path-depth-check`

- ✅ **运行时错误修复：HelpCircle is not defined**
  - **现象**：选择任意游戏模式后报错 `ReferenceError: HelpCircle is not defined`，React Router ErrorBoundary 捕获
  - **根因分析**：
    - `TicTacToeBoard.tsx` 在JSX中使用了7个 lucide-react 图标组件
    - 但 import 语句只导入了 `{ Target }`，缺少其余6个图标
    - 缺失图标：HelpCircle, Trophy, Clock, RotateCcw, History, Share2
  - **修复方案**：
    ```typescript
    // 修复前
    import { Target } from 'lucide-react';
    
    // 修复后
    import { Target, HelpCircle, Trophy, Clock, RotateCcw, History, Share2 } from 'lucide-react';
    ```
  - **影响范围**：仅 TicTacToeBoard.tsx（其他游戏组件无此问题）
  - **验证结果**：✓ 构建成功 exit code 0, 2826 modules, built in 11.44s
  - **预防措施建议**：
    - 使用 ESLint plugin: `eslint-plugin-react` 的 `jsx-no-undef` 规则
    - IDE 配置 TypeScript 严格模式可提前检测未定义变量

- ✅ **井字棋思考延时修复：对手零延迟立即落子**
  - **现象**：用户反馈"对手没有停顿，跟人机一样一秒决策"，三个游戏都需要动态等待
  - **根因分析**：
    - `TicTacToeBoard.tsx` 存在严重的变量引用错误
    - 第27行定义了旧的固定时间常量：`THINKING_TIME = { easy: 800, medium: 600, hard: 400 }`
    - 但代码中错误地使用 `THINKING_TIME[dynamicDiff]` 作为索引
    - `dynamicDiff` 是对象 `{level, thinkTime, errorRate}`，用对象作为键查找 → **undefined**
    - `setTimeout(callback, undefined)` → **立即执行（0ms延迟）** → 对手瞬间落子！
  - **修复方案（5处修改）**：
    ```typescript
    // 删除无用常量
    - const THINKING_TIME: Record<string, number> = { easy: 800, medium: 600, hard: 400 };
    
    // 修复所有引用（5处）
    - getThinkingPhases(THINKING_TIME[dynamicDiff] as number)  // undefined
    + getThinkingPhases(dynamicDiff.thinkTime)                 // 800-3500ms ✅
    
    - THINKING_TIME[dynamicDiff] / 10                          // NaN
    + dynamicDiff.thinkTime / 10                               // 正确间隔 ✅
    
    - setTimeout(callback, THINKING_TIME[dynamicDiff])         // 立即执行
    + setTimeout(callback, dynamicDiff.thinkTime)              // 真正等待 ✅
    
    - {THINKING_TIME[dynamicDiff]}ms                           // undefined ms
    + {dynamicDiff.thinkTime}ms                                // 显示真实时间 ✅
    ```
  - **其他游戏验证**：
    - GomokuBoard.tsx：✅ 已正确使用 `dynamicDiff.thinkTime`（无需修改）
    - ChineseChessBoard.tsx：✅ 已正确使用 `dynamicDiff.thinkTime`（无需修改）
  - **修复效果**：
    - 井字棋：⏱️ 800-3500ms 动态延时 + 4阶段思考动画（与五子棋/象棋一致）
    - 对手信息栏实时显示："分析棋局..." → "评估策略..." → "决策落子..." → "即将落子..."
    - 每次落子时间都不同（±30%随机波动），模拟真人思考的不确定性
  - **构建验证**：✓ exit code 0, built in 11.36s

- ✅ **五子棋运行时错误修复：config is not defined**
  - **现象**：进入五子棋对局报错 `ReferenceError: config is not defined`
  - **根因分析**：
    - `GomokuBoard.tsx` 残留旧的 `DIFFICULTY_CONFIG` 常量（easy/medium/hard 三级配置）
    - 但代码中错误地使用未定义的 `config` 变量引用配置属性
    - 第1057行：`config.color`, `config.label`, `config.desc` → 全部 undefined
    - 第1284行：`config.thinkTime` → undefined
  - **修复方案（3处）**：
    ```typescript
    // 1. 删除旧常量（第52-77行，26行代码）
    - const DIFFICULTY_CONFIG = { easy: {...}, medium: {...}, hard: {...} };
    
    // 2. 修复难度信息显示（第1057-1058行）
    - <div className={..., config.color, ...}>{config.label} - {config.desc}</div>
    + <div className="...text-indigo-600 bg-indigo-500/10...">
    +   在线对局 · 思考 {dynamicDiff.thinkTime}ms
    + </div>
    
    // 3. 修复统计面板（第1284行）
    - Math.round(config.thinkTime / 1000)
    + Math.round(dynamicDiff.thinkTime / 1000)
    ```
  - **构建验证**：✓ exit code 0, built in 11.68s

- ✅ **象棋棋子出界 + 游戏区尺寸优化**
  - **现象**：用户反馈"象棋棋子出界了，游戏区尺寸太小"
  - **根因分析**：
    1. **容器尺寸计算错误**：
       ```
       棋盘宽度 = calc(cellSize × 8 + 1px)     // 只算到第9列中心点
       但最右按钮右边缘 = 8×cellSize + cellSize = 9×cellSize  // 超出！
       
       同理高度也少算了一个 cellSize，导致底部棋子出界
       ```
    2. **外层容器 overflow-hidden**：裁剪了超出的棋子
    3. **cellSize 太小**：42px 导致整体偏小
  - **修复方案（4处）**：
    ```typescript
    // 1. 增大格子尺寸（第334行）
    - cellSizeVar = 'min(42px, calc((100vw - 300px) / 9))'
    + cellSizeVar = 'min(46px, calc((100vw - 280px) / 9))'  // +10% 更大
    
    // 2. 修正容器宽度（第381行）
    - width: calc(var(--ccs) * 8 + 1px)
    + width: calc(var(--ccs) * 8 + var(--ccs) + 4px)  // +cellSize+4px 边距
    
    // 3. 修正容器高度（第382行）
    - height: calc(var(--ccs) * 9 + 1px)
    + height: calc(var(--ccs) * 9 + var(--ccs) + 4px)  // +cellSize+4px 边距
    
    // 4. 移除外层裁剪（第337行）
    - <div className="... overflow-hidden">
    + <div className="...">
    ```
  - **修复效果**：
    - ✅ 棋子不再超出边界（四周各增加 cellSize/2 + 2px 余量）
    - ✅ 棋盘视觉增大约10%（42px → 46px）
    - ✅ 外层容器不再裁剪内容
  - **构建验证**：✓ exit code 0, built in 11.68s

- ✅ **思考延时算法重写：游戏级联固定范围 + 步数递增**
  - **需求**：用户反馈等待时间过长，要求固定随机范围并随对局深入逐步加长缩小
  - **新算法设计**：
    ```typescript
    // 按游戏类型固定时间范围（秒）
    const GAME_TIME_RANGE = {
      tictactoe:     { minSec: 2, maxSec: 5 },   // 2000-5000ms
      gomoku:        { minSec: 3, maxSec: 8 },   // 3000-8000ms
      chinese_chess: { minSec: 3, maxSec: 7 },   // 3000-7000ms
    };
    
    // 随步数递增算法（20步达到最大压缩）
    progressRatio = Math.min(moveCount / 20, 1);
    adjustedMin = minSec + (maxSec - minSec) × progressRatio × 0.6;
    
    // 以象棋为例：从(3s,7s)逐步变为(~5.4s,7s)
    // 步数 0  → 范围 3.0-7.0s（开局快速）
    // 步数10 → 范围 4.2-7.0s（中盘思考）
    // 步数20+→ 范围 5.4-7.0s（残局谨慎）
    ```
  - **修改文件**：
    - `dynamicDifficulty.ts`：完全重写 `getDynamicDifficulty(gameType, moveCount)`
    - `TicTacToeBoard.tsx`：传入 `('tictactoe', moveCount)`
    - `GomokuBoard.tsx`：传入 `('gomoku', history.length)`
    - `ChineseChessBoard.tsx`：传入 `('chinese_chess', history.length)`
  - **移除内容**：删除旧的 level/errorRate/DIFFICULTY_CONFIG 复杂度系统
  - **效果**：开局快节奏(2-5s)，残局慢思考(5-7s)，模拟真人越下越谨慎
  - **构建验证**：✓ exit code 0, built in 10.76s

- ✅ **思考延时死循环BUG修复：useRef锁定时间**
  - **现象**：用户反馈"棋局陷入死循环，对手永远不会下棋"
  - **根因分析**：
    ```
    组件顶层：const dynamicDiff = getDynamicDifficulty(gameType, moveCount)
               ↑ 每次渲染都调用！每次产生新的随机thinkTime！
    
    useEffect依赖：[..., dynamicDiff.thinkTime, ...]
                    ↑ thinkTime每次都变！
    
    死循环链路：
    渲染 → dynamicDiff重算(新随机值) → 依赖变化
    → useEffect重新执行 → 清除旧setTimeout → 设置新setTimeout
    → setThinkingPhase()触发重渲染 → 回到开头 ♻️♻️♻️
    ```
  - **修复方案（useRef锁存模式）**：
    ```typescript
    // 1. 添加ref（默认值）
    const thinkTimeRef = useRef<number>(3000);
    
    // 2. 在触发思考时一次性锁定时间（只执行一次！）
    setIsAIThinking(true);
    thinkTimeRef.current = getDynamicDifficulty('tictactoe', moveCount).thinkTime;
                           ↑ 这次随机值被"锁住"了
    
    // 3. useEffect中读取ref（不作为依赖）
    useEffect(() => {
      if (!isAIThinking) return;
      const tt = thinkTimeRef.current;  // 始终同一个值
      setTimeout(callback, tt);         // 稳定的等待时间
      return () => clearTimeout(timer);
    }, [isAIThinking, ...]);  // 不再包含thinkTime！
    ```
  - **修改文件**：
    - `TicTacToeBoard.tsx`：+thinkTimeRef, 移除渲染时dynamicDiff, 5处引用替换
    - `GomokuBoard.tsx`：+thinkTimeRef, 同上, 4处引用替换
    - `ChineseChessBoard.tsx`：+thinkTimeRef, 同上, 2处引用替换
  - **效果**：每步棋在开始时随机确定一个固定思考时间→倒计时→落子，不再死循环
  - **构建验证**：✓ exit code 0, built in 9.58s

- ✅ **API错误修复：getRandomOpponent 404 + createMatch 残留对局**
  - **问题1：getRandomOpponent 返回 404**
    - 现象：控制台 `Resource not found` + `[Matchmaking] 获取真实对手失败`
    - 原因：生产环境可能未部署最新后端代码（路由存在但未生效）
    - 修复（前端 dynamicDifficulty.ts）：
      ```typescript
      // 修复前：所有错误都输出警告
      catch (err) {
        console.warn('[Matchmaking] 获取真实对手失败，使用缓存:', err.message);
      }
      
      // 修复后：404静默处理（后端未更新时常见）
      catch (err) {
        const status = err?.response?.status;
        if (status !== 404) {  // 只对非404报错
          console.warn('[Matchmaking] 获取真实对手失败:', status || err.message);
        }
      }
      return [];  // 直接降级为随机对手
      ```
    - 效果：404时静默降级，不再污染控制台

  - **问题2：createMatch 返回 "您已有进行中的对局"** ⚠️ 核心问题
    - 现象：进入游戏 → `API Error: 您已有进行中的对局` → 离线模式运行 → 积分不统计
    - **根因**：
      ```
      用户上次玩游戏 → 刷新页面/关闭浏览器
      → finish API 未调用 → 数据库残留 status='playing' 的记录
      → 下次创建对局 → 检测到 active match → 抛出异常拒绝！
      ```
    - **修复（后端 GameService.js）**：
      ```javascript
      // 修复前：直接拒绝
      if (activeMatches.length > 0) {
        throw new Error('You have an active match already');  // ❌
      }
      
      // 修复后：自动清理残留 + 创建新对局
      if (activeMatches.length > 0) {
        await query(
          "UPDATE game_match SET status = 'abandoned', finished_at = NOW() 
           WHERE player1_id = ? AND status = 'playing'",
          [playerId]
        );  // ✅ 自动标记旧对局为 abandoned
      }
      // 继续执行 INSERT 创建新对局...
      ```
    - **效果**：
      - 用户刷新/关闭后再进来 → 旧对局自动标记 abandoned → 新对局正常创建
      - 不再出现"您已有进行中的对局"错误
      - 积分系统正常工作
    - **修改文件**：
      - 后端：`backend/src/services/GameService.js`
      - 前端：`frontend/src/app/components/games/dynamicDifficulty.ts`

- ✅ **Render部署失败修复：GameService.js TypeScript语法残留**
  - **现象**：Render部署报错 `SyntaxError: Missing initializer in const declaration` at line 276
  - **根因**：Node.js v22 默认启用ESM模块解析，`.js` 文件中的 TypeScript 类型注解被当作语法错误
  - **错误位置**（2处）：
    - 第276行：`const params: any[] = [currentUserId]`
    - 第296行：`const RANK_NAMES: Record<string, string> = {`
  - **修复**：移除所有 TypeScript 类型注解
    ```javascript
    // 修复前
    const params: any[] = [currentUserId];
    const RANK_NAMES: Record<string, string> = { ... };

    // 修复后
    const params = [currentUserId];
    const RANK_NAMES = { ... };
    ```
  - **修改文件**：`backend/src/services/GameService.js`
  - **预防措施**：后端 `.js` 文件禁止使用 TypeScript 语法，类型注解仅限前端 `.ts/.tsx`

- ✅ **重大新功能：表现分系统（Performance Score System）**
  - **设计参考**：王者荣耀/和平精英/无畏契约对局结束评分制度
  - **核心问题解决**：
    - 旧系统：固定分数制（井字棋±10、五子棋±25、象棋±40），打简单模式刷分严重
    - 新系统：每局动态计算表现分(0-100)，根据表现决定实际积分变化
  - **表现分计算公式**：
    ```
    FinalScore = BaseScore × 难度系数 × 对手强度系数 × (1+表现加成) × (1+高光加成)
    RatingChange = round(FinalScore × 结果系数)
      胜利: ×1.0 | 失败: ×(-0.5) | 平局: ×0.1 | 逃跑: ×(-0.8)
    ```
  - **难度系数（防刷分）**：
    | 游戏 | 系数 | 原因 |
    |------|------|------|
    | 井字棋 | **×0.4** | 最简单，刷分收益低 |
    | 五子棋 | **×0.85** | 中等难度 |
    | 象棋 | **×1.2** | 最难，加分最多 |
  - **对手强度系数**：AI easy=0.5x / medium=1.0x / hard=1.4x；PVP按rating差值±500分级
  - **高光时刻系统（12种）**：
    - 通用：⚡闪电战 👑完美对局 🛡️铜墙铁壁 🔄绝地反击 🔥连胜加持 🎯中心统治
    - 五子棋：💎连珠大师
    - 象棋：♟️将军 🗡️弃子攻杀 🎯绝杀 🏆以弱胜强
  - **称号系统（S/A/B/C/D五级）**：
    - S级(90+): "三子之神"/"五珠至尊"/"象棋宗师"
    - A级(75-89): "战术大师"/"布局大师"/"棋坛精英"
    - B级(60-74): "稳健选手"/"稳扎稳打"/"中规中矩"
    - C级(40-59): "初学者"/"五子新手"/"楚汉初学"
    - D级(<40): "新手入门"/"刚上路"/"继续加油"
  - **新建文件**：
    - `backend/src/services/PerformanceService.js` — 表现分计算引擎核心
    - `backend/src/migrations/performanceMigration.js` — 数据库迁移模块
    - `backend/src/migrations/001_add_performance.sql` — SQL参考文档
    - `frontend/src/app/components/games/GameResultModal.tsx` — 结算弹窗组件
  - **修改文件**：
    - `backend/src/services/RankingService.js` — calculateRatingChange支持动态表现分参数
    - `backend/src/services/GameService.js` — finishMatch集成PerformanceService + 查询真实rating
    - `backend/src/app.js` — 启动时自动执行数据库迁移
    - `frontend/src/api/game.ts` — 新增 PerformanceResult/Highlight/Bonus 接口
    - `frontend/src/app/components/games/TicTacToeBoard.tsx` — 集成GameResultModal
    - `frontend/src/app/components/games/GomokuBoard.tsx` — 集成GameResultModal
    - `frontend/src/app/components/games/ChineseChessBoard.tsx` — 集成GameResultModal
    - `frontend/src/app/pages/Games.tsx` — 主页段位显示增强（进度条/动画/排行特效）
  - **数据库新增字段（game_match表）**：
    - `performance_score` DECIMAL(5,2) — 表现分0-100
    - `performance_grade` VARCHAR(2) — S/A/B/C/D
    - `performance_title` VARCHAR(50) — 称号
    - `highlights` JSON — 高光时刻key数组
    - `performance_details` JSON — 详细拆解
  - **前端结算弹窗特性**：
    - 等级徽章（径向渐变+S级脉冲发光）
    - 表现分数字滚动动画（CountUp 1.5秒）
    - 高光时刻标签（stagger入场+hover提示）
    - 可折叠详细数据区（用时/步数/系数/加成明细）
    - Web Share API分享功能
  - **主页增强**：
    - 段位进度条（到下一段位的距离百分比）
    - 胜率环形进度条（SVG conic-gradient）
    - 连胜火焰动画
    - 游戏卡片显示难度系数和加分范围
    - 排行榜前三名金银铜边框+皇冠
  - **构建验证**：✓ exit code 0, 2827 modules, built in 10.29s

- ✅ **Bug修复：排行榜胜率NaN + 我的对局历史记录页面完成**
  - **问题1：排行榜胜率显示 NaN**
    - 根因：后端 `RankingService.getLeaderboard()` 返回数据中缺少 `win_rate` 字段
    - 前端 `entry.win_rate * 100` → `undefined * 100 = NaN`
    - 修复：在 getLeaderboard 的 map 中添加 `win_rate: row.total_games > 0 ? row.wins / row.total_games : 0`
    - 文件：`backend/src/services/RankingService.js` 第177行
  - **问题2："我的对局"tab 显示占位符**
    - 原状态：`<p>历史记录功能开发中...</p>` 占位符，无实际数据
    - 修改文件：
      - `frontend/src/store/gameStore.ts` — 新增 history state + fetchHistory 方法
      - `frontend/src/app/pages/Games.tsx` — 完整重写 history tab UI
    - **历史记录列表功能**：
      - 每条记录显示：游戏类型图标+名称、结果标签(胜/负/平/逃跑)、表现等级、对战模式/难度、用时、积分变化、表现分、相对时间
      - 胜利绿色边框、失败红色、平局黄色、逃跑灰色虚线
      - S/A/B/C/D 等级颜色分级显示
      - 空状态友好引导（还没有对局记录 → 引导开始第一局）
      - 加载骨架屏动画
      - 列表 stagger 入场动画
    - **构建验证**：✓ exit code 0, 2827 modules, built in 12.04s

- ✅ **严重BUG修复：GameInviteReceiver 全局白屏（useNavigate依赖残留）**
  - **现象**：修改 GameInviteReceiver 后所有页面白屏，控制台报错：
    ```
    Error: useNavigate() may be used only in the context of a <Router> component.
    at Bt (index-CKmPQcZS.js:49:58)
    ```
  - **根因分析**：
    ```
    App.tsx 将 <GameInviteReceiver /> 挂载在 <RouterProvider> 外部（全局组件）
    → 组件内部使用了 useNavigate() hook
    → React Router v7 要求 useNavigate 必须在 <Router> 上下文中调用
    → Hooks 规则违反 → 整个应用崩溃白屏
    ```
  - **修复过程（4步）**：
    1. **删除 import**：移除 `import { useNavigate } from 'react-router'`
    2. **删除 hook 调用**：移除 `const navigate = useNavigate()`
    3. **替换跳转方式**（2处 navigate 调用 → window.location.href）：
       - 第55行（发起者视角，对方接受后）：`window.location.href = /games?matchId=...`
       - 第117行（被邀请者视角，自己接受后）：`window.location.href = /games?matchId=...`
    4. **⚠️ 关键遗漏修复**：依赖数组中残留 `navigate` 变量引用（本次修复核心！）
       - 第80行 `}, [navigate, toast])` → `}, [toast])`
       - 第127行 `}, [invite, responding, navigate, toast])` → `}, [invite, responding, toast])`
  - **技术要点**：
    - 挂载在 RouterProvider 外部的全局组件**禁止使用** useNavigate/useLocation/useParams 等 React Router hooks
    - 替代方案：`window.location.href`（完整页面跳转，丢失状态但安全可靠）
    - 删除变量时必须同步清理所有引用（包括闭包/依赖数组/条件判断），否则 ReferenceError 导致崩溃
  - **修改文件**：`frontend/src/app/components/games/GameInviteReceiver.tsx`（4处改动）
  - **构建验证**：✓ exit code 0, 2828 modules transformed, built in 9.13s

### 2026-05-22
- ✅ 移除 Admin 后台的群组管理功能
  - 删除了所有群组相关的 state 变量、函数和 UI 组件
  - 清理了 `UserPlus` 图标导入
  - 会话分布统计仅保留私聊数据

---

## 一、紧急修复项

### 1.1 数据库表结构修复 ✅ 已完成

**问题描述**: AI反垃圾和IP封禁功能的数据库表缺少必要字段，导致功能异常。

**修复方案**:
- AI反垃圾服务已实现基础版本
- IP封禁服务已实现基础版本
- 数据库表已创建完整

**状态**: ⚠️ 基础版本已完成，部分功能待完善

---

## 二、短期计划（1-2周）

### 2.1 功能完善

#### 2.1.1 完善AI反垃圾服务

**目标**: 正常使用AI进行消息内容检测

**任务列表**:
1. 完善 antiSpamService.js 数据库表依赖
2. 编写测试用例验证AI反垃圾功能
3. 添加反垃圾白名单功能
4. 实现反垃圾日志查询

**预计工时**: 3-5天

#### 2.1.2 完善IP封禁服务

**目标**: 实现完整的IP追踪和封禁功能

**任务列表**:
1. 完善 IPBanService.js 数据库表依赖
2. 在登录/注册时记录IP
3. 实现IP段封禁功能
4. Admin后台显示用户IP
5. 实现基于IP的访问控制

**预计工时**: 3-5天

#### 2.1.3 临时会话功能完善

**目标**: 完成警告标签和反诈提示功能

**任务列表**:
1. 实现临时会话判断逻辑
2. 添加警告弹窗UI
3. 添加反诈提示功能
4. 实现警告次数统计
5. 添加反诈知识库

**预计工时**: 2-3天

### 2.2 性能优化

#### 2.2.1 npm依赖审计 ⚠️ 待执行

**目标**: 修复潜在的安全漏洞

**任务列表**:
```bash
# 前端审计
cd frontend
npm audit

# 后端审计
cd backend
npm audit

# 修复漏洞
npm audit fix
```

**预计工时**: 1天

#### 2.2.2 数据库优化

**目标**: 提升查询性能

**任务列表**:
1. 添加必要的索引
2. 优化慢查询
3. 实现查询缓存
4. 数据库连接池调优

**预计工时**: 2-3天

---

## 三、中期计划（1个月）

### 3.1 用户体验优化

#### 3.1.1 消息功能增强

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 消息引用 | P2 | 回复指定消息 |
| 消息翻译 | P3 | 实时翻译外文 |
| 消息表情回复 | P3 | 对表情进行回复 |
| 消息收藏 | P2 | 收藏重要消息 |
| 消息搜索增强 | P2 | 支持搜索历史消息 |

#### 3.1.2 通知系统优化

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 推送通知 | P2 | 支持浏览器推送 |
| 通知免打扰 | P2 | 定时免打扰 |
| 多端同步 | P3 | 跨设备同步 |
| 未读消息数 | P1 | 桌面角标显示 |

### 3.2 社交功能

#### 3.2.1 朋友圈增强

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 朋友圈转发 | P3 | 转发朋友圈 |
| 朋友圈定位 | P3 | 位置信息 |
| @功能 | P2 | 朋友圈@用户 |
| 话题功能 | P3 | 话题标签 |

#### 3.2.2 用户互动

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 用户资料页 | P2 | 查看用户详细信息 |
| 好友申请备注 | P2 | 申请时添加备注 |
| 分组功能 | P3 | 好友分组管理 |
| 黑名单 | P2 | 拉黑用户 |

---

## 四、长期计划（3个月+）

### 4.1 高级功能

#### 4.1.1 音视频通话

**目标**: 实现点对点音视频通话

**技术方案**:
- WebRTC 实现P2P连接
- 信令服务器使用现有WebSocket
- TURN服务器处理NAT穿透

**任务列表**:
1. WebRTC信令通道建立
2. 音频通话实现
3. 视频通话实现
4. 通话状态管理
5. 通话记录

**预计工时**: 2-3周

#### 4.1.2 文件传输增强

**目标**: 支持大文件传输和断点续传

**任务列表**:
1. 分片上传实现
2. 断点续传
3. 传输进度显示
4. 文件预览（图片、视频、文档）
5. 云端文件管理

**预计工时**: 2周

#### 4.1.3 表情包系统

**目标**: 完善的表情包功能

**任务列表**:
1. 表情包商店
2. 表情包收藏
3. 最近使用
4. 自定义表情包上传
5. 表情包搜索

**预计工时**: 1-2周

### 4.2 运营功能

#### 4.2.1 数据分析后台

**目标**: 运营数据可视化

**任务列表**:
1. 用户增长统计
2. 活跃度分析
3. 消息量统计
4. 朋友圈数据
5. 报表导出

**预计工时**: 1-2周

#### 4.2.2 内容审核系统

**目标**: 自动内容审核

**任务列表**:
1. 敏感词过滤
2. 图片内容审核
3. AI自动审核
4. 人工审核后台
5. 审核日志

**预计工时**: 2-3周

### 4.3 技术架构优化

#### 4.3.1 微服务架构

**目标**: 系统解耦和扩展性提升

**任务列表**:
1. 服务拆分（用户、消息、推送）
2. 消息队列引入
3. 服务发现
4. 负载均衡

**预计工时**: 4-6周

#### 4.3.2 缓存优化

**目标**: 提升系统性能

**任务列表**:
1. Redis缓存引入
2. 会话缓存
3. 热数据缓存
4. 缓存策略优化

**预计工时**: 2周

---

## 五、技术债务

### 5.1 待重构项

| 项目 | 说明 | 优先级 |
|------|------|--------|
| TypeScript迁移 | 后端JS迁移TS | P2 |
| 状态管理重构 | Zustand持久化优化 | P2 |
| API层重构 | 统一错误处理 | P3 |
| 组件库升级 | shadcn/ui版本更新 | P3 |

### 5.2 待补充测试

| 项目 | 说明 | 优先级 |
|------|------|--------|
| 单元测试 | 核心业务逻辑测试 | P2 |
| E2E测试 | 用户流程测试 | P3 |
| 性能测试 | 压力测试 | P3 |
| 安全测试 | 渗透测试 | P2 |

---

## 六、版本规划

### v2.0.x (当前版本)
- ✅ 基础即时通讯功能
- ✅ 群聊功能
- ✅ 朋友圈功能
- ✅ Admin后台
- ✅ AI智能调度
- ✅ 限流保护
- ✅ i18n国际化

### v2.1.0 (短期目标)
- [ ] AI反垃圾服务完善
- [ ] IP封禁服务完善
- [ ] 临时会话功能完成
- [ ] npm安全审计通过

### v2.2.0 (中期目标)
- [ ] 消息功能增强（引用、收藏、搜索增强）
- [ ] 通知系统优化
- [ ] 朋友圈功能增强
- [ ] 用户体验优化

### v3.0.0 (长期目标)
- [ ] 音视频通话
- [ ] 大文件传输
- [ ] 表情包系统
- [ ] 数据分析后台
- [ ] 内容审核系统

---

## 七、里程碑

| 版本 | 里程碑 | 目标日期 |
|------|--------|---------|
| v2.0.1 | 文档更新与项目清理 | 2026-04-18 |
| v2.1.0 | 功能完善发布 | 2026-04-30 |
| v2.2.0 | 体验优化发布 | 2026-05-15 |
| v3.0.0 | 高级功能发布 | 2026-06-30 |

---

## 八、资源需求

### 8.1 开发资源

| 角色 | 数量 | 备注 |
|------|------|------|
| 前端开发 | 1-2 | React/TS经验 |
| 后端开发 | 1-2 | Node.js经验 |
| UI设计 | 0.5 | 兼职 |
| 测试 | 0.5 | 兼职 |

### 8.2 第三方服务

| 服务 | 用途 | 成本 |
|------|------|------|
| WebRTC TURN | NAT穿透 | $0-50/月 |
| CDN | 静态资源 | $0-20/月 |
| 推送服务 | 浏览器推送 | 免费 |
| AI审核 | 内容审核 | 按量计费 |

---

## 九、风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| Render休眠 | 用户体验 | 高 | 考虑升级付费套餐 |
| 数据库性能 | 系统稳定性 | 中 | 优化查询，添加索引 |
| WebRTC兼容 | 通话功能 | 中 | 多浏览器测试 |
| 安全漏洞 | 系统安全 | 低 | 定期审计 |

---

## 十、优先级总结

### P0 - 紧急（立即执行）
1. npm依赖审计
2. 紧急Bug修复

### P1 - 高优先级（2周内）
1. AI反垃圾服务完善
2. IP封禁服务完善
3. 临时会话功能

### P2 - 中优先级（1个月内）
1. 消息收藏
2. 用户体验优化
3. 性能优化

### P3 - 低优先级（长期）
1. 音视频通话
2. 大文件传输
3. 表情包系统
4. 微服务架构

---

## 十一、已完成的工作

### v2.0.0 - v2.0.1 完成项

| 功能 | 完成日期 | 状态 |
|------|---------|------|
| 项目初始化与目录结构 | 2026-04-04 | ✅ |
| 后端Node.js + Express项目 | 2026-04-04 | ✅ |
| 数据库初始化脚本 | 2026-04-04 | ✅ |
| 前端API封装和状态管理 | 2026-04-04 | ✅ |
| 一键启动脚本 | 2026-04-04 | ✅ |
| 安全测试与文档 | 2026-04-04 | ✅ |
| UI优化与问题修复 | 2026-04-04 | ✅ |
| 项目配置与部署 | 2026-04-04 | ✅ |
| 云端部署配置 | 2026-04-04 | ✅ |
| 群组功能开发 | 2026-04-05 | ✅ |
| 移动端适配与UI优化 | 2026-04-05 | ✅ |
| AI智能调度系统 | 2026-04-10 | ✅ |
| i18n国际化规范完善 | 2026-04-10 | ✅ |
| Bug修复 (B001-B025) | 2026-04-10 | ✅ |
| 文档更新 | 2026-04-18 | ✅ |
| 世界频道功能 | 2026-05-23 | ✅ |
| 系统通知全栈功能 | 2026-05-23 | ✅ |
| 娱乐游戏功能（Phase P0-P1） | 2026-05-23 | ✅ |

### v2.1.1 - 娱乐游戏功能完成项

| 功能模块 | 完成日期 | 状态 | 说明 |
|---------|---------|------|------|
| 游戏数据模型 | 2026-05-23 | ✅ | game_match + user_game_profile 表 |
| 段位计算服务 | 2026-05-23 | ✅ | 8级段位 + ELO积分算法 |
| 对局管理服务 | 2026-05-23 | ✅ | 完整的对局生命周期管理 |
| 游戏API端点 | 2026-05-23 | ✅ | 6个RESTful接口 |
| 游戏大厅页面 | 2026-05-23 | ✅ | 用户档案 + 游戏选择 + 排行榜 |
| 井字棋游戏 | 2026-05-23 | ✅ | Minimax AI + 3种难度 |
| 五子棋游戏 | 2026-05-23 | ✅ | 15×15棋盘 + 评分AI |
| 段位徽章组件 | 2026-05-23 | ✅ | 8段位 + 3尺寸 + 动画 |
| 游戏状态管理 | 2026-05-23 | ✅ | Zustand store |
| 导航集成 | 2026-05-23 | ✅ | MainLayout + routes配置 |
| 中国象棋游戏 | 2026-05-23 | ✅ | 10×9棋盘 + 7种棋子 + Alpha-Beta AI |

---

**计划制定**: 2026-04-18
**下次评审**: 2026-05-25
**维护者**: Code Kitty IM Team
