import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { GroupChat } from "./pages/GroupChat";
import { Profile } from "./pages/Profile";
import { EmptyState } from "./pages/EmptyState";

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
    ],
  },
]);
