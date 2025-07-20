import { Router } from "express";
import { 
    crearReservaController, 
    getStockDisponibleController, 
    getEstadoReservasController 
} from "../controller/reservaStock.controller.js";

const router = Router();

router.post("/crear", crearReservaController);
router.get("/stock-disponible/:id_producto", getStockDisponibleController);
router.get("/estado", getEstadoReservasController); 

export default router;