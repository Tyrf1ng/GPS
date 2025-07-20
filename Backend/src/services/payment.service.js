"use strict";
import { AppDataSource } from "../config/configDB.js";
import Compra from "../entity/compra.entity.js";
import CompraProducto from "../entity/compra_producto.entity.js";
import Usuario from "../entity/usuario.entity.js";
import Direccion from "../entity/direccion.entity.js";

export class PaymentService {
  async saveTransaction(transactionData, productos = [], datosPersonales = {}) {
    try {
      const compraRepository = AppDataSource.getRepository(Compra);
      const compraProductoRepository = AppDataSource.getRepository(CompraProducto);
      const usuarioRepository = AppDataSource.getRepository(Usuario);
      const direccionRepository = AppDataSource.getRepository(Direccion);

      const emailForm = datosPersonales.email || "";

      let usuarioInvitado = await usuarioRepository.findOne({
        where: { email: emailForm }
      });

      let direccionGuardada = null;
      if (!usuarioInvitado) {
        const direccionData = {
          direccion: datosPersonales.address || "",
          ciudad: datosPersonales.ciudad || datosPersonales.comunaCode || "No especificada",
          region: datosPersonales.region || datosPersonales.regionCode || "No especificada",
          codigo_postal: datosPersonales.postalCode || "00000",
          pais: "Chile",
          tipo_de_direccion: "predeterminada"
        };
        direccionGuardada = await direccionRepository.save(direccionData);

        const baseName = (datosPersonales.nombres || "Invitado").replace(/\s+/g, '');
        const invitadoNamePrefix = `${baseName}_invitado_`;

        const existingInvitados = await usuarioRepository
          .createQueryBuilder("usuario")
          .where("usuario.nombreCompleto LIKE :prefix", { prefix: `${invitadoNamePrefix}%` })
          .getCount();

        const nuevoNombre = `${invitadoNamePrefix}${existingInvitados + 1}`;

        usuarioInvitado = usuarioRepository.create({
          nombreCompleto: `${datosPersonales.nombres} ${datosPersonales.apellidos}` || nuevoNombre,
          email: emailForm,
          telefono: datosPersonales.phone || "",
          password: "null",
          rol: "invitado",
          id_direccion: direccionGuardada.id_direccion
        });
        usuarioInvitado = await usuarioRepository.save(usuarioInvitado);
      }

      const idUsuario = usuarioInvitado.id_usuario;

      const compraData = {
        payment_id: transactionData.payment_id,
        payment_status: transactionData.status,
        external_reference: transactionData.external_reference,
        payment_amount: transactionData.amount,
        payment_type: transactionData.payment_type,
        merchant_order_id: transactionData.merchant_order_id,
        preference_id: transactionData.preference_id,
        id_usuario: idUsuario,
        nombre: datosPersonales.nombres || "",
        apellido: datosPersonales.apellidos || "",
        email: emailForm,
        telefono: datosPersonales.phone || "",
        direccion: datosPersonales.address || "",
        region: datosPersonales.region || datosPersonales.regionCode || "",
        ciudad: datosPersonales.ciudad || datosPersonales.comunaCode || "",
        codigo_postal: datosPersonales.postalCode || "",
        instrucciones: datosPersonales.instructions || "",
        email_mp: transactionData.email || ""
      };

      const compra = compraRepository.create(compraData);
      const compraGuardada = await compraRepository.save(compra);

      if (Array.isArray(productos)) {
        console.log('=== DEBUG PRODUCTOS EN PAYMENT SERVICE ===');
        console.log('Productos recibidos:', JSON.stringify(productos, null, 2));
        
        for (const prod of productos) {
          console.log('Procesando producto:', {
            id_producto: prod.id_producto,
            cantidad: prod.cantidad || prod.quantity || 1,
            precio: prod.precio,
            price: prod.price,
            unit_price: prod.unit_price, 
            estructura_completa: Object.keys(prod)
          });
          
          if (prod.id_producto) {
            const precio_unitario = prod.unit_price || 
                                   prod.precio || 
                                   prod.price || 
                                   0;
            
            if (precio_unitario === 0) {
              console.warn(`⚠️ PRECIO CERO para producto ${prod.id_producto}:`, prod);
            } else {
              console.log(`✅ Precio encontrado para producto ${prod.id_producto}: $${precio_unitario}`);
            }
            
            const compraProd = compraProductoRepository.create({
              id_compra: compraGuardada.id_compra,
              id_producto: prod.id_producto,
              cantidad: prod.cantidad || prod.quantity || 1,
              precio_unitario: precio_unitario
            });
            await compraProductoRepository.save(compraProd);
          }
        }
      }

      return compraGuardada;
    } catch (error) {
      if (error.code === '23505' || error.message.includes('duplicate key value')) {
        console.warn(`Compra duplicada: ${transactionData.payment_id}`);
        return { id: 'duplicated', payment_id: transactionData.payment_id };
      }
      console.error('Error al guardar compra:', error);
      throw error;
    }
  }

  async getTransactionByPaymentId(paymentId) {
    try {
      const compraRepository = AppDataSource.getRepository(Compra);
      return await compraRepository.findOne({
        where: { payment_id: paymentId }
      });
    } catch (error) {
      console.error('Error al obtener compra por paymentId:', error);
      throw error;
    }
  }
}