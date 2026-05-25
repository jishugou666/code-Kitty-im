export type Color = 'red' | 'black'

export interface Piece {
  type: PieceType
  color: Color
}

export type PieceType = 'king' | 'advisor' | 'elephant' | 'rook' | 'horse' | 'cannon' | 'pawn'

export type Board = (Piece | null)[][]

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
}

export interface MoveRecord {
  from: Position
  to: Position
  piece: Piece
  captured: Piece | null
}

const ROWS = 10
const COLS = 9

const PIECE_NAMES: Record<PieceType, Record<Color, string>> = {
  king: { red: '帥', black: '將' },
  advisor: { red: '仕', black: '士' },
  elephant: { red: '相', black: '象' },
  rook: { red: '車', black: '車' },
  horse: { red: '馬', black: '馬' },
  cannon: { red: '炮', black: '砲' },
  pawn: { red: '兵', black: '卒' },
}

const PIECE_VALUES: Record<PieceType, number> = {
  king: 100000,
  rook: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100,
}

const KING_PALACE_ROWS: Record<Color, [number, number]> = {
  black: [0, 2],
  red: [7, 9],
}

const KING_PALACE_COLS: [number, number] = [3, 5]

function inPalace(row: number, col: number, color: Color): boolean {
  const [minR, maxR] = KING_PALACE_ROWS[color]
  return row >= minR && row <= maxR && col >= KING_PALACE_COLS[0] && col <= KING_PALACE_COLS[1]
}

function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS
}

function opponentColor(color: Color): Color {
  return color === 'red' ? 'black' : 'red'
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))

  const place = (row: number, col: number, type: PieceType, color: Color) => {
    board[row][col] = { type, color }
  }

  place(0, 0, 'rook', 'black')
  place(0, 1, 'horse', 'black')
  place(0, 2, 'elephant', 'black')
  place(0, 3, 'advisor', 'black')
  place(0, 4, 'king', 'black')
  place(0, 5, 'advisor', 'black')
  place(0, 6, 'elephant', 'black')
  place(0, 7, 'horse', 'black')
  place(0, 8, 'rook', 'black')
  place(2, 1, 'cannon', 'black')
  place(2, 7, 'cannon', 'black')
  place(3, 0, 'pawn', 'black')
  place(3, 2, 'pawn', 'black')
  place(3, 4, 'pawn', 'black')
  place(3, 6, 'pawn', 'black')
  place(3, 8, 'pawn', 'black')

  place(9, 0, 'rook', 'red')
  place(9, 1, 'horse', 'red')
  place(9, 2, 'elephant', 'red')
  place(9, 3, 'advisor', 'red')
  place(9, 4, 'king', 'red')
  place(9, 5, 'advisor', 'red')
  place(9, 6, 'elephant', 'red')
  place(9, 7, 'horse', 'red')
  place(9, 8, 'rook', 'red')
  place(7, 1, 'cannon', 'red')
  place(7, 7, 'cannon', 'red')
  place(6, 0, 'pawn', 'red')
  place(6, 2, 'pawn', 'red')
  place(6, 4, 'pawn', 'red')
  place(6, 6, 'pawn', 'red')
  place(6, 8, 'pawn', 'red')

  return board
}

export function pieceName(piece: Piece): string {
  return PIECE_NAMES[piece.type][piece.color]
}

export function pieceValue(type: PieceType): number {
  return PIECE_VALUES[type]
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null))
}

function findKing(board: Board, color: Color): Position | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c]
      if (p && p.type === 'king' && p.color === color) return { row: r, col: c }
    }
  }
  return null
}

function kingsFaceEachOther(board: Board): boolean {
  const redKing = findKing(board, 'red')
  const blackKing = findKing(board, 'black')
  if (!redKing || !blackKing) return false
  if (redKing.col !== blackKing.col) return false
  const minRow = Math.min(redKing.row, blackKing.row)
  const maxRow = Math.max(redKing.row, blackKing.row)
  for (let r = minRow + 1; r < maxRow; r++) {
    if (board[r][redKing.col] !== null) return false
  }
  return true
}

function isKingInCheck(board: Board, color: Color): boolean {
  const king = findKing(board, color)
  if (!king) return true

  const opp = opponentColor(color)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c]
      if (p && p.color === opp) {
        const moves = getRawMoves(board, { row: r, col: c }, p)
        if (moves.some(m => m.row === king.row && m.col === king.col)) return true
      }
    }
  }
  if (kingsFaceEachOther(board)) return true
  return false
}

function getKingMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    if (!inPalace(nr, nc, piece.color)) continue
    const target = board[nr][nc]
    if (target && target.color === piece.color) continue
    moves.push({ row: nr, col: nc })
  }
  return moves
}

function getAdvisorMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    if (!inPalace(nr, nc, piece.color)) continue
    const target = board[nr][nc]
    if (target && target.color === piece.color) continue
    moves.push({ row: nr, col: nc })
  }
  return moves
}

function getElephantMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const eyeOffsets: [number, number, number, number][] = [
    [-2, -2, -1, -1], [-2, 2, -1, 1], [2, -2, 1, -1], [2, 2, 1, 1]
  ]
  for (const [dr, dc, er, ec] of eyeOffsets) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    const isRed = piece.color === 'red'
    if (isRed && nr < 5) continue
    if (!isRed && nr > 4) continue
    const eyeR = pos.row + er
    const eyeC = pos.col + ec
    if (board[eyeR][eyeC] !== null) continue
    const target = board[nr][nc]
    if (target && target.color === piece.color) continue
    moves.push({ row: nr, col: nc })
  }
  return moves
}

function getHorseMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const legOffsets: [number, number, number, number][] = [
    [-2, -1, -1, 0], [-2, 1, -1, 0],
    [2, -1, 1, 0], [2, 1, 1, 0],
    [-1, -2, 0, -1], [-1, 2, 0, 1],
    [1, -2, 0, -1], [1, 2, 0, 1],
  ]
  for (const [dr, dc, lr, lc] of legOffsets) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!inBoard(nr, nc)) continue
    const legR = pos.row + lr
    const legC = pos.col + lc
    if (board[legR][legC] !== null) continue
    const target = board[nr][nc]
    if (target && target.color === piece.color) continue
    moves.push({ row: nr, col: nc })
  }
  return moves
}

function getRookMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    let nr = pos.row + dr
    let nc = pos.col + dc
    while (inBoard(nr, nc)) {
      const target = board[nr][nc]
      if (target) {
        if (target.color !== piece.color) moves.push({ row: nr, col: nc })
        break
      }
      moves.push({ row: nr, col: nc })
      nr += dr
      nc += dc
    }
  }
  return moves
}

function getCannonMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    let nr = pos.row + dr
    let nc = pos.col + dc
    while (inBoard(nr, nc) && board[nr][nc] === null) {
      moves.push({ row: nr, col: nc })
      nr += dr
      nc += dc
    }
    nr += dr
    nc += dc
    while (inBoard(nr, nc) && board[nr][nc] === null) {
      nr += dr
      nc += dc
    }
    if (inBoard(nr, nc)) {
      const target = board[nr][nc]
      if (target && target.color !== piece.color) {
        moves.push({ row: nr, col: nc })
      }
    }
  }
  return moves
}

function getPawnMoves(board: Board, pos: Position, piece: Piece): Position[] {
  const moves: Position[] = []
  const isRed = piece.color === 'red'
  const forward = isRed ? -1 : 1
  const crossedRiver = isRed ? pos.row <= 4 : pos.row >= 5

  const fwdR = pos.row + forward
  if (inBoard(fwdR, pos.col)) {
    const target = board[fwdR][pos.col]
    if (!target || target.color !== piece.color) {
      moves.push({ row: fwdR, col: pos.col })
    }
  }
  if (crossedRiver) {
    for (const dc of [-1, 1]) {
      const nc = pos.col + dc
      if (!inBoard(pos.row, nc)) continue
      const target = board[pos.row][nc]
      if (!target || target.color !== piece.color) {
        moves.push({ row: pos.row, col: nc })
      }
    }
  }
  return moves
}

function getRawMoves(board: Board, pos: Position, piece: Piece): Position[] {
  switch (piece.type) {
    case 'king': return getKingMoves(board, pos, piece)
    case 'advisor': return getAdvisorMoves(board, pos, piece)
    case 'elephant': return getElephantMoves(board, pos, piece)
    case 'rook': return getRookMoves(board, pos, piece)
    case 'horse': return getHorseMoves(board, pos, piece)
    case 'cannon': return getCannonMoves(board, pos, piece)
    case 'pawn': return getPawnMoves(board, pos, piece)
  }
}

export function getLegalMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col]
  if (!piece) return []

  const raw = getRawMoves(board, pos, piece)
  return raw.filter(to => {
    const newBoard = cloneBoard(board)
    newBoard[to.row][to.col] = newBoard[pos.row][pos.col]
    newBoard[pos.row][pos.col] = null
    return !isKingInCheck(newBoard, piece.color) && !kingsFaceEachOther(newBoard)
  })
}

export function getAllLegalMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c]
      if (p && p.color === color) {
        const from = { row: r, col: c }
        for (const to of getLegalMoves(board, from)) {
          moves.push({ from, to })
        }
      }
    }
  }
  return moves
}

export function makeMove(board: Board, from: Position, to: Position): { newBoard: Board; captured: Piece | null } {
  const newBoard = cloneBoard(board)
  const captured = newBoard[to.row][to.col]
  newBoard[to.row][to.col] = newBoard[from.row][from.col]
  newBoard[from.row][from.col] = null
  return { newBoard, captured }
}

export function isCheckmate(board: Board, color: Color): boolean {
  return getAllLegalMoves(board, color).length === 0
}

export function isInCheck(board: Board, color: Color): boolean {
  return isKingInCheck(board, color)
}

function countPieces(board: Board, color: Color): number {
  let count = 0
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]?.color === color) count++
  return count
}

function evaluateBoard(board: Board): number {
  let score = 0
  let redMobility = 0
  let blackMobility = 0

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c]
      if (!p) continue
      const val = pieceValue(p.type)
      const mob = getRawMoves(board, { row: r, col: c }, p).length
      if (p.color === 'red') {
        score += val
        redMobility += mob
        if (p.type === 'pawn' && r <= 4) score += 80
        if (p.type === 'king') {
          score += (7 - r) * 15
          score -= Math.abs(c - 4) * 10
        }
        if (p.type === 'rook' && r <= 4) score += 30
        if (p.type === 'horse' && r >= 5) score += 20
      } else {
        score -= val
        blackMobility += mob
        if (p.type === 'pawn' && r >= 5) score -= 80
        if (p.type === 'king') {
          score -= r * 15
          score += Math.abs(c - 4) * 10
        }
        if (p.type === 'rook' && r >= 5) score -= 30
        if (p.type === 'horse' && r <= 4) score -= 20
      }
    }
  }

  score += redMobility * 2
  score -= blackMobility * 2

  const redCount = countPieces(board, 'red')
  const blackCount = countPieces(board, 'black')
  if (redCount < blackCount + 3) score -= 20
  if (blackCount < redCount + 3) score += 20

  return score
}

function orderMoves(board: Board, moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    const capturedA = board[a.to.row][a.to.col]
    const capturedB = board[b.to.row][b.to.col]
    const capValA = capturedA ? pieceValue(capturedA.type) : 0
    const capValB = capturedB ? pieceValue(capturedB.type) : 0
    let scoreA = capValA
    let scoreB = capValB
    const pieceA = board[a.from.row][a.from.col]
    const pieceB = board[b.from.row][b.from.col]
    const pieceValA = pieceA ? pieceValue(pieceA.type) : 0
    const pieceValB = pieceB ? pieceValue(pieceB.type) : 0
    if (capValA > 0 && pieceValA < capValA * 0.5) scoreA += 500
    if (capValB > 0 && pieceValB < capValB * 0.5) scoreB += 500
    if (!capturedA) {
      const atkA = getRawMoves(board, a.to, pieceA!).length
      scoreA -= Math.max(0, 3 - atkA) * 5
    }
    return scoreB - scoreA
  })
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  color: Color
): number {
  if (depth <= 0) return evaluateBoard(board)

  const moves = getAllLegalMoves(board, color)
  if (moves.length === 0) {
    if (isKingInCheck(board, color)) return isMaximizing ? -100000 + (4 - depth) * 1000 : 100000 - (4 - depth) * 1000
    return 0
  }

  const ordered = orderMoves(board, moves)
  const maxMoves = Math.min(ordered.length, 30)

  if (isMaximizing) {
    let maxEval = -Infinity
    for (let i = 0; i < maxMoves; i++) {
      const { from, to } = ordered[i]
      const { newBoard } = makeMove(board, from, to)
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, false, opponentColor(color))
      maxEval = Math.max(maxEval, eval_)
      alpha = Math.max(alpha, eval_)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (let i = 0; i < maxMoves; i++) {
      const { from, to } = ordered[i]
      const { newBoard } = makeMove(board, from, to)
      const eval_ = minimax(newBoard, depth - 1, alpha, beta, true, opponentColor(color))
      minEval = Math.min(minEval, eval_)
      beta = Math.min(beta, eval_)
      if (beta <= alpha) break
    }
    return minEval
  }
}

function easyAI(board: Board, color: Color): Move {
  const moves = getAllLegalMoves(board, color)

  const captures = moves.filter(m => board[m.to.row][m.to.col] !== null)
  if (captures.length > 0 && Math.random() < 0.7) {
    const bigCaps = captures.filter(m => pieceValue(board[m.to.row][m.to.col]!.type) >= 350)
    if (bigCaps.length > 0 && Math.random() < 0.7) return bigCaps[Math.floor(Math.random() * bigCaps.length)]
    return captures[Math.floor(Math.random() * captures.length)]
  }

  const checks = moves.filter(m => {
    const { newBoard } = makeMove(board, m.from, m.to)
    return isKingInCheck(newBoard, opponentColor(color))
  })
  if (checks.length > 0 && Math.random() < 0.5) return checks[Math.floor(Math.random() * checks.length)]

  if (Math.random() < 0.4) return moves[Math.floor(Math.random() * moves.length)]

  const ordered = orderMoves(board, moves).slice(0, 12)
  let bestScore = -Infinity
  let bestMove = ordered[0]
  for (const move of ordered) {
    const { newBoard } = makeMove(board, move.from, move.to)
    let score = evaluateBoard(newBoard)
    if (color === 'black') score = -score

    const capPiece = board[move.to.row][move.to.col]
    if (capPiece) {
      const dangerPiece = board[move.from.row][move.from.col]
      const safe = !getRawMoves(newBoard, move.to, dangerPiece!).some(t => {
        const target = newBoard[t.row][t.col]
        return target && target.color === opponentColor(color)
      })
      if (!safe) continue
    }

    if (score > bestScore) { bestScore = score; bestMove = move }
  }
  return bestMove
}

function mediumAI(board: Board, color: Color, depth = 3): Move {
  const moves = getAllLegalMoves(board, color)
  const opp = opponentColor(color)

  for (const move of moves) {
    if (board[move.to.row][move.to.col]?.type === 'king') return move
  }

  const checks = moves.filter(m => {
    const { newBoard } = makeMove(board, m.from, m.to)
    return isKingInCheck(newBoard, opp)
  })

  const ordered = orderMoves(board, moves).slice(0, 20)

  let bestScore = -Infinity
  let bestMove = ordered[0]

  for (const move of ordered) {
    const { newBoard } = makeMove(board, move.from, move.to)
    const score = -minimax(newBoard, depth - 1, -Infinity, Infinity, false, opp)
    const isCheck = isKingInCheck(newBoard, opp)
    const finalScore = score + (isCheck ? 50 : 0)

    if (finalScore > bestScore) {
      bestScore = finalScore
      bestMove = move
    }
  }
  return bestMove
}

function hardAI(board: Board, color: Color, depth = 5, moveCount: number): Move {
  const moves = getAllLegalMoves(board, color)
  const opp = opponentColor(color)

  for (const move of moves) {
    if (board[move.to.row][move.to.col]?.type === 'king') return move
  }

  const ordered = orderMoves(board, moves).slice(0, 25)

  if (moveCount <= 3) {
    const openingMoves = ordered.filter(m => {
      const p = board[m.from.row][m.from.col]
      return p && (p.type === 'cannon' || p.type === 'horse' || p.type === 'rook')
    }).slice(0, 10)
    if (openingMoves.length > 0) return openingMoves[Math.floor(Math.random() * openingMoves.length)]
  }

  let bestScore = -Infinity
  let bestMove = ordered[0]

  for (const move of ordered) {
    const { newBoard } = makeMove(board, move.from, move.to)
    const oppMoves = getAllLegalMoves(newBoard, opp)
    if (oppMoves.length === 0) return move
    const score = -minimax(newBoard, depth - 1, -Infinity, Infinity, false, opp)
    const isCheck = isKingInCheck(newBoard, opp)
    const finalScore = score + (isCheck ? 100 : 0)

    if (finalScore > bestScore) {
      bestScore = finalScore
      bestMove = move
    }
  }
  return bestMove
}

export function getAIMove(
  board: Board,
  difficulty: 'easy' | 'medium' | 'hard',
  color: Color,
  moveCount: number
): Move {
  switch (difficulty) {
    case 'easy': return easyAI(board, color)
    case 'medium': return mediumAI(board, color)
    case 'hard': return hardAI(board, color, 4, moveCount)
  }
}

export function getInitialFEN(): Board {
  return createInitialBoard()
}

export { ROWS, COLS }
