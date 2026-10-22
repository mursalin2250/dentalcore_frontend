import "@fontsource-variable/outfit";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IconContext } from "@phosphor-icons/react";
import { routes } from "@/app/routes";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ICON_DEFAULTS } from "@/constants/ui";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IconContext.Provider value={ICON_DEFAULTS}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </IconContext.Provider>
  </StrictMode>,
);
