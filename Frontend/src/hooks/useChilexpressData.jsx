import { useState, useEffect } from "react";

export function useChilexpressData() {
  const [regiones, setRegiones] = useState([]);
  const [comunasPorRegion, setComunasPorRegion] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRegiones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
      const response = await fetch(`${apiUrl}/chilexpress/regiones`);
      
      if (!response.ok) {
        throw new Error('Error al cargar regiones');
      }
      
      const data = await response.json();
      console.log('🗺️ Regiones cargadas:', data.data?.length || 0);
      setRegiones(data.data || []);
    } catch (err) {
      console.error('❌ Error al cargar regiones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComunasPorRegion = async (regionCode) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🏙️ Cargando comunas para región: ${regionCode}`);
      
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
      const response = await fetch(`${apiUrl}/chilexpress/areas-cobertura/${regionCode}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar comunas');
      }
      
      const data = await response.json();
      console.log(`📍 Áreas de cobertura encontradas:`, data.data?.length || 0);
      
      const comunasUnicas = data.data.reduce((acc, area) => {
        if (!acc[area.ineCountyCode]) {
          acc[area.ineCountyCode] = {
            code: area.ineCountyCode,
            name: area.countyName,
            regionCode: area.regionCode
          };
        }
        return acc;
      }, {});
      
      const comunasArray = Object.values(comunasUnicas).sort((a, b) => a.name.localeCompare(b.name));
      console.log(`🏘️ Comunas únicas procesadas:`, comunasArray.length);
      
      setComunasPorRegion(prev => ({
        ...prev,
        [regionCode]: comunasArray
      }));
      
    } catch (err) {
      console.error('❌ Error al cargar comunas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegiones();
  }, []);

  return {
    regiones,
    comunasPorRegion,
    loading,
    error,
    fetchComunasPorRegion
  };
}