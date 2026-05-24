import { createBrowserRouter, redirect } from "react-router";
import { Suspense, lazy } from "react";
import { MainLayout } from "./components/MainLayout";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { Profile } from "./pages/Profile";
import { EmptyState } from "./pages/EmptyState";
import { Moments } from "./pages/Moments";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";
import { Games } from "./pages/Games";

const Studio = lazy(() => import("./pages/Studio"));

const LazyStudio = () => (
  <Suspense fallback={<div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-black"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 dark:border-t-white rounded-full animate-spin" /></div>}>
    <Studio />
  </Suspense>
);

function authLoader() {
  const authData = localStorage.getItem('auth-storage');
  if (!authData) {
    return redirect('/login');
  }
  try {
    const parsed = JSON.parse(authData);
    const isAuthenticated = parsed?.state?.isAuthenticated;
    const token = parsed?.state?.token;
    if (!isAuthenticated || !token) {
      return redirect('/login');
    }
  } catch {
    return redirect('/login');
  }
  return null;
}

function loginLoader() {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed?.state?.isAuthenticated && parsed?.state?.token) {
        return redirect('/');
      }
    } catch {
      // 解析失败，继续显示登录页
    }
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
    loader: loginLoader,
  },
  {
    path: "/studio",
    Component: LazyStudio,
  },
  {
    path: "/studio/admin",
    loader: () => redirect("/admin"),
  },
  {
    path: "/studio/admin/login",
    loader: () => redirect("/admin"),
  },
  {
    path: "/studio/admin/dashboard",
    loader: () => redirect("/admin"),
  },
  {
    path: "/",
    Component: MainLayout,
    loader: authLoader,
    children: [
      { index: true, Component: EmptyState },
      { path: "chat/:id", Component: Chat },
      { path: "chat", loader: () => redirect("/") },
      { path: "contacts", Component: EmptyState },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "moments", Component: Moments },
      { path: "games", Component: Games },
      { path: "admin", Component: Admin },
    ],
  },
]);