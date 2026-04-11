import { useEffect, useState } from 'react';
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BanOverlay } from './components/BanOverlay';
import { RateLimitProvider } from '../hooks/useRateLimit';

export default function App() {
  const [showBanOverlay, setShowBanOverlay] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('banned') === '1') {
      setShowBanOverlay(true);
    }
  }, []);

  if (showBanOverlay) {
    return <BanOverlay />;
  }

  return (
    <RateLimitProvider>
      <div className="w-screen h-screen bg-[#F4F5F9] dark:bg-[#0A0C10] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex">
        <RouterProvider router={router} />
      </div>
    </RateLimitProvider>
  );
}
