import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div className="w-screen h-screen bg-[#F4F5F9] dark:bg-[#0A0C10] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex">
      <RouterProvider router={router} />
    </div>
  );
}
