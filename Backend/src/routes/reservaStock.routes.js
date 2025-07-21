import { Router } from "express";
import { 
    crearReservaController, 
    cancelarReservaController,
    getStockDisponibleController, 
    getEstadoReservasController 
} from "../controller/reservaStock.controller.js";

const router = Router();

router.post("/crear", crearReservaController);
router.post("/cancelar", cancelarReservaController);
router.get("/stock-disponible/:id_producto", getStockDisponibleController);
router.get("/estado", getEstadoReservasController); 

export default router;