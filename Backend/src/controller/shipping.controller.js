"use strict";
import { calcularCostoEnvio } from "../services/shipping.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

export async function cotizarEnvioController(req, res) {
    try {
        const { productos, destinationCountyCode } = req.body;

        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return handleErrorClient(res, 400, "Productos son requeridos");
        }

        if (!destinationCountyCode) {
            return handleErrorClient(res, 400, "Código de comuna de destino es requerido");
        }

        const resultado = await calcularCostoEnvio(productos, destinationCountyCode);

        if (!resultado.success) {
            return handleErrorClient(res, 400, resultado.error);
        }

        return handleSuccess(res, 200, "Costo de envío calculado exitosamente", {
            costoEnvio: resultado.costoEnvio,
            servicioDescripcion: resultado.servicioDescripcion,
            pesoFinal: resultado.pesoFinal,
            usoPesoVolumetrico: resultado.usoPesoVolumetrico
        });

    } catch (error) {
        console.error("Error en cotizarEnvioController:", error);
        return handleErrorServer(res, 500, "Error interno del servidor al cotizar envío");
    }
}