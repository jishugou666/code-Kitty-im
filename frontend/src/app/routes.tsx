import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from "react";
import { MainLayout } from "./components/MainLayout";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { GroupChat } from "./pages/GroupChat";
import { Profile } from "./pages/Profile";
import { EmptyState } from "./pages/EmptyState";
import { Moments } from "./pages/Moments";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";

const Studio = lazy(() => import("./pages/Studio"));

const LazyStudio = () => (
  <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-black"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 dark:border-t-white rounded-full animate-spin" /></div>}>
    <Studio />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/studio",
    Component: LazyStudio,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: EmptyState },
      { path: "chat/:id", Component: Chat },
      { path: "group/:id", Component: GroupChat },
      { path: "contacts", Component: EmptyState },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "moments", Component: Moments },
      { path: "admin", Component: Admin },
    ],
  },
]);