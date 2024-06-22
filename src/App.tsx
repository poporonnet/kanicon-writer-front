import { RouterProvider } from "react-router-dom";
import { router } from "routes/router";
import "../i18n/i18n";

export const App = () => {
  return <RouterProvider router={router} />;
};
