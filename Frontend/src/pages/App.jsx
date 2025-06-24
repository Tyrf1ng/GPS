import './../styles/App.css';
import { Link, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Sling as Hamburger } from 'hamburger-react';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ContactSection from './Contact/contact_us';
import { API_URL } from '../config.js';

// Importa los componentes de las rutas
import Root from "./Root.jsx";
import Homepage from "./Homepage/Homepage.jsx";
import Cart from "./Carrito/shopping_cart.jsx";
import Catalogo from "./Catalogo/Catalogo.jsx";
import Productos from "./ProductosManager/ProductosManager.jsx";
import Login from "./User/login.jsx";
import Register from "./User/register.jsx";
import Logout from "./User/logout.jsx";
import Error404 from "./Error404.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Dashboard from "./Dashboard/dashboard.jsx";
import Producto from "./Catalogo/Producto.jsx";

// Define el router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      { path: "", element: <Homepage /> },
      { path: "cart", element: <Cart /> },
      { path: "catalogo", element: <Catalogo /> },
      { path: "producto/:id_producto", element: <Producto /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "logout", element: <Logout /> },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "productos",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Productos />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);

export default function App() {
  const [isOpen, setOpen] = useState(false);

  // Evitar scroll al abrir el sidebar
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isOpen]);

  // Prueba de conexión al backend
  useEffect(() => {
    fetch(`${API_URL}/test`)
      .then(response => response.json())
      .then(data => console.log('Conexión exitosa:', data))
      .catch(error => console.error('Error de conexión:', error));
  }, []);

  return (
    <>
      {/* Aquí puedes poner Sidebar y demás, si corresponde */}
      <Sidebar isOpen={isOpen} setOpen={setOpen} />
      {/* RouterProvider maneja las rutas */}
      <RouterProvider router={router} />
    </>
  );
}