"use strict";
import { reservaStockService } from '../services/reservaStockMemoria.service.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../handlers/responseHandlers.js';

export const crearReservaController = async (req, res) => {
    try {
        const { productos, external_reference } = req.body;

        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return handleErrorClient(res, 400, "Se requiere una lista de productos");
        }

        if (!external_reference) {
            return handleErrorClient(res, 400, "Se requiere external_reference");
        }

        const resultado = await reservaStockService.crearReserva(productos, external_reference);

        if (resultado.success) {
            return handleSuccess(res, 201, "Stock reservado exitosamente", {
                external_reference,
                expira_en_minutos: 15,
                expira_timestamp: resultado.expiraEn
            });
        } else {
            return handleErrorClient(res, 400, resultado.error);
        }

    } catch (error) {
        console.error('Error en crearReservaController:', error);
        return handleErrorServer(res, 500, "Error interno al reservar stock");
    }
};

export const getStockDisponibleController = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const stockDisponible = await reservaStockService.getStockDisponible(parseInt(id_producto));

        return handleSuccess(res, 200, "Stock disponible obtenido", {
            id_producto: parseInt(id_producto),
            stock_disponible: stockDisponible
        });

    } catch (error) {
        console.error('Error en getStockDisponibleController:', error);
        return handleErrorServer(res, 500, "Error interno al obtener stock");
    }
};

export const cancelarReservaController = async (req, res) => {
    try {
        const { external_reference } = req.body;

        if (!external_reference) {
            return handleErrorClient(res, 400, "Se requiere external_reference");
        }

        const resultado = await reservaStockService.cancelarReserva(external_reference, 'cancelado_manualmente');

        if (resultado.success) {
            return handleSuccess(res, 200, resultado.message, {
                external_reference,
                estado: 'cancelado'
            });
        } else {
            return handleErrorClient(res, 400, resultado.error);
        }

    } catch (error) {
        console.error('Error en cancelarReservaController:', error);
        return handleErrorServer(res, 500, "Error interno al cancelar reserva");
    }
};

// DEBUG: Endpoint para ver estado de reservas
export const getEstadoReservasController = async (req, res) => {
    try {
        const estado = reservaStockService.getEstadoReservas();
        return handleSuccess(res, 200, "Estado de reservas obtenido", estado);
    } catch (error) {
        return handleErrorServer(res, 500, "Error al obtener estado de reservas");
    }
};