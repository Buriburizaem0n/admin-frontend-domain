import { createRoot } from "react-dom/client"
import { RouterProvider, createBrowserRouter } from "react-router-dom"


import ErrorPage from "./error-page"
import { AuthProvider } from "./hooks/useAuth"
import { NotificationProvider } from "./hooks/useNotfication"
import { ServerProvider } from "./hooks/useServer"
import "./index.css"
import "./lib/i18n"
import AlertRulePage from "./routes/alert-rule"
import CronPage from "./routes/cron"
import DDNSPage from "./routes/ddns"
import LoginPage from "./routes/login"
import NATPage from "./routes/nat"
import NotificationPage from "./routes/notification"
import NotificationGroupPage from "./routes/notification-group"
import OnlineUserPage from "./routes/online-user"
import ProfilePage from "./routes/profile"
import ProtectedRoute from "./routes/protect"
import Root from "./routes/root"
import ServerPage from "./routes/server"
import ServerGroupPage from "./routes/server-group"
import ServicePage from "./routes/service"
import SettingsPage from "./routes/settings"
import TransferPage from "./routes/transfer"
import UserPage from "./routes/user"
import WAFPage from "./routes/waf"
import DomainPage from "./routes/domain"
import ApiTokensPage from "./routes/api-tokens"

const router = createBrowserRouter([
    {
        path: "/dashboard",
        element: (
            <AuthProvider>
                <ProtectedRoute>
                    <Root />
                </ProtectedRoute>
            </AuthProvider>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/dashboard/login",
                element: <LoginPage />,
            },
            {
                path: "/dashboard",
                element: (
                    <ServerProvider withServerGroup>
                        <ServerPage />
                    </ServerProvider>
                ),
            },
            {
                path: "/dashboard/service",
                element: (
                    <ServerProvider withServer>
                        <NotificationProvider withNotifierGroup>
                            <ServicePage />
                        </NotificationProvider>
                    </ServerProvider>
                ),
            },
            {
                path: "/dashboard/cron",
                element: (
                    <ServerProvider withServer>
                        <NotificationProvider withNotifierGroup>
                            <CronPage />
                        </NotificationProvider>
                    </ServerProvider>
                ),
            },
            {
                path: "/dashboard/notification",
                element: (
                    <NotificationProvider withNotifierGroup>
                        <NotificationPage />
                    </NotificationProvider>
                ),
            },
            {
                path: "/dashboard/alert-rule",
                element: (
                    <NotificationProvider withNotifierGroup>
                        <AlertRulePage />
                    </NotificationProvider>
                ),
            },
            {
                path: "/dashboard/ddns",
                element: <DDNSPage />,
            },
            {
                path: "/dashboard/nat",
                element: <NATPage />,
            },
            {
                path: "/dashboard/server-group",
                element: (
                    <ServerProvider withServer>
                        <ServerGroupPage />
                    </ServerProvider>
                ),
            },
            {
                path: "/dashboard/notification-group",
                element: (
                    <NotificationProvider withNotifier>
                        <NotificationGroupPage />
                    </NotificationProvider>
                ),
            },

            {
                path: "/dashboard/profile",
                element: (
                    <ServerProvider withServer withServerGroup>
                        <ProfilePage />
                    </ServerProvider>
                ),
            },
            {
                path: "/dashboard/settings",
                element: (
                    <NotificationProvider withNotifierGroup>
                        <SettingsPage />
                    </NotificationProvider>
                ),
            },
            {
                path: "/dashboard/settings/user",
                element: <UserPage />,
            },
            {
                path: "/dashboard/settings/waf",
                element: <WAFPage />,
            },
            {
                path: "/dashboard/settings/online-user",
                element: <OnlineUserPage />,
            },
            {
                path: "/dashboard/domain",
                element: <DomainPage />,
            },
            {
                path: "/dashboard/settings/api-tokens",
                element: <ApiTokensPage />,
            },
            {
                path: "/dashboard/transfer",
                element: <TransferPage />,
            },
        ],
    },

])

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />)
