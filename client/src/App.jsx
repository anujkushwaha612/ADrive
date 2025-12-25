import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView";
import Register from "./Register";
import Login from "./Login";
import UnauthorizedPage from "./UnauthorizedPage";
import AllUsers from "./admin/AllUsers";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DirectoryView />,
  },
  {
    path: "/directory/:dirId",
    element: <DirectoryView />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin/users",
    element: <AllUsers />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
