# 游戏组件新旧结算弹窗冲突修复记录

**修复日期**: 2026-05-25
**修复范围**: 前端三个游戏组件
**问题类型**: UI显示冲突/弹窗重叠

---

## 一、问题描述

### 1.1 问题现象
从截图可以看到旧的结算弹窗（深色背景，显示D级/21.0分）和新的 GameResultModal（白色背景）同时显示了。

### 1.2 问题原因
1. **旧弹窗溢出**: 旧弹窗使用 `absolute inset-0` 会溢出父容器到消息列表区域
2. **缺少互斥逻辑**: 新弹窗（GameResultModal）和旧弹窗同时渲染，没有互斥条件判断
3. **状态未联动**: 旧弹窗只检查 `gameStatus !== 'playing'`，没有考虑新弹窗的显示状态

---

## 二、解决方案

### 2.1 核心思路
在旧弹窗的渲染条件中添加 `&& !showResultModal` 判断，确保当新弹窗显示时旧弹窗自动隐藏。

### 2.2 修改内容

#### 文件1: TicTacToeBoard.tsx
**位置**: 第801行
**修改前**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && (
```
**修改后**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && !showResultModal && (
```

#### 文件2: GomokuBoard.tsx
**位置**: 第1289行
**修改前**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && (
```
**修改后**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && !showResultModal && (
```

#### 文件3: ChineseChessBoard.tsx
**位置**: 第789行
**修改前**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && (
```
**修改后**:
```tsx
<AnimatePresence>
  {gameStatus !== 'playing' && !showResultModal && (
```

---

## 三、技术细节

### 3.1 showResultModal 状态说明
- **TicTacToeBoard.tsx**: showResultModal state 声明在第223行
- **GomokuBoard.tsx**: showResultModal state 声明在第521行
- **ChineseChessBoard.tsx**: showResultModal state 声明在第117行

### 3.2 互斥机制原理
1. 游戏结束时：`gameStatus` 变为非 'playing' 状态
2. 新弹窗触发：`showResultModal` 设置为 `true`
3. 旧弹窗判断：`gameStatus !== 'playing' && !showResultModal` → `false`（不渲染）
4. 新弹窗显示：GameResultModal 组件正常渲染

### 3.3 AnimatePresence 动画效果
- 使用 framer-motion 的 `AnimatePresence` 实现平滑过渡
- 当条件从 true 变为 false 时，会执行 exit 动画后移除 DOM
- 避免了突然消失的视觉跳跃

---

## 四、影响评估

### 4.1 受影响的功能
- ✅ 井字棋游戏结算界面 - 旧弹窗不再与新弹窗重叠
- ✅ 五子棋游戏结算界面 - 旧弹窗不再与新弹窗重叠
- ✅ 中国象棋游戏结算界面 - 旧弹窗不再与新弹窗重叠

### 4.2 不受影响的功能
- ✅ 游戏核心逻辑完全不变
- ✅ 新的 GameResultModal 功能完全保留
- ✅ 游戏状态管理不受影响
- ✅ 其他UI组件和交互逻辑不受影响

### 4.3 兼容性保证
- 仅修改条件判断表达式，不改变任何业务逻辑
- 保持原有代码风格和注释
- 不引入新的依赖或状态变量

---

## 五、验证结果

### 5.1 代码验证
- ✅ 三个文件编译无错误
- ✅ TypeScript 类型检查通过
- ✅ 条件逻辑正确（showResultModal 为 boolean 类型）

### 5.2 功能验证（建议手动测试）
- [ ] 启动井字棋游戏，结束后确认只显示新弹窗
- [ ] 启动五子棋游戏，结束后确认只显示新弹窗
- [ ] 启动中国象棋游戏，结束后确认只显示新弹窗
- [ ] 确认新弹窗关闭后，如果需要可以重新显示旧弹窗（如果有这个需求）
- [ ] 确认游戏重置功能正常工作

---

## 六、相关文件

### 6.1 修改的文件
- `frontend/src/app/components/games/TicTacToeBoard.tsx` (第801行)
- `frontend/src/app/components/games/GomokuBoard.tsx` (第1289行)
- `frontend/src/app/components/games/ChineseChessBoard.tsx` (第789行)

### 6.2 相关组件（未修改）
- `GameResultModal.tsx` - 新的结算弹窗组件
- 其他游戏相关组件

### 6.3 更新的文档
- `MODIFICATION_RECORD_20260525.md` - 本文档

---

## 七、回滚方案

如需恢复到修复前的版本：

1. 使用 Git 回滚：
   ```bash
   git checkout HEAD~1 -- frontend/src/app/components/games/TicTacToeBoard.tsx
   git checkout HEAD~1 -- frontend/src/app/components/games/GomokuBoard.tsx
   git checkout HEAD~1 -- frontend/src/app/components/games/ChineseChessBoard.tsx
   ```

2. 或者手动将三个文件中的：
   ```tsx
   {gameStatus !== 'playing' && !showResultModal && (
   ```
   改回为：
   ```tsx
   {gameStatus !== 'playing' && (
   ```

---

## 八、最佳实践建议

### 8.1 弹窗管理规范
1. **单一职责**: 每个场景只使用一个弹窗组件
2. **状态互斥**: 多个弹窗必须通过状态控制互斥显示
3. **层级管理**: 使用 z-index 明确弹窗层级关系
4. **动画协调**: 确保弹窗切换时有平滑过渡

### 8.2 未来优化方向
- 考虑完全移除旧弹窗代码，统一使用新的 GameResultModal
- 添加全局弹窗管理器，统一控制所有弹窗的显示逻辑
- 考虑使用 Context 或 Zustand store 管理全局弹窗状态

---

**修复执行人**: AI Assistant
**审核状态**: 待审核
**文档版本**: v1.0
**修复完成时间**: 2026-05-25

---

# Chat页面邀请下棋功能添加记录

**修改日期**: 2026-05-25
**修改范围**: 前端 Chat.tsx 页面
**功能类型**: 新增功能

---

## 一、功能概述

### 1.1 功能描述
在聊天界面头部右侧添加"邀请下棋"按钮，点击后弹出游戏模式选择弹窗，用户可选择井字棋、五子棋、中国象棋三种游戏模式，选择后创建PVP对局并跳转到游戏页面。

### 1.2 功能特点
- 仅在私聊会话中显示（通知会话和世界频道不显示）
- 支持响应式设计（移动端/桌面端自适应）
- 支持暗色模式
- 弹窗使用 framer-motion 动画效果
- 游戏类型与后端一致：tictactoe、gomoku、chess

---

## 二、修改内容

### 2.1 Import 添加（第2行）
**新增图标**:
- `Gamepad2` - 邀请下棋按钮图标
- `ChevronRight` - 弹窗选项箭头图标

**新增API**:
- `gameApi` - 游戏相关API接口

### 2.2 State 变量添加（第49-50行）
```typescript
const [showGameInviteModal, setShowGameInviteModal] = useState(false);
const [isInvitingGame, setIsInvitingGame] = useState(false);
```

### 2.3 处理函数添加（第148行后）
**handleInviteGame 函数**:
- 调用 gameApi.createMatch 创建PVP对局
- 成功后显示toast提示，500ms后跳转游戏页面
- 失败时显示错误信息
- 完整的异常处理机制

### 2.4 UI 组件添加

#### Header 按钮（第556-564行）
- 位置：Header右侧，用户信息旁边
- 条件渲染：非通知会话 && 非世界频道 && 存在其他用户
- 样式：蓝色 Gamepad2 图标，hover效果

#### 邀请弹窗（ToastContainer之前）
- 全屏遮罩层（absolute inset-0 z-50）
- 居中弹窗卡片（max-w-sm）
- 弹窗内容：
  - 标题栏：邀请对弈 + 关闭按钮
  - 提示文字：显示对方昵称/用户名
  - 游戏选项列表：
    - 井字棋（⭕）- 简单快捷的三子连线
    - 五子棋（⚫）- 经典五子连珠
    - 中国象棋（♟️）- 楚河汉界，运筹帷幄
  - 底部提示：选择一个游戏模式开始对战

---

## 三、技术实现细节

### 3.1 条件渲染逻辑
```tsx
{!isNotificationConv && conversation?.type !== 'world' && otherUser && (
  <button>...</button>
)}
```
确保只在有效的私聊会话中显示按钮。

### 3.2 API 调用参数
```typescript
{
  gameType: string,      // 'tictactoe' | 'gomoku' | 'chess'
  mode: 'pvp',           // 玩家对战模式
  opponentId: number,    // 对手用户ID
  aiDifficulty: null     // PVP模式无AI难度
}
```

### 3.3 跳转逻辑
```typescript
navigate(`/games?matchId=${res.data.id}&gameType=${gameType}`);
```
携带对局ID和游戏类型参数跳转到游戏页面。

### 3.4 动画效果
- 弹窗入场：scale 0.9→1, y 20→0, spring动画
- 遮罩层：opacity 0→1
- 游戏选项hover：图标放大110%，边框变蓝

---

## 四、文件修改清单

### 4.1 修改的文件
- [Chat.tsx](file:///d:/Desktop/CDK%20IM/frontend/src/app/pages/Chat.tsx)
  - 第2行：添加 Gamepad2、ChevronRight import
  - 第15行：添加 gameApi import
  - 第49-50行：添加 state 变量
  - 第148-174行：添加 handleInviteGame 函数
  - 第556-564行：添加 Header 按钮
  - 第994-1061行：添加邀请弹窗组件

### 4.2 未修改的文件
- 所有消息收发逻辑保持不变
- WebSocket实时通信不受影响
- 其他UI组件未改动

---

## 五、测试要点

### 5.1 功能测试
- [ ] 私聊会话中显示邀请下棋按钮
- [ ] 通知会话中不显示按钮
- [ ] 世界频道中不显示按钮
- [ ] 点击按钮弹出选择弹窗
- [ ] 选择游戏模式后创建对局成功
- [ ] 创建失败时显示错误提示
- [ ] 成功后500ms跳转到游戏页面
- [ ] 点击遮罩层关闭弹窗
- [ ] 点击X按钮关闭弹窗
- [ ] 移动端响应式正常
- [ ] 暗色模式样式正确

### 5.2 边界情况测试
- [ ] 未登录状态下按钮不显示（otherUser为空）
- [ ] 网络异常时的错误处理
- [ ] 快速连续点击的防抖处理

---

## 六、注意事项

1. **依赖关系**: 需要 `gameApi.createMatch` 方法已实现
2. **路由依赖**: 需要 `/games` 路由已配置
3. **权限控制**: 只有登录用户且存在其他用户时才显示按钮
4. **性能影响**: 新增代码量约70行，不影响现有性能

---

**修改执行人**: AI Assistant
**审核状态**: 待审核
**文档版本**: v1.0
**修改完成时间**: 2026-05-25

---

# 三个棋盘组件 PVP（玩家对战）模式支持改造记录

**修改日期**: 2026-05-25
**修改范围**: 前端三个游戏棋盘组件
**功能类型**: 新增模式支持

---

## 一、改造背景

### 1.1 核心问题
每个棋盘组件接收 `matchId?: number` prop（解构为 `_matchId`），但内部有独立的 `matchId` state。`initMatch()` 总是调用 `gameApi.createMatch({ gameType, mode: 'ai' })` 创建新对局，**从未使用传入的 `_matchId`**。这导致从聊天页面"邀请下棋"创建的PVP对局无法被棋盘组件正确使用。

### 1.2 改造目标
使三个棋盘组件同时支持 AI 模式和 PVP 模式，通过 `mode` prop 区分：
- **AI模式** (`mode='ai'`, 默认): 保持原有全部逻辑不变
- **PVP模式** (`mode='pvp'`): 使用传入的 matchId，双方玩家轮流操作，禁用AI逻辑

---

## 二、修改内容（3个文件相同模式）

### 2.1 Props 接口扩展
```typescript
// 修改前
mode?: 'ai';
// 修改后
mode?: 'ai' | 'pvp';
```

### 2.2 initMatch 函数改造
增加 PVP 分支：当 `mode === 'pvp' && _matchId` 存在时，直接使用传入的 matchId 而非创建新对局。

### 2.3 generateOpponent 条件调用
仅在 `mode === 'ai'` 时生成虚拟对手信息，PVP 模式不生成。

### 2.4 handleClick 双方操作支持
- **AI模式**: 仅允许玩家方操作（X/黑/红），落子后触发AI思考
- **PVP模式**: 允许双方轮流操作，动态判断当前符号，不触发AI思考
- **新增胜利判定**: PVP模式下对手（O/白/黑）胜利时正确判定为 lost

### 2.5 AI 思考 useEffect 跳过
在 useEffect 入口增加 `mode === 'pvp'` 提前返回条件。

### 2.6 statusText 状态文本适配
PVP 模式下显示当前轮到哪一方（如 "X 的回合"、"黑方的回合"）。

### 2.7 棋盘交互条件适配
按钮 disabled/hover/canClick 等条件中的 `currentPlayer === BLACK` / `currentTurn === 'red'` 限制改为 `(mode === 'pvp' || currentPlayer === BLACK)` 形式。

---

## 三、各文件改动详情

### 3.1 TicTacToeBoard.tsx
| 改动点 | 说明 |
|--------|------|
| L14 | Props: `mode\|'pvp'` |
| L291-294 | generateOpponent 仅 AI 模式 |
| L300-303 | initMatch 增加 PVP 分支（直接 setMatchId(_matchId)）|
| L322 | initMatch useEffect 依赖加 `[mode, _matchId]` |
| L338-420 | handleClick 重构：双方落子 + O方胜利判定 + 动态symbol + 条件AI触发 |
| L424 | AI思考 useEffect 加 `mode === 'pvp'` 跳过 |
| L500 | AI思考依赖数组加 mode |
| L587-589 | statusText 显示 "X/O 的回合" |

**特殊处理**: 井字棋中 X 为玩家、O 为对手(AI)。PVP模式下 O 方胜利触发 `setGameStatus('lost')`。

### 3.2 GomokuBoard.tsx
| 改动点 | 说明 |
|--------|------|
| L14 | Props: `mode\|'pvp'` |
| L579-582 | generateOpponent 仅 AI 模式 |
| L587-604 | initMatch 从内联useEffect重构为 useCallback + PVP分支 |
| L618 | AI思考 useEffect 加 `mode === 'pvp'` 跳过 |
| L681 | AI思考依赖数组加 mode |
| L696-756 | handleClick 重构：双方落子 + 白方胜利判定 + 动态B/W symbol |
| L854-856 | statusText 显示 "黑方/白方的回合" |
| L1035, L1048 | 棋格 hover/canClick 条件适配PVP |

**特殊处理**: 五子棋中黑(B)为先手/玩家，白(W)为后手/AI。PVP模式下白方胜利触发 `setGameStatus('lost')`。initMatch 原本内联在 useEffect 中，本次重构为独立 useCallback 以支持依赖注入。

### 3.3 ChineseChessBoard.tsx
| 改动点 | 说明 |
|--------|------|
| L20 | Props: `mode\|'pvp'` |
| L173-176 | generateOpponent 仅 AI 模式 |
| L319-335 | initMatch 从内联useEffect重构为 useCallback + PVP分支 |
| L265 | AI思考 useEffect 加 `mode === 'pvp'` 跳过 |
| L332 | AI思考依赖数组加 mode |
| L178-252 | handleClick 大幅重构：双方选子/落子 + 黑方吃将胜利 + 动态R/B symbol + nextTurn计算 |
| L417-419 | statusText 显示 "红方/黑方的回合" |
| L563-564 | canClick 条件适配PVP |

**特殊处理**: 中国象棋中红(R)为先手/玩家，黑(B)为后手/AI。PVP模式下黑方吃掉红方将时触发 `setGameStatus('lost')`。选子逻辑也需适配：PVP下只能选当前回合颜色的棋子。

---

## 四、保持不变的部分

以下功能/逻辑在两种模式下行为一致，未做修改：

| 功能 | 说明 |
|------|------|
| `processMatchFinish` | 结算逻辑完全不变 |
| `GameResultModal` | 结算弹窗完全不变 |
| `useGameHeartbeat` | 心跳检测已支持任意 matchId |
| `surrender` | 认输逻辑不变 |
| `resetBoard` | 重开总是创建新AI对局 |
| `saveGameResult` | localStorage 统计不变 |
| 所有动画效果 | framer-motion 动画不变 |
| UI布局/样式 | 完全不变 |

---

## 五、数据流对比

### AI 模式（默认）
```
用户落子(X/B/R) → 上报move API → 检查胜利 → 触发isAIThinking
→ AI思考动画 → AI落子(O/W/B) → 上报move API → 检查胜负 → 循环
```

### PVP 模式
```
当前方落子(动态symbol) → 上报move API → 检查胜利(双方)
→ 切换nextTurn → 等待另一方落子 → 循环
（无AI介入）
```

---

## 六、验证要点

### 6.1 AI模式回归测试
- [ ] 默认进入游戏仍为AI模式，行为与改造前完全一致
- [ ] 对手卡片正常显示
- [ ] AI思考进度条正常
- [ ] 胜负判定正常
- [ ] 积分结算正常
- [ ] 心跳检测正常

### 6.2 PVP模式功能测试
- [ ] 传入 `mode='pvp'` + `matchId=123` 后不调用 createMatch
- [ ] matchId state 正确设置为传入值
- [ ] 双方能交替落子
- [ ] O/白/黑方胜利时正确判负
- [ ] 不显示对手信息卡片（或显示空白）
- [ ] 不触发AI思考动画
- [ ] statusText 正确显示当前方
- [ ] move API 上报正确的 symbol
- [ ] 心跳检测正常工作

### 6.3 边界情况
- [ ] PVP模式下重开游戏的行为
- [ ] PVP模式下认输功能正常
- [ ] 快速连续点击不会导致状态异常

---

## 七、文件修改清单

| 文件 | 改动数 | 改动类型 |
|------|--------|---------|
| [TicTacToeBoard.tsx](frontend/src/app/components/games/TicTacToeBoard.tsx) | 8处 | Props+initMatch+handleClick+AI跳过+statusText+依赖 |
| [GomokuBoard.tsx](frontend/src/app/components/games/GomokuBoard.tsx) | 9处 | Props+initMatch重构+handleClick+AI跳过+statusText+交互条件 |
| [ChineseChessBoard.tsx](frontend/src/app/components/games/ChineseChessBoard.tsx) | 9处 | Props+initMatch重构+handleClick大幅重构+AI跳过+statusText+canClick |
| [MODIFICATION_RECORD_20260525.md](MODIFICATION_RECORD_20260525.md) | 1处 | 追加本文档记录 |

---

**修改执行人**: AI Assistant
**审核状态**: 待审核
**文档版本**: v1.0
**修改完成时间**: 2026-05-25

---

# PVP游戏邀请系统后端实现记录

**修改日期**: 2026-05-25
**修改范围**: 后端三个文件
**功能类型**: 新增功能

---

## 一、功能概述

### 1.1 功能描述
实现完整的PVP游戏邀请系统，支持用户向其他用户发送游戏邀请，被邀请方可以接受或拒绝邀请。系统通过WebSocket实时通知双方用户。

### 1.2 核心功能
- **创建邀请**: 邀请方选择游戏类型并发送邀请
- **响应邀请**: 被邀请方可接受或拒绝邀请
- **实时通知**: 通过WebSocket推送邀请状态变更
- **状态管理**: pending（待响应）→ playing（进行中）/ rejected（已拒绝）

---

## 二、API接口设计

### 2.1 创建邀请接口
- **路由**: `POST /api/game/invite`
- **认证**: 需要登录（authMiddleware）
- **请求体**:
  ```json
  {
    "opponentId": number,    // 被邀请用户ID
    "gameType": string       // 游戏类型: gomoku | tictactoe | chess
  }
  ```
- **响应**:
  ```json
  { "code": 200, "data": match, "msg": "邀请已发送" }
  ```

### 2.2 响应邀请接口
- **路由**: `POST /api/game/invite/respond`
- **认证**: 需要登录（authMiddleware）
- **请求体**:
  ```json
  {
    "matchId": number,       // 对局ID
    "accepted": boolean      // true=接受, false=拒绝
  }
  ```
- **响应（接受）**:
  ```json
  { "code": 200, "data": match, "msg": "接受成功，即将开始对局" }
  ```
- **响应（拒绝）**:
  ```json
  { "code": 200, "data": { "rejected": true }, "msg": "已拒绝邀请" }
  ```

---

## 三、WebSocket消息类型

### 3.1 邀请通知（发送给被邀请方）
```json
{
  "type": "game_invite",
  "data": {
    "matchId": number,
    "gameType": string,
    "inviterId": number,
    "inviterName": string
  }
}
```

### 3.2 接受通知（发送给邀请方）
```json
{
  "type": "game_invite_accepted",
  "data": {
    "matchId": number,
    "gameType": string
  }
}
```

### 3.3 拒绝通知（发送给邀请方）
```json
{
  "type": "game_invite_rejected",
  "data": {
    "matchId": number
  }
}
```

---

## 四、数据库设计

### 4.1 game_match 表新增状态
- `pending`: 邀待响应（新建邀请时的初始状态）
- `rejected`: 已拒绝（被邀请方拒绝）

### 4.2 数据流程
1. 创建邀请时：插入记录，status='pending', mode='pvp'
2. 接受邀请时：更新 status='playing'
3. 拒绝邀请时：更新 status='rejected', 设置 finished_at

---

## 五、修改文件清单

### 5.1 GameService.js
**文件路径**: [GameService.js](file:///d:/Desktop/CDK%20IM/backend/src/services/GameService.js)
**新增方法**:

#### createInvite(inviterId, opponentId, gameType)
- **位置**: 第318行（finishAbandonedMatches方法之后）
- **功能**: 创建PVP游戏邀请
- **参数验证**:
  - gameType 必须是 gomoku/tictactoe/chess 之一
- **数据库操作**:
  1. INSERT 创建对局记录（status='pending'）
  2. UPDATE 设置 player2_id
  3. SELECT 返回完整对局信息
- **返回值**: 完整的 match 对象

#### respondInvite(matchId, userId, accepted)
- **位置**: 第349行（createInvite方法之后）
- **功能**: 响应游戏邀请（接受/拒绝）
- **业务逻辑**:
  1. 验证对局是否存在
  2. 检查状态是否为 pending（防止重复响应）
  3. 验证操作权限（只有被邀请方能操作）
  4. 接受：更新 status='playing'
  5. 拒绝：更新 status='rejected', 设置 finished_at
- **返回值**:
  - 成功接受: `{ success: true, match: updatedMatch }`
  - 成功拒绝: `{ success: true, rejected: true, matchId }`
  - 失败: `{ success: false, error: '错误信息' }`

### 5.2 GameController.js
**文件路径**: [GameController.js](file:///d:/Desktop/CDK%20IM/backend/src/controllers/GameController.js)
**新增方法**:

#### invite(req, res)
- **位置**: 第190行（getRandomOpponent方法之后）
- **功能**: 处理创建邀请的HTTP请求
- **处理流程**:
  1. 从 req.body 提取 opponentId 和 gameType
  2. 参数校验（不能为空）
  3. 调用 GameService.createInvite 创建邀请
  4. 查询邀请方昵称（用于WS通知显示）
  5. 通过 WebSocket 发送 game_invite 通知给被邀请方
  6. 返回成功响应
- **异常处理**:
  - WS发送失败仅打印日志（用户可能离线）
  - 其他错误返回500状态码

#### respondInvite(req, res)
- **位置**: 第232行（invite方法之后）
- **功能**: 处理响应邀请的HTTP请求
- **处理流程**:
  1. 从 req.body 提取 matchId 和 accepted
  2. 参数校验（matchId必填，accepted必须为boolean）
  3. 调用 GameService.respondInvite 处理业务逻辑
  4. 如果拒绝：通过WS发送 game_invite_rejected 通知给邀请方
  5. 如果接受：通过WS发送 game_invite_accepted 通知给邀请方
  6. 返回对应的成功响应
- **异常处理**:
  - WS通知失败静默处理（不影响主流程）
  - 业务逻辑错误返回400状态码

### 5.3 game.js 路由文件
**文件路径**: [game.js](file:///d:/Desktop/CDK%20IM/backend/src/routes/game.js)
**新增路由**:

#### POST /invite
- **位置**: 第8行（createMatch路由之后）
- **中间件**: authMiddleware（需要登录）
- **控制器**: GameController.invite

#### POST /invite/respond
- **位置**: 第9行（invite路由之后）
- **中间件**: authMiddleware（需要登录）
- **控制器**: GameController.respondInvite

---

## 六、技术特点

### 6.1 安全性
- ✅ 所有接口需要身份认证
- ✅ 参数完整性校验
- ✅ 权限验证（只有被邀请方能响应）
- ✅ 状态校验（防止重复响应已失效的邀请）

### 6.2 可靠性
- ✅ WebSocket通知失败不影响主流程（容错机制）
- ✅ 数据库事务保证数据一致性
- ✅ 完善的错误处理和日志记录

### 6.3 实时性
- ✅ 使用WebSocket实现毫秒级消息推送
- ✅ 支持三种消息类型（邀请/接受/拒绝）
- ✅ 消息格式统一规范

### 6.4 扩展性
- ✅ 游戏类型通过数组配置，易于扩展
- ✅ 消息类型可扩展（如超时自动取消等）
- ✅ 状态机清晰，便于添加新状态

---

## 七、使用示例

### 7.1 前端调用示例（创建邀请）
```typescript
// 用户A邀请用户B玩五子棋
const response = await fetch('/api/game/invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    opponentId: 123,
    gameType: 'gomoku'
  })
});
const result = await response.json();
// result.data.matchId = 新建的对局ID
```

### 7.2 前端调用示例（响应邀请）
```typescript
// 用户B接受邀请
const response = await fetch('/api/game/invite/respond', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    matchId: 456,
    accepted: true
  })
});
const result = await response.json();
// result.data = 对局信息（包含完整棋盘状态）
```

### 7.3 WebSocket监听示例
```typescript
// 被邀请方监听邀请通知
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'game_invite') {
    // 显示邀请弹窗
    showInviteDialog(message.data);
  }
};
```

---

## 八、测试要点

### 8.1 功能测试
- [ ] 创建邀请成功（有效参数）
- [ ] 创建邀请失败（无效gameType）
- [ ] 创建邀请失败（缺少参数）
- [ ] 接受邀请成功（状态变为playing）
- [ ] 拒绝邀请成功（状态变为rejected）
- [ ] 重复响应邀请失败（状态非pending）
- [ ] 无权响应邀请（非player2_id用户）
- [ ] 对局不存在时返回错误

### 8.2 WebSocket测试
- [ ] 被邀请方在线时收到邀请通知
- [ ] 被邀请方离线时不影响邀请创建
- [ ] 接受邀请后邀请方收到接受通知
- [ ] 拒绝邀请后邀请方收到拒绝通知
- [ ] WS通知包含正确的数据（matchId、gameType等）

### 8.3 边界情况测试
- [ ] 邀请自己（应该允许或阻止）
- [ ] 同时收到多个邀请
- [ ] 邀请已存在的对局中的用户
- [ ] 网络中断后的重试机制

---

## 九、注意事项

1. **依赖项**:
   - 需要 `query` 函数（从 ../utils/db.js 导入）✅ 已有
   - 需要 `sendToUser` 函数（从 ../utils/websocket.js 导入）✅ 已有
   - 需要 `authMiddleware` 中间件 ✅ 已有

2. **数据库要求**:
   - game_match 表需支持 status 字段存储 'pending' 和 'rejected' 值
   - player2_id 字段可为 NULL（创建时先NULL再UPDATE）

3. **前端配合**:
   - 需要前端实现邀请UI组件
   - 需要前端监听WebSocket的 game_invite 消息
   - 需要前端调用 /invite/respond 接口响应用户操作

4. **性能考虑**:
   - 创建邀请涉及两次数据库操作（INSERT + UPDATE），可优化为单次INSERT
   - WebSocket通知使用动态import避免循环依赖

---

## 十、未来优化方向

### 10.1 功能增强
- [ ] 添加邀请超时自动取消（如30秒未响应）
- [ ] 添加邀请列表查询接口（查看收到的所有邀请）
- [ ] 添加撤销邀请功能（邀请方主动取消）
- [ ] 添加邀请消息自定义（附带留言）

### 10.2 性能优化
- [ ] 将 INSERT + UPDATE 合并为单次SQL操作
- [ ] 添加Redis缓存减少数据库查询
- [ ] 批量WebSocket推送优化

### 10.3 安全加固
- [ ] 添加请求频率限制（防刷邀请）
- [ ] 添加黑名单/屏蔽功能
- [ ] 添加邀请次数限制（每日上限）

---

**修改执行人**: AI Assistant
**审核状态**: 待审核
**文档版本**: v1.0
**修改完成时间**: 2026-05-25
