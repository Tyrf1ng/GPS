"use strict";
import { updateProductoService } from './productos.service.js';

class ReservaStockMemoria {
    constructor() {
        this.reservas = new Map(); 
        this.timers = new Map();   
        
        setInterval(() => this.limpiarExpiradas(), 5 * 60 * 1000);
    }

    async crearReserva(productos, externalReference) {
        try {
            for (const item of productos) {
                const stockDisponible = await this.getStockDisponible(item.id_producto);
                
                if (stockDisponible < item.quantity) {
                    throw new Error(`Stock insuficiente para producto ${item.id_producto}. Disponible: ${stockDisponible}, Solicitado: ${item.quantity}`);
                }
            }

            const expiraEn = Date.now() + (15 * 60 * 1000); 
            
            this.reservas.set(externalReference, {
                productos,
                expiraEn,
                estado: 'pendiente'
            });

            const timerId = setTimeout(() => {
                this.cancelarReserva(externalReference, 'expirado');
            }, 15 * 60 * 1000);

            this.timers.set(externalReference, timerId);

            console.log(`✅ Reserva creada: ${productos.length} productos hasta ${new Date(expiraEn).toISOString()}`);
            
            return { success: true, expiraEn };

        } catch (error) {
            console.error('Error al crear reserva:', error);
            return { success: false, error: error.message };
        }
    }

    async confirmarReserva(externalReference) {
        try {
            const reserva = this.reservas.get(externalReference);
            
            if (!reserva) {
                throw new Error(`Reserva no encontrada: ${externalReference}`);
            }

            if (reserva.estado !== 'pendiente') {
                throw new Error(`Reserva ya procesada: ${reserva.estado}`);
            }

            for (const item of reserva.productos) {
                const resultado = await updateProductoService(item.id_producto, {
                    stock: await this.getStockRealProducto(item.id_producto) - item.quantity
                });

                if (!resultado.success) {
                    throw new Error(`Error al actualizar stock del producto ${item.id_producto}`);
                }

                console.log(`✅ Stock confirmado: -${item.quantity} unidades del producto ${item.id_producto}`);
            }

            reserva.estado = 'confirmado';
            this.limpiarReserva(externalReference);

            return { success: true, message: 'Stock confirmado exitosamente' };

        } catch (error) {
            console.error('Error al confirmar reserva:', error);
            return { success: false, error: error.message };
        }
    }

    async cancelarReserva(externalReference, motivo = 'cancelado') {
        try {
            const reserva = this.reservas.get(externalReference);
            
            if (!reserva) {
                console.log(`ℹ️ Reserva no encontrada para cancelar: ${externalReference}`);
                return { success: true, message: 'Reserva no encontrada' };
            }

            if (reserva.estado !== 'pendiente') {
                console.log(`ℹ️ Reserva ya procesada: ${reserva.estado}`);
                return { success: true, message: 'Reserva ya procesada' };
            }

            reserva.estado = motivo;
            this.limpiarReserva(externalReference);

            console.log(`❌ Reserva ${motivo}: ${reserva.productos.length} productos liberados`);

            return { success: true, message: `Reserva ${motivo} exitosamente` };

        } catch (error) {
            console.error(`Error al ${motivo} reserva:`, error);
            return { success: false, error: error.message };
        }
    }

    async getStockDisponible(idProducto) {
        try {
            const stockReal = await this.getStockRealProducto(idProducto);
            const stockReservado = this.getStockReservado(idProducto);
            
            return Math.max(0, stockReal - stockReservado);
        } catch (error) {
            console.error('Error al obtener stock disponible:', error);
            return 0;
        }
    }

    async getStockRealProducto(idProducto) {
        try {
            const { AppDataSource } = await import('../config/configDB.js');
            const { default: Productos } = await import('../entity/productos.entity.js');
            
            const productoRepository = AppDataSource.getRepository(Productos);
            const producto = await productoRepository.findOne({
                where: { id_producto: idProducto }
            });

            return producto ? producto.stock : 0;
        } catch (error) {
            console.error('Error al obtener stock real:', error);
            return 0;
        }
    }

    getStockReservado(idProducto) {
        let totalReservado = 0;
        const ahora = Date.now();

        for (const [ref, reserva] of this.reservas) {
            if (reserva.estado === 'pendiente' && reserva.expiraEn > ahora) {
                const item = reserva.productos.find(p => p.id_producto === idProducto);
                if (item) {
                    totalReservado += item.quantity;
                }
            }
        }

        return totalReservado;
    }

    limpiarReserva(externalReference) {
        this.reservas.delete(externalReference);
        
        const timerId = this.timers.get(externalReference);
        if (timerId) {
            clearTimeout(timerId);
            this.timers.delete(externalReference);
        }
    }

    limpiarExpiradas() {
        const ahora = Date.now();
        let limpiadas = 0;

        for (const [ref, reserva] of this.reservas) {
            if (reserva.expiraEn <= ahora && reserva.estado === 'pendiente') {
                this.cancelarReserva(ref, 'expirado');
                limpiadas++;
            }
        }

        if (limpiadas > 0) {
            console.log(`🧹 Limpieza automática: ${limpiadas} reservas expiradas`);
        }
    }

    // Debug: Obtener estado de todas las reservas
    getEstadoReservas() {
        const ahora = Date.now();
        const estado = {
            total: this.reservas.size,
            pendientes: 0,
            expiradas: 0,
            detalles: []
        };

        for (const [ref, reserva] of this.reservas) {
            if (reserva.estado === 'pendiente') {
                if (reserva.expiraEn > ahora) {
                    estado.pendientes++;
                } else {
                    estado.expiradas++;
                }
            }

            estado.detalles.push({
                external_reference: ref,
                estado: reserva.estado,
                productos: reserva.productos.length,
                expira_en: new Date(reserva.expiraEn).toISOString(),
                tiempo_restante_min: Math.max(0, Math.floor((reserva.expiraEn - ahora) / 60000))
            });
        }

        return estado;
    }
}

const reservaStockService = new ReservaStockMemoria();
export { reservaStockService };