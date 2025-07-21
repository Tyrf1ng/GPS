"use strict";
import { AppDataSource } from "../config/configDB.js";
import Compra from "../entity/compra.entity.js";
import CompraProducto from "../entity/compra_producto.entity.js";
import Usuario from "../entity/usuario.entity.js";
import Direccion from "../entity/direccion.entity.js";
import Envio from "../entity/envio.entity.js";

export class PaymentService {
  async saveTransaction(transactionData, productos = [], datosPersonales = {}) {
    try {
      const compraRepository = AppDataSource.getRepository(Compra);
      const compraProductoRepository = AppDataSource.getRepository(CompraProducto);
      const usuarioRepository = AppDataSource.getRepository(Usuario);
      const direccionRepository = AppDataSource.getRepository(Direccion);
      const envioRepository = AppDataSource.getRepository(Envio);

      const emailForm = datosPersonales.email || 
                       datosPersonales.mail || 
                       transactionData.email || 
                       `invitado_${Date.now()}@gps-temp.com`;

      let usuarioInvitado = await usuarioRepository.findOne({
        where: { email: emailForm }
      });

      let direccionGuardada = null;
      if (!usuarioInvitado) {
        const direccionCompleta = datosPersonales.address || "Dirección no especificada";
        
        // Intentar parsear dirección completa en calle y número
        const direccionParts = direccionCompleta.split(' ');
        const posibleNumero = direccionParts[direccionParts.length - 1];
        const esNumero = /^\d+$/.test(posibleNumero);
        
        const direccionData = {
          calle: esNumero ? direccionParts.slice(0, -1).join(' ') || "Calle no especificada" : direccionCompleta,
          numero: esNumero ? posibleNumero : "S/N",
          comuna: datosPersonales.ciudad || datosPersonales.comunaCode || "Comuna no especificada",
          region: datosPersonales.region || datosPersonales.regionCode || "Región no especificada",
          codigo_postal: datosPersonales.postalCode || "00000",
          tipo_de_direccion: "predeterminada"
        };
        
        console.log('🏠 Creando dirección:', direccionData);
        direccionGuardada = await direccionRepository.save(direccionData);

        const baseName = (datosPersonales.nombres || datosPersonales.name || "Invitado").replace(/\s+/g, '');
        const invitadoNamePrefix = `${baseName}_invitado_`;

        const existingInvitados = await usuarioRepository
          .createQueryBuilder("usuario")
          .where("usuario.nombreCompleto LIKE :prefix", { prefix: `${invitadoNamePrefix}%` })
          .getCount();

        const nuevoNombre = `${invitadoNamePrefix}${existingInvitados + 1}`;

        usuarioInvitado = usuarioRepository.create({
          nombreCompleto: `${datosPersonales.nombres || datosPersonales.name || 'Invitado'} ${datosPersonales.apellidos || datosPersonales.surname || 'Usuario'}` || nuevoNombre,
          email: emailForm,
          telefono: datosPersonales.phone || datosPersonales.telefono || "",
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
        nombre: datosPersonales.nombres || datosPersonales.name || "No especificado",
        apellido: datosPersonales.apellidos || datosPersonales.surname || "No especificado",
        email: emailForm,
        telefono: datosPersonales.phone || datosPersonales.telefono || "",
        direccion: datosPersonales.address || "Dirección no especificada",
        region: datosPersonales.region || datosPersonales.regionCode || "Región no especificada",
        ciudad: datosPersonales.ciudad || datosPersonales.comunaCode || "Comuna no especificada",
        codigo_postal: datosPersonales.postalCode || "00000",
        instrucciones: datosPersonales.instructions || "",
        email_mp: transactionData.email || ""
      };

      const compra = compraRepository.create(compraData);
      const compraGuardada = await compraRepository.save(compra);

      if (Array.isArray(productos)) {
        for (const prod of productos) {
          if (prod.id_producto) {
            const precio_unitario = prod.unit_price || 
                                   prod.precio || 
                                   prod.price || 
                                   0;
            
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

      // ✅ NUEVO: Crear registro de envío si existe información de shipping
      if (datosPersonales.shipping_info && datosPersonales.shipping_info.costo) {
        const envioData = {
          id_compra: compraGuardada.id_compra,
          estado: 'pendiente'
        };
        
        const envio = envioRepository.create(envioData);
        await envioRepository.save(envio);
        
        console.log(`📦 Envío creado para compra ${compraGuardada.id_compra} - ${datosPersonales.shipping_info.descripcion}`);
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