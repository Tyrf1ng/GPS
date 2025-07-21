import { Preference, Payment } from 'mercadopago';
import mercadoPagoClient from '../config/mercadopago.js';
import { PaymentService } from '../services/payment.service.js';
import { CompraTemporalService } from "../services/compraTemporal.service.js";
import { FRONTEND_URL } from '../config/configENV.js';
import crypto from 'crypto';
import { reservaStockService } from '../services/reservaStockMemoria.service.js';
// ✅ NUEVO: Importar validaciones
import { checkoutFormValidation } from '../validations/form.validation.js';

const preference = new Preference(mercadoPagoClient);
const compraTemporalService = new CompraTemporalService();

export const createPreference = async (req, res) => {
  try {
    const { items, external_reference, shipping_info, datosPersonales, costoEnvio, servicioEnvio } = req.body;

    // ✅ Log detallado para debug
    console.log('🚚 DEBUG shipping_info completo:', JSON.stringify(shipping_info, null, 2));
    console.log('🚚 DEBUG datosPersonales:', JSON.stringify(datosPersonales, null, 2));
    console.log('🚚 DEBUG costoEnvio:', costoEnvio);
    console.log('🚚 DEBUG servicioEnvio:', servicioEnvio);
    
    // ✅ Determinar datos personales (pueden venir en shipping_info o datosPersonales)
    const datosPersonalesReales = datosPersonales || (shipping_info?.nombres ? shipping_info : null);
    
    // ✅ Preparar items incluyendo envío si corresponde
    let finalItems = [...items];
    
    // ✅ Buscar información de envío en múltiples ubicaciones
    const shippingCost = costoEnvio || 
                        shipping_info?.costo || 
                        shipping_info?.cost || 
                        shipping_info?.precio || 
                        shipping_info?.serviceValue ||
                        0;
    
    const shippingDescription = servicioEnvio ||
                               shipping_info?.descripcion || 
                               shipping_info?.description || 
                               shipping_info?.servicio ||
                               shipping_info?.serviceDescription ||
                               'CHILEXPRESS';
    
    if (shippingCost && shippingCost > 0) {
      finalItems.push({
        title: `Envío ${shippingDescription}`,
        unit_price: parseInt(shippingCost),
        quantity: 1,
        currency_id: "CLP",
        category_id: "shipping"
      });
      
      console.log(`📦 Envío agregado: ${shippingDescription} - $${shippingCost}`);
    } else {
      console.log('⚠️ No se encontró información válida de envío para agregar');
      console.log('Valores buscados:', { costoEnvio, shippingCost, shippingDescription });
    }

    console.log('🔍 Datos recibidos en createPreference:', {
      items: items?.length || 0,
      finalItems: finalItems?.length || 0,
      external_reference,
      shippingCost,
      shippingDescription,
      datosPersonalesReales: !!datosPersonalesReales,
      costoTotal: finalItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0)
    });

    // ✅ NUEVO: Validar datos personales si están presentes
    if (datosPersonalesReales) {
      console.log('🔧 Validando datos personales:', datosPersonalesReales);
      
      const { error } = checkoutFormValidation.validate(datosPersonalesReales);
      
      if (error) {
        console.error('❌ Errores de validación:', error.details);
        
        return res.status(400).json({
          status: 'Error',
          message: 'Datos del formulario inválidos',
          errors: error.details.map(detail => ({
            field: detail.context.key,
            message: detail.message,
            value: detail.context.value
          })),
          code: 'VALIDATION_ERROR'
        });
      }
      
      console.log('✅ Datos personales validados correctamente');
    }

    // ✅ NUEVO: Validar items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'Error',
        message: 'Items de compra son requeridos',
        code: 'MISSING_ITEMS'
      });
    }

    // ✅ NUEVO: Validar external_reference
    if (!external_reference) {
      return res.status(400).json({
        status: 'Error',
        message: 'Referencia externa es requerida',
        code: 'MISSING_REFERENCE'
      });
    }

    // ✅ Guardar compra temporal (con datos validados + info de envío)
    const datosCompletos = {
      ...datosPersonalesReales,
      shipping_info: {
        costo: shippingCost,
        descripcion: shippingDescription,
        original: shipping_info // Guardar original para debug
      }
    };
    
    await compraTemporalService.saveCompraTemporal(
      external_reference, 
      finalItems, // ✅ Items finales incluyendo envío
      datosCompletos // ✅ Datos personales + info de envío
    );

    // ✅ NUEVO: Configurar tiempo límite para la preferencia
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15); // 15 minutos

    const body = {
      items: finalItems, // ✅ Usar items finales con envío
      external_reference,
      auto_return: "approved",
      
      // ✅ NUEVO: Configurar expiración
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: expiration.toISOString(),
      
      back_urls: {
        success: `${FRONTEND_URL}/success`,
        failure: `${FRONTEND_URL}/failure`,
        pending: `${FRONTEND_URL}/pending`
      },
      
      // ✅ NUEVO: Agregar metadatos para debugging
      metadata: {
        reserva_id: external_reference,
        fecha_creacion: new Date().toISOString(),
        tiempo_limite_minutos: 15,
        datos_validados: !!datosPersonalesReales,
        costo_envio: shippingCost || 0,
        servicio_envio: shippingDescription
      },

      // ✅ NUEVO: Información del comprador si está disponible
      ...(datosPersonalesReales && {
        payer: {
          name: datosPersonalesReales.nombres || datosPersonalesReales.name,
          surname: datosPersonalesReales.apellidos || datosPersonalesReales.surname,
          email: datosPersonalesReales.email,
          phone: {
            number: (datosPersonalesReales.phone || datosPersonalesReales.telefono || '')?.replace('+56', '') || ''
          },
          address: {
            street_name: datosPersonalesReales.address || '',
            zip_code: datosPersonalesReales.postalCode || ''
          }
        }
      })
    };

    console.log('📨 Creando preferencia con body:', JSON.stringify(body, null, 2));

    const response = await preference.create({ body });
    
    console.log('✅ Preferencia creada exitosamente:', response.id);
    
    res.status(200).json({ 
      id: response.id,
      expiration: expiration.toISOString(),
      timeLimit: 15 // minutos
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    
    // ✅ NUEVO: Manejo de errores más específico
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'Error',
        message: 'Error de validación',
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (error.message.includes('MercadoPago')) {
      return res.status(502).json({
        status: 'Error',
        message: 'Error del servicio de pagos',
        code: 'PAYMENT_SERVICE_ERROR'
      });
    }
    
    res.status(500).json({ 
      status: 'Error',
      message: 'Error interno del servidor',
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers['x-signature'];
    const secret = process.env.MP_WEBHOOK_SECRET?.trim();
    const event = req.webhookBody;
    const isSandbox = event && event.live_mode === false;

    if (!isSandbox) {
      if (!signatureHeader || !secret) {
        console.error('Faltan cabeceras necesarias o secreto');
        return res.status(401).json({ error: 'Firma inválida' });
      }
      const signatureParts = signatureHeader.split(',');
      const tsPart = signatureParts.find(part => part.startsWith('ts='));
      const v1Part = signatureParts.find(part => part.startsWith('v1='));
      if (!tsPart || !v1Part) {
        console.error('Formato de firma inválido:', signatureHeader);
        return res.status(401).json({ error: 'Formato de firma inválido' });
      }
      const timestamp = tsPart.split('=')[1];
      const signature = v1Part.split('=')[1];
      const payload = req.rawBody;
      const signingData = `${payload}:${timestamp}`;
      const generatedSignature = crypto.createHmac('sha256', secret).update(signingData).digest('hex');
      if (signature !== generatedSignature) {
        console.error('Firma inválida recibida:', signature, 'esperada:', generatedSignature);
        return res.status(401).json({ error: 'Firma inválida' });
      }
    } else {
      console.warn('[Sandbox] Ignorando validación de firma de webhook');
    }

    console.log('📨 Webhook recibido:', JSON.stringify(event, null, 2));

    if (event.type === 'payment') {
      const paymentId = event.data.id;
      const payment = new Payment(mercadoPagoClient);

      try {
        const paymentData = await payment.get({ id: paymentId });

        // ✅ NUEVO: Validar tiempo límite de la transacción
        const tiempoLimite = 15; // minutos
        const ahora = new Date();
        const timestampPago = new Date(paymentData.date_created);
        const diferenciaMinutos = (ahora - timestampPago) / (1000 * 60);

        console.log(`⏰ Validando tiempo: ${diferenciaMinutos.toFixed(1)} min vs ${tiempoLimite} min límite`);

        if (diferenciaMinutos > tiempoLimite) {
          console.log(`❌ Pago rechazado por tiempo: ${diferenciaMinutos.toFixed(1)} min > ${tiempoLimite} min`);
          
          // Liberar reserva si existe
          if (paymentData.external_reference) {
            const resultado = await reservaStockService.cancelarReserva(
              paymentData.external_reference, 
              'tiempo_expirado'
            );
            console.log('🔓 Reserva liberada por tiempo expirado:', resultado);
          }
          
          return res.status(400).json({ 
            error: `Transacción expirada. Tiempo límite: ${tiempoLimite} minutos.`,
            code: 'TRANSACTION_EXPIRED'
          });
        }

        const transactionData = {
          payment_id: paymentData.id,
          status: paymentData.status,
          external_reference: paymentData.external_reference,
          amount: paymentData.transaction_amount,
          payment_type: paymentData.payment_type_id,
          merchant_order_id: paymentData.order?.id || 'N/A',
          preference_id: paymentData.preference_id || 'N/A',
          email: paymentData.payer?.email || "",
          date_created: paymentData.date_created,
          processing_time: diferenciaMinutos.toFixed(1) 
        };

        if (transactionData.status === 'approved') {
          console.log('💰 Pago aprobado, confirmando reserva...');
          
          // ✅ NUEVO: Verificar que la reserva siga activa
          const reservaActiva = reservaStockService.verificarReservaActiva(
            transactionData.external_reference
          );
          
          if (!reservaActiva.activa) {
            console.error('❌ Reserva no encontrada o expirada:', transactionData.external_reference, 'Motivo:', reservaActiva.motivo);
            return res.status(400).json({
              error: 'La reserva de stock ha expirado',
              code: 'RESERVATION_EXPIRED',
              motivo: reservaActiva.motivo
            });
          }
          
          const resultado = await reservaStockService.confirmarReserva(transactionData.external_reference);
          
          if (resultado.success) {
            console.log('✅ Stock confirmado para:', transactionData.external_reference);
          } else {
            console.error('❌ Error al confirmar stock:', resultado.error);
            return res.status(500).json({
              error: 'Error al confirmar stock',
              details: resultado.error
            });
          }
          
        } else if (transactionData.status === 'rejected' || transactionData.status === 'cancelled') {
          console.log('❌ Pago rechazado/cancelado, liberando reserva...');
          const resultado = await reservaStockService.cancelarReserva(
            transactionData.external_reference, 
            'pago_' + transactionData.status
          );
          
          if (resultado.success) {
            console.log('🔓 Stock liberado para:', transactionData.external_reference);
          } else {
            console.error('❌ Error al liberar stock:', resultado.error);
          }
        }

        const temporalData = await compraTemporalService.getCompraTemporal(transactionData.external_reference);
        const productos = temporalData ? temporalData.productos : [];
        const datosPersonales = temporalData ? temporalData.datosPersonales : {};

        // ✅ NUEVO: Validar datos personales antes de guardar
        if (datosPersonales && Object.keys(datosPersonales).length > 0) {
          const { error } = checkoutFormValidation.validate(datosPersonales);
          
          if (error) {
            console.warn('⚠️ Datos personales inválidos en webhook, continuando sin validación estricta');
            console.log('Errores encontrados:', error.details.map(d => d.message));
            // No bloquear el proceso, solo log de advertencia
          } else {
            console.log('✅ Datos personales válidos en webhook');
          }
        }

        const paymentService = new PaymentService();
        await paymentService.saveTransaction(transactionData, productos, datosPersonales);

        await compraTemporalService.deleteCompraTemporal(transactionData.external_reference);

        console.log('✅ Webhook procesado exitosamente');

      } catch (error) {
        console.error('❌ Error obteniendo datos de pago:', error);
        return res.status(500).json({
          error: 'Error procesando webhook',
          details: error.message
        });
      }
    }

    res.status(200).send();
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    console.log('=== GET TRANSACTION DEBUG ===');
    console.log('Payment ID recibido:', paymentId);
    console.log('Timestamp:', new Date().toISOString());

    // ✅ NUEVO: Validar formato del payment ID
    if (!paymentId || !/^\d+$/.test(paymentId)) {
      return res.status(400).json({
        error: 'ID de pago inválido',
        code: 'INVALID_PAYMENT_ID',
        payment_id: paymentId
      });
    }

    const paymentService = new PaymentService();
    let transaction = await paymentService.getTransactionByPaymentId(paymentId);

    if (transaction) {
      console.log('✅ Compra encontrada en BD:', transaction);
      return res.status(200).json(transaction);
    }

    console.log('🔍 No encontrado en BD, consultando MercadoPago...');
    const payment = new Payment(mercadoPagoClient);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData) {
      console.log('✅ Pago encontrado en MercadoPago:', paymentData);

      const formattedTransaction = {
        payment_id: paymentData.id,
        external_reference: paymentData.external_reference,
        amount: paymentData.transaction_amount,
        status: paymentData.status,
        payment_type: paymentData.payment_type_id,
        merchant_order_id: paymentData.order?.id || paymentData.merchant_order_id,
        created_at: paymentData.date_created,
        collection_status: paymentData.collection_status,
        processing_mode: paymentData.processing_mode,
        site_id: paymentData.site_id
      };

      console.log('📤 Respuesta formateada:', formattedTransaction);
      return res.status(200).json(formattedTransaction);
    }

    console.log('❌ No se encontró el pago en MercadoPago');
    return res.status(404).json({
      error: 'Compra no encontrada',
      payment_id: paymentId,
      code: 'PAYMENT_NOT_FOUND'
    });

  } catch (error) {
    console.error('❌ Error al obtener compra:', error);
    
    // ✅ NUEVO: Manejo de errores específicos
    if (error.message.includes('Invalid payment_id')) {
      return res.status(400).json({
        error: 'ID de pago inválido',
        message: error.message,
        payment_id: req.params.paymentId,
        code: 'INVALID_PAYMENT_ID'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      payment_id: req.params.paymentId,
      code: 'INTERNAL_ERROR'
    });
  }
};