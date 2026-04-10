import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';

interface BanOverlayProps {
  reason?: string;
  expiresAt?: string;
  isPermanent?: boolean;
}

export function BanOverlay({ reason, expiresAt, isPermanent }: BanOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-gray-900 to-black flex items-center justify-center z-[9999]">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <ShieldX size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">账户已被封禁</h1>
        <div className="bg-white/10 rounded-2xl p-6 mb-6">
          {reason && (
            <div className="mb-4">
              <p className="text-red-300 text-sm mb-1">封禁原因</p>
              <p className="text-white text-lg">{reason}</p>
            </div>
          )}
          {isPermanent ? (
            <div className="text-yellow-400 font-medium">⚠️ 永久封禁</div>
          ) : expiresAt ? (
            <div>
              <p className="text-red-300 text-sm mb-1">解封时间</p>
              <p className="text-white">{new Date(expiresAt).toLocaleString('zh-CN')}</p>
            </div>
          ) : null}
        </div>
        <p className="text-gray-400 text-sm">
          如有异议，请联系管理员
        </p>
      </div>
    </div>
  );
}

export default BanOverlay;