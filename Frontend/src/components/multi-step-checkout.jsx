"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useCart } from "../context/CartContext";
import { useChilexpressCoverage } from "../hooks/useChilexpressCoverage";
import { useShippingQuote } from "../hooks/useShippingQuote";
import ChilexpressRegionComunaSelector from "../components/ChilexpressRegionComunaSelector";
import WalletComponent from "./WalletComponent";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { ValidatedInput } from "./ValidatedInput.jsx";
import toast, { Toaster } from "react-hot-toast";
import { useShippingAddresses } from '../hooks/useShippingAddresses';
import AddressSelector from './AddressSelector';
import { useAuth } from "../context/AuthContext.jsx";

import {
  Heart,
  Trash2,
  ArrowLeft,
  Check,
  MapPin,
  Package,
  ShoppingCart,
  Minus,
  Plus,
  X,
  Clock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
initMercadoPago(mpPublicKey, { locale: "es-CL" });

const formatPrice = (price) => {
  return new Intl.NumberFormat("es-CL").format(price);
};

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index < currentStep
                ? "bg-amber-500 border-amber-500 text-white"
                : index === currentStep
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-gray-200 border-gray-300 text-gray-500"
            }`}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              index <= currentStep ? "text-amber-600" : "text-gray-500"
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-4 ${
                index < currentStep ? "bg-amber-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const CartItem = ({
  title,
  price,
  quantity,
  image,
  onRemove,
  onAddToFavorites,
  onIncrease,
  onDecrease,
  readonly = false,
}) => {
  const isMinusDisabled = quantity <= 1 || readonly;
  const isPlusDisabled = quantity >= 10 || readonly;

  if (readonly) {
    return (
      <div className="rounded-lg border border-orange-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <img
              className="h-16 w-16 rounded-lg object-cover"
              src={`${API_URL}/uploads/${image}`}
              alt={title}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
            <p className="text-lg font-bold text-orange-600">
              ${formatPrice(price)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Cantidad: {quantity}</span>
            <p className="font-bold text-gray-900">
              ${formatPrice(price * quantity)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-100 rounded-lg">
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={`${API_URL}/uploads/${image}`}
            alt={title}
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">{title}</h4>
            <p className="text-lg font-bold text-amber-600">
              ${formatPrice(price)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-amber-50 rounded-lg p-1">
              <button
                onClick={() => !isMinusDisabled && onDecrease()}
                disabled={isMinusDisabled}
                className={`h-8 w-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded ${
                  isMinusDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  padding: "0px",
                  backgroundColor: "var(--color-amber-300)",
                }}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => !isPlusDisabled && onIncrease()}
                disabled={isPlusDisabled}
                className={`h-8 w-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded ${
                  isPlusDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  padding: "0px",
                  backgroundColor: "var(--color-amber-300)",
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onRemove}
              className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
              style={{
                padding: "0px",
                backgroundColor: "var(--color-amber-300)",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-right">
            <p className="font-semibold text-amber-900">
              ${formatPrice(price * quantity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShippingForm = ({
  shippingData,
  setShippingData,
  cobertura,
  loadingCobertura,
  errorCobertura,
  costoEnvio,
  servicioDescripcion,
  loadingEnvio,
  errorEnvio,
  errors, 
  onInputChange, 
  onInputBlur, 
  formatPhone, 
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Información de Envío
      </h3>

      <ChilexpressRegionComunaSelector
        regionValue={shippingData.regionCode}
        comunaValue={shippingData.comunaCode}
        onChange={({ region, comuna }) => {
          setShippingData((prev) => ({
            ...prev,
            regionCode: region,
            comunaCode: comuna,
          }));
        }}
      />

      {loadingCobertura && (
        <p className="text-amber-700 text-sm">Consultando cobertura...</p>
      )}
      {errorCobertura && (
        <p className="text-red-500 text-sm">{errorCobertura}</p>
      )}
      {cobertura === true && (
        <p className="text-green-600 text-sm">
          ¡Cobertura disponible para la comuna seleccionada!
        </p>
      )}
      {cobertura === false && (
        <p className="text-red-600 text-sm">
          No hay cobertura en la comuna seleccionada.
        </p>
      )}

      <div className="bg-amber-50 p-3 rounded-lg">
        <h4 className="font-semibold text-amber-800 mb-2">Costo de Envío</h4>

        {loadingEnvio && (
          <div className="flex items-center text-amber-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
            Calculando costo de envío...
          </div>
        )}

        {errorEnvio && (
          <div className="text-red-600 text-sm">❌ Error: {errorEnvio}</div>
        )}

        {costoEnvio && !loadingEnvio && !errorEnvio && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-amber-700">Costo estimado:</span>
              <span className="font-bold text-amber-800 text-lg">
                ${formatPrice(costoEnvio)}
              </span>
            </div>
            {servicioDescripcion && (
              <div className="text-sm text-amber-600">
                Servicio: {servicioDescripcion}
              </div>
            )}
            <div className="text-xs text-amber-500 mt-1">
              ⏱️ Tiempo estimado: 3-5 días hábiles
            </div>
          </div>
        )}

        {!costoEnvio && !loadingEnvio && !errorEnvio && cobertura === true && (
          <div className="text-amber-600 text-sm">
            💡 El costo se calculará automáticamente
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          label="Nombres"
          name="nombres"
          value={shippingData.nombres}
          onChange={onInputChange}
          onBlur={onInputBlur}
          error={errors.nombres}
          placeholder="Ej: Juan Carlos"
          required
          maxLength={50}
        />

        <ValidatedInput
          label="Apellidos"
          name="apellidos"
          value={shippingData.apellidos}
          onChange={onInputChange}
          onBlur={onInputBlur}
          error={errors.apellidos}
          placeholder="Ej: Pérez González"
          required
          maxLength={50}
        />

        <ValidatedInput
          label="Email"
          name="email"
          type="email"
          value={shippingData.email}
          onChange={onInputChange}
          onBlur={onInputBlur}
          error={errors.email}
          placeholder="ejemplo@gmail.com"
          required
        />

        <ValidatedInput
          label="Teléfono"
          name="phone"
          value={shippingData.phone}
          onChange={onInputChange}
          onBlur={onInputBlur}
          error={errors.phone}
          placeholder="+569XXXXXXXX"
          required
          autoFormat={true}
          formatFunction={formatPhone}
        />
      </div>

      <ValidatedInput
        label="Dirección"
        name="address"
        value={shippingData.address}
        onChange={onInputChange}
        onBlur={onInputBlur}
        error={errors.address}
        placeholder="Av. Providencia 1234"
        required
        maxLength={255}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValidatedInput
          label="Código Postal"
          name="postalCode"
          value={shippingData.postalCode}
          onChange={onInputChange}
          onBlur={onInputBlur}
          error={errors.postalCode}
          placeholder="7500000"
          maxLength={7}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instrucciones especiales (opcional)
        </label>
        <textarea
          value={shippingData.instructions}
          onChange={(e) => onInputChange("instructions", e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="Ej: Dejar en portería, tocar timbre, etc."
        />
        {errors.instructions && (
          <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 text-right">
          {shippingData.instructions?.length || 0}/500
        </p>
      </div>
    </div>
  );
};

const OrderSummary = ({
  cart,
  shippingData,
  subtotal,
  shipping,
  total,
  loadingEnvio,
  servicioDescripcion,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resumen del Pedido
      </h3>

      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div
            key={item.id_producto}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                {item.cantidad}
              </span>
              <span className="text-sm text-gray-700">{item.nombre}</span>
            </div>
            <span className="font-medium">
              $
              {formatPrice(
                Number(item.precio.toString().replace(/\./g, "")) *
                  item.cantidad
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Envío:</span>
          <span>
            {loadingEnvio
              ? "Calculando..."
              : shipping > 0
              ? `$${formatPrice(shipping)}`
              : "A calcular"}
          </span>
        </div>
        {servicioDescripcion && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Servicio:</span>
            <span>{servicioDescripcion}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span className="text-amber-600">
            {loadingEnvio ? "Calculando..." : `$${formatPrice(total)}`}
          </span>
        </div>
      </div>

      {shippingData.address && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Envío estimado: 3-5 días hábiles
          </p>
          <div className="text-sm text-gray-600">
            <p>
              {shippingData.nombres} {shippingData.apellidos}
            </p>
            <p>{shippingData.address}</p>
            <p>
              {shippingData.comunaCode}, {shippingData.regionCode}
            </p>
            <p>{shippingData.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
};

function MultiStepCheckout() {
  const {
    cart: carrito,
    addItemToCart,
    removeItemFromCart,
    clearCart,
    total: totalCarrito,
    incrementItemQuantity,
    decrementItemQuantity,
  } = useCart();

  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [shippingData, setShippingData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    phone: "",
    address: "",
    regionCode: "",
    comunaCode: "",
    postalCode: "",
    instructions: "",
  });
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [reservaActiva, setReservaActiva] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [externalReferenceActual, setExternalReferenceActual] = useState(null);

  const {
    loading: loadingCobertura,
    error: errorCobertura,
    cobertura,
    checkCobertura,
  } = useChilexpressCoverage();

  const {
    cotizarEnvio,
    resetQuote,
    loading: loadingEnvio,
    error: errorEnvio,
    costoEnvio,
    servicioDescripcion,
  } = useShippingQuote();

  const { errors, validateForm, validateField, formatPhone, clearFieldError } =
    useFormValidation();

  const { authUser, isAuthenticated } = useAuth();

  // Hook de direcciones
  const {
    addresses,
    loading: loadingAddresses,
    selectedAddressId,
    setSelectedAddressId,
    mapAddressToShippingData,
    hasAddresses,
  } = useShippingAddresses();

  // Estado para mostrar formulario
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Función para seleccionar dirección
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id_direccion);
    const mappedData = mapAddressToShippingData(address);
    setShippingData(mappedData);
    setShowAddressForm(false);
  };

  // Consultar cobertura cada vez que cambian región o comuna (y ambos existen)
  useEffect(() => {
    if (shippingData.regionCode && shippingData.comunaCode) {
      const regionNumber = shippingData.regionCode
        .replace("R", "")
        .replace("M", "13");
      checkCobertura(regionNumber, shippingData.comunaCode);
    }
  }, [shippingData.regionCode, shippingData.comunaCode]);

  useEffect(() => {
    if (
      shippingData.regionCode &&
      shippingData.comunaCode &&
      cobertura === true &&
      carrito.length > 0
    ) {
      cotizarEnvio(carrito, shippingData.comunaCode);
    } else {
      resetQuote();
    }
  }, [
    shippingData.regionCode,
    shippingData.comunaCode,
    cobertura,
    carrito,
    cotizarEnvio,
    resetQuote,
  ]);

  useEffect(() => {
    let interval;

    if (reservaActiva && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            setReservaActiva(false);
            setError(
              "⏰ La reserva de stock ha expirado. Por favor, intenta nuevamente."
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reservaActiva, tiempoRestante]);

  const formatTiempoRestante = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, "0")}`;
  };

  const steps = [
    { label: "Carrito", icon: <Package className="w-5 h-5" /> },
    { label: "Información de Envío", icon: <MapPin className="w-5 h-5" /> },
    { label: "Confirmación", icon: <Check className="w-5 h-5" /> },
  ];

  const subtotal = carrito.reduce(
    (total, item) =>
      total +
      Number(item.precio.toString().replace(/\./g, "")) * (item.cantidad || 1),
    0
  );

  const shipping = costoEnvio || 0;
  const total = subtotal + shipping;

  const handleAddToFavorites = (itemId) => {
    console.log("Adding to favorites:", itemId);
  };

  const validateShippingData = () => {
    // Si está autenticado y tiene dirección seleccionada, es válido
    if (isAuthenticated && selectedAddressId) {
      return true;
    }
    
    // Si no está autenticado o no tiene dirección seleccionada, validar form normal
    const required = [
      "nombres", "apellidos", "email", "phone", 
      "address", "regionCode", "comunaCode"
    ];
    return required.every(
      (field) => shippingData[field] && shippingData[field].trim() !== ""
    );
  };

  const handleInputChange = (fieldName, value) => {
    setShippingData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      clearFieldError(fieldName);
    }
  };

  const handleInputBlur = (fieldName, value) => {
    validateField(fieldName, value);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validar si está usando dirección guardada
      if (isAuthenticated && selectedAddressId && !showAddressForm) {
        // Usuario autenticado con dirección seleccionada - validar solo cobertura
        if (cobertura !== true) {
          toast.error("Selecciona una comuna con cobertura disponible");
          return;
        }
      } else {
        // Validar formulario completo
        const validation = validateForm(shippingData);

        if (!validation.isValid) {
          toast.error("Por favor, corrige los errores antes de continuar");

          Object.entries(validation.errors).forEach(([field, message]) => {
            if (message) {
              toast.error(`${field}: ${message}`, { duration: 4000 });
            }
          });

          return;
        }

        if (cobertura !== true) {
          toast.error("Selecciona una comuna con cobertura disponible");
          return;
        }
      }
    }

    setCurrentStep((prev) => prev + 1);
    toast.success("¡Información validada correctamente!");
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const externalReference = `ORD-${Date.now()}`;
      setExternalReferenceActual(externalReference);

      const productos = carrito.map((item) => ({
        id_producto: item.id_producto,
        quantity: item.cantidad || 1,
      }));

      console.log("🔒 Creando reserva de stock...");
      const reservaResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/reserva-stock/crear`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productos,
            external_reference: externalReference,
          }),
        }
      );

      if (!reservaResponse.ok) {
        const errorData = await reservaResponse.json();
        throw new Error(errorData.message || "Error al reservar stock");
      }

      const reservaData = await reservaResponse.json();
      console.log("✅ Stock reservado exitosamente:", reservaData);

      setReservaActiva(true);
      setTiempoRestante(15 * 60);

      const items = carrito.map((item) => ({
        id_producto: item.id_producto,
        title: item.nombre,
        unit_price: Number(item.precio.toString().replace(/\./g, "")),
        quantity: item.cantidad || 1,
      }));

      console.log("💳 Creando preferencia de pago...");
      console.log("📦 Datos de envío que se enviarán:", {
        costoEnvio: costoEnvio || 0,
        servicioDescripcion: servicioDescripcion || 'CHILEXPRESS',
        shippingData
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/create_preference`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            external_reference: externalReference,
            shipping_info: shippingData,
            costoEnvio: costoEnvio || 0,
            servicioEnvio: servicioDescripcion || 'CHILEXPRESS'
          }),
        }
      );

      if (!response.ok) {
        console.warn("❌ Error al crear preferencia, cancelando reserva...");
        await fetch(`${import.meta.env.VITE_API_URL}/reserva-stock/cancelar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_reference: externalReference,
          }),
        }).catch((err) => console.error("Error al cancelar reserva:", err));

        setReservaActiva(false);
        setTiempoRestante(null);
        throw new Error("Error al crear preferencia de pago");
      }

      const data = await response.json();
      setPreferenceId(data.preferenceId || data.id);

      console.log("🚀 Preferencia creada, redirigiendo a MercadoPago...");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Error al procesar el pago. Intenta nuevamente.");
      setReservaActiva(false);
      setTiempoRestante(null);
      setExternalReferenceActual(null);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">
              Tu Carrito de Compras
            </h3>

            {carrito.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-600 mb-4">
                  Agrega algunos productos para continuar
                </p>
                <Link
                  to="/"
                  className="inline-flex px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  style={{ color: "white" }}
                >
                  Continuar Comprando
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map((item) => (
                  <CartItem
                    key={item.id_producto}
                    title={item.nombre}
                    price={Number(item.precio.toString().replace(/\./g, ""))}
                    quantity={item.cantidad || 1}
                    image={item.imagen}
                    onRemove={() => removeItemFromCart(item)}
                    onAddToFavorites={() =>
                      handleAddToFavorites(item.id_producto)
                    }
                    onIncrease={() => incrementItemQuantity(item.id_producto)}
                    onDecrease={() => decrementItemQuantity(item.id_producto)}
                  />
                ))}

                <div className="bg-amber-50 border-amber-200 border rounded-lg">
                  <div className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Subtotal (
                          {carrito.reduce(
                            (sum, item) => sum + (item.cantidad || 1),
                            0
                          )}{" "}
                          productos):
                        </span>
                        <span>${formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Envío estimado:</span>
                        <span>${formatPrice(shipping)}</span>
                      </div>
                      <div className="border-t border-amber-200 pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total estimado:</span>
                          <span className="text-amber-600">
                            ${formatPrice(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        // LÓGICA CONDICIONAL INTEGRADA
        if (!isAuthenticated) {
          // Usuario no logueado -> formulario normal con validación
          return (
            <ShippingForm
              shippingData={shippingData}
              setShippingData={setShippingData}
              cobertura={cobertura}
              loadingCobertura={loadingCobertura}
              errorCobertura={errorCobertura}
              costoEnvio={costoEnvio}
              servicioDescripcion={servicioDescripcion}
              loadingEnvio={loadingEnvio}
              errorEnvio={errorEnvio}
              errors={errors} 
              onInputChange={handleInputChange} 
              onInputBlur={handleInputBlur} 
              formatPhone={formatPhone} 
            />
          );
        }

        if (isAuthenticated && !hasAddresses) {
          // Usuario logueado sin direcciones -> formulario normal con validación
          return (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  No tienes direcciones guardadas. Completa el formulario para agregar una nueva.
                </p>
              </div>
              <ShippingForm
                shippingData={shippingData}
                setShippingData={setShippingData}
                cobertura={cobertura}
                loadingCobertura={loadingCobertura}
                errorCobertura={errorCobertura}
                costoEnvio={costoEnvio}
                servicioDescripcion={servicioDescripcion}
                loadingEnvio={loadingEnvio}
                errorEnvio={errorEnvio}
                errors={errors} 
                onInputChange={handleInputChange} 
                onInputBlur={handleInputBlur} 
                formatPhone={formatPhone} 
              />
            </div>
          );
        }

        if (isAuthenticated && hasAddresses && !showAddressForm) {
          // Usuario logueado con direcciones -> selector
          return (
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={handleSelectAddress}
              onShowForm={() => setShowAddressForm(true)}
              loading={loadingAddresses}
            />
          );
        }

        if (showAddressForm) {
          // Mostrar formulario para nueva dirección con validación
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nueva dirección de envío
                </h3>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  ← Volver a direcciones guardadas
                </button>
              </div>
              <ShippingForm
                shippingData={shippingData}
                setShippingData={setShippingData}
                cobertura={cobertura}
                loadingCobertura={loadingCobertura}
                errorCobertura={errorCobertura}
                costoEnvio={costoEnvio}
                servicioDescripcion={servicioDescripcion}
                loadingEnvio={loadingEnvio}
                errorEnvio={errorEnvio}
                errors={errors} 
                onInputChange={handleInputChange} 
                onInputBlur={handleInputBlur} 
                formatPhone={formatPhone} 
              />
            </div>
          );
        }

        break;

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirma tu Pedido
            </h3>

            {reservaActiva && tiempoRestante && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-800 font-medium">
                      🔒 Stock reservado temporalmente
                    </p>
                    <p className="text-amber-600 text-sm">
                      Tiempo restante:{" "}
                      <span className="font-mono font-bold">
                        {formatTiempoRestante(tiempoRestante)}
                      </span>
                    </p>
                    <p className="text-amber-500 text-xs mt-1">
                      Complete el pago antes de que expire la reserva
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Productos:</h4>
              {carrito.map((item) => (
                <CartItem
                  key={item.id_producto}
                  title={item.nombre}
                  price={Number(item.precio.toString().replace(/\./g, ""))}
                  quantity={item.cantidad || 1}
                  image={item.imagen}
                  readonly={true}
                />
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Información de Envío:
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Nombre:</strong> {shippingData.nombres}{" "}
                  {shippingData.apellidos}
                </p>
                <p>
                  <strong>Email:</strong> {shippingData.email}
                </p>
                <p>
                  <strong>Teléfono:</strong> {shippingData.phone}
                </p>
                <p>
                  <strong>Dirección:</strong> {shippingData.address}
                </p>
                <p>
                  <strong>Región:</strong> {shippingData.regionCode}
                </p>
                <p>
                  <strong>Comuna:</strong> {shippingData.comunaCode}
                </p>
                {shippingData.postalCode && (
                  <p>
                    <strong>Código Postal:</strong> {shippingData.postalCode}
                  </p>
                )}
                {shippingData.instructions && (
                  <p>
                    <strong>Instrucciones:</strong> {shippingData.instructions}
                  </p>
                )}
              </div>
            </div>

            {walletComponent && <div className="mt-6">{walletComponent}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  const handleHeaderBack = () => {
    if (currentStep === 0) {
      navigate("/");
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const walletComponent = useMemo(() => {
    if (!preferenceId) return null;

    return (
      <WalletComponent
        preferenceId={preferenceId}
        onReady={() => {}}
        onError={(error) => {
          setError("Error al cargar el botón de pago.");
        }}
      />
    );
  }, [preferenceId]);

  return (
    <section className="min-h-screen min-w-screen bg-white py-8 md:py-16">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #F59E0B",
          },
          success: {
            style: {
              background: "#D1FAE5",
              color: "#065F46",
              border: "1px solid #10B981",
            },
          },
          error: {
            style: {
              background: "#FEE2E2",
              color: "#991B1B",
              border: "1px solid #EF4444",
            },
          },
        }}
      />

      <div className="mx-auto max-w-7xl px-4">
        <div className="relative mb-8">
          <button
            type="button"
            onClick={handleHeaderBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-amber-600 hover:text-amber-700"
            style={{ backgroundColor: "white" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <h1 className="text-center text-2xl font-bold text-amber-800">
            Finalizar Compra
          </h1>
          <p className="text-center text-sm text-amber-600 mt-1">
            Complete la información para procesar su pedido
          </p>
        </div>

        <StepIndicator currentStep={currentStep} steps={steps} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderStepContent()}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {carrito.length > 0 && (
                <div className="flex justify-between pt-4 mt-8 border-t">
                  <Link
                    to="/"
                    className="px-6 py-2 rounded-lg border border-amber-600 text-amber-600 hover:bg-amber-50 bg-transparent transition-colors"
                  >
                    Continuar Comprando
                  </Link>

                  {currentStep < 2 ? (
                    <button
                      onClick={handleNextStep}
                      disabled={
                        (currentStep === 0 && carrito.length === 0) ||
                        (currentStep === 1 && cobertura === false)
                      }
                      className={`px-8 py-2 rounded-lg text-white transition-colors ${
                        currentStep === 0 && carrito.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : currentStep === 1 && cobertura === false
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                      style={{ backgroundColor: "var(--color-amber-500)" }}
                    >
                      {currentStep === 0
                        ? "Continuar al Envío"
                        : "Continuar a Confirmación"}
                    </button>
                  ) : (
                    !preferenceId && (
                      <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className={`px-8 py-2 rounded-lg text-white transition-colors ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {loading ? "Procesando..." : "Proceder al Pago"}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              cart={carrito}
              shippingData={shippingData}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              loadingEnvio={loadingEnvio}
              servicioDescripcion={servicioDescripcion}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MultiStepCheckout;