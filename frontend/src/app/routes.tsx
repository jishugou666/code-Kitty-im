import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { GroupChat } from "./pages/GroupChat";
import { Profile } from "./pages/Profile";
import { EmptyState } from "./pages/EmptyState";
import { Moments } from "./pages/Moments";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
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