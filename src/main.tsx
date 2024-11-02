import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import './index.css'

import Root from "./routes/root";
import ErrorPage from "./error-page";
import ProtectedRoute from './routes/protect';
import LoginPage from './routes/login';
import { AuthProvider } from './hooks/useAuth';

const router = createBrowserRouter([
  {
    path: "/dashboard/",
    element: <AuthProvider><ProtectedRoute><Root /></ProtectedRoute></AuthProvider>,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/dashboard/login",
        element: <LoginPage />,
      },
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
