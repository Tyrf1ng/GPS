import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import axios from "axios";

const SuccessPage = () => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentId = queryParams.get("payment_id");
    const collectionId = queryParams.get("collection_id");
    const status = queryParams.get("status");
    const finalPaymentId = paymentId || collectionId;

    if (status === "approved") {
      clearCart();
    }

    navigate("/");
  }, [location, clearCart, navigate]);

  const handleGoHome = () => {
    navigate("/");
  };

  const formatAmount = (amount) => {
    if (!amount) return "No disponible";
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "No disponible";
    
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(numAmount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      case "pending":
        return "Pendiente";
      default:
        return status || "Desconocido";
    }
  };


  return null;
};

export default SuccessPage;
