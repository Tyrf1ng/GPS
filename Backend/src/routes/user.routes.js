"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { getAllUsers, getUserProfile, registerDireccion, getDireccionByUserId, deleteDireccionByUserId, getUserProfileDetailed, updateUserProfile } from "../controller/user.controller.js";
import { getComprasUsuarioController, getAllComprasController, verificarCompraProductoController, getProductosCompradosConValoracionController } from "../controller/compras.controller.js";
import { authenticateToken } from "../middlewares/authentication.middleware.js";

// Router para rutas de usuario autenticado (no requiere permisos de admin)
const userRouter = Router();
userRouter.use(authenticateToken); // Middleware de autenticación

userRouter
    .get("/profile", getUserProfile)
    .get("/profile/detailed", getUserProfileDetailed)
    .put("/profile", updateUserProfile)
    .post("/direccion", registerDireccion)
    .get("/direcciones", getDireccionByUserId)
    .delete("/direccion/:id", deleteDireccionByUserId)
    .get("/compras", getComprasUsuarioController)
    .get("/compras/producto/:id_producto", verificarCompraProductoController)
    .get("/productos-comprados", getProductosCompradosConValoracionController); // Lista todos los pedidos del usuario

// Router para rutas de administración (requiere permisos de admin)
const adminRouter = Router();
adminRouter.use(authenticateToken); // Middleware de autenticación
adminRouter.use(isAdmin); // Middleware de autorización

adminRouter
    .get("/", getAllUsers)
    .get("/compras", getAllComprasController); // Nueva ruta para obtener todas las compras

// Exportar ambos routers
export { userRouter };
export default adminRouter;