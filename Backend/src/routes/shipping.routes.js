import { Router } from "express";
import { cotizarEnvioController } from "../controller/shipping.controller.js";

const router = Router();

router.post("/cotizar", cotizarEnvioController);

export default router;