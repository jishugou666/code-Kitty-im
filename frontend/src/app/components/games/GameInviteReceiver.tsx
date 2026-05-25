import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Gamepad2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface InviteData {
  matchId: number;
  gameType: string;
  inviterId: number | string;
  inviterName: string;
}

const GAME_TYPE_MAP: Record<string, { name: string; icon: string; color: string }> = {
  tictactoe: { name: '井字棋', icon: '⭕', color: 'from-blue-500 to-cyan-400' },
  gomoku: { name: '五子棋', icon: '⚫', color: 'from-emerald-500 to-green-400' },
  chess: { name: '中国象棋', icon: '♟️', color: 'from-red-500 to-orange-400' }
};

const COUNTDOWN_SECONDS = 30;

export function GameInviteReceiver() {
  const { toast } = useToast();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [responding, setResponding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWS = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'game_invite') {
            setInvite(msg.data);
            setCountdown(COUNTDOWN_SECONDS);
          } else if (msg.type === 'game_invite_accepted') {
            toast('对方接受了你的邀请！正在进入对局...', 'success');
            setTimeout(() => {
              window.location.href = `/games?matchId=${msg.data.matchId}&gameType=${msg.data.gameType}`;
            }, 800);
          } else if (msg.type === 'game_invite_rejected') {
            toast('对方拒绝了你的邀请', 'info');
          }
        } catch {}
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWS();
    wsRef.current = ws;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [toast]);

  useEffect(() => {
    if (!invite) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleRespond(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [!!invite]);

  const handleRespond = useCallback(async (accepted: boolean) => {
    if (!invite || responding) return;
    setResponding(true);

    try {
      const { gameApi } = await import('../../../api/game');
      const res = await gameApi.respondGameInvite({
        matchId: invite.matchId,
        accepted
      });

      if (res.code === 200 && accepted) {
        toast('接受成功！进入对局...', 'success');
        setTimeout(() => {
          window.location.href = `/games?matchId=${invite.matchId}&gameType=${invite.gameType}`;
        }, 600);
      } else {
        setInvite(null);
      }
    } catch {
      setInvite(null);
    } finally {
      setResponding(false);
    }
  }, [invite, responding, toast]);

  if (!invite) return null;

  const gameInfo = GAME_TYPE_MAP[invite.gameType] || GAME_TYPE_MAP.tictactoe;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        onClick={() => !responding && handleRespond(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-2xl shadow-black/40"
        >
          <div className="p-5 pb-3 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 shadow-lg shadow-indigo-500/25">
              <Gamepad2 size={28} className="text-white" />
            </div>
            
            <h3 className="text-lg font-bold text-white">游戏邀请</h3>
            <p className="text-sm text-gray-400 mt-1">
              <span className="font-medium text-gray-200">{invite.inviterName}</span> 邀请你进行一局
              <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${gameInfo.color}`}>
                {' '}{gameInfo.name}
              </span>
            </p>

            <div className={`
              mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-gradient-to-r ${gameInfo.color}
              text-white font-semibold text-sm shadow-md
            `}>
              <span className="text-lg">{gameInfo.icon}</span>
              {gameInfo.name}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-3 px-5">
            <Clock size={15} className={countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-500'} />
            <span className={`text-sm tabular-nums font-medium ${countdown <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
              {countdown <= 10 ? (
                <span className="text-red-400 font-bold">即将自动拒绝 ({countdown}s)</span>
              ) : (
                `剩余 ${countdown} 秒`
              )}
            </span>
          </div>

          <div className="flex gap-3 p-5 pt-2">
            <button
              onClick={() => handleRespond(false)}
              disabled={responding}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                transition-all duration-150 disabled:opacity-50
                bg-white/5 text-gray-300 border border-white/10
                hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30
              `}
            >
              <XCircle size={18} />
              拒绝
            </button>
            
            <button
              onClick={() => handleRespond(true)}
              disabled={responding}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white
                transition-all duration-150 disabled:opacity-50
                bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500
                hover:from-emerald-400 hover:via-green-400 hover:to-teal-400
                shadow-lg shadow-emerald-500/25
              `}
            >
              <CheckCircle2 size={18} />
              接受
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
