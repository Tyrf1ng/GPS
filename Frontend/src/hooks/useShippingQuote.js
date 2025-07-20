import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";

export function useShippingQuote() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [costoEnvio, setCostoEnvio] = useState(null);
    const [servicioDescripcion, setServicioDescripcion] = useState(null);

    const cotizarEnvio = useCallback(async (productos, destinationCountyCode) => {
        if (!productos || productos.length === 0 || !destinationCountyCode) {
            setError("Faltan datos para cotizar envío");
            return null;
        }

        setLoading(true);
        setError(null);
        setCostoEnvio(null);
        setServicioDescripcion(null);

        try {
            
            const response = await fetch(`${API_URL}/shipping/cotizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productos,
                    destinationCountyCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }

            if (data.status === 'Success' && data.data) {
                setCostoEnvio(data.data.costoEnvio);
                setServicioDescripcion(data.data.servicioDescripcion);
                return data.data.costoEnvio;
            } else {
                throw new Error(data.message || 'Error al cotizar envío');
            }

        } catch (err) {
            console.error('Error cotizando envío:', err);
            setError(err.message);
            setCostoEnvio(null);
            setServicioDescripcion(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetQuote = useCallback(() => {
        setCostoEnvio(null);
        setServicioDescripcion(null);
        setError(null);
    }, []);

    return {
        cotizarEnvio,
        resetQuote,
        loading,
        error,
        costoEnvio,
        servicioDescripcion
    };
}