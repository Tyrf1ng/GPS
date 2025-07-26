import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllCompras } from '../../services/valoraciones.service';
import { procesarEnvio, getEnvioPorCompra, reimprimirEtiqueta } from '../../services/envios.service';
import { FaShoppingBag, FaCalendar, FaDollarSign, FaUser, FaBox, FaTruck, FaSearch, FaFilter, FaDownload, FaSortUp, FaSortDown, FaSort, FaChevronLeft, FaChevronRight, FaShippingFast, FaPrint, FaEye, FaBarcode } from 'react-icons/fa';

const GestionCompras = () => {
  const { authUser } = useAuth();
  const [compras, setCompras] = useState([]);
  const [comprasFilteredData, setComprasFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  const [sortOrder, setSortOrder] = useState('newest'); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const [enviosData, setEnviosData] = useState({});
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [processingShipment, setProcessingShipment] = useState(null);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showEnvioModal, setShowEnvioModal] = useState(false);

  const isAdmin = authUser?.rol === 'admin' || authUser?.rol === 'administrador';

  useEffect(() => {
    const cargarCompras = async () => {
      if (!authUser || !isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getAllCompras();
        if (error) {
          setError(error);
        } else {
          const comprasData = data.data || [];
          setCompras(comprasData);
          setComprasFilteredData(comprasData);
        }
      } catch (error) {
        setError('Error al cargar las compras');
        console.error('Error al cargar compras:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarCompras();
  }, [authUser, isAdmin]);

  useEffect(() => {
    let comprasFiltradas = [...compras];

    if (searchTerm) {
      comprasFiltradas = comprasFiltradas.filter(compra => 
        compra.id_compra.toString().includes(searchTerm) ||
        compra.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'todos') {
      comprasFiltradas = comprasFiltradas.filter(compra => 
        compra.payment_status === statusFilter
      );
    }

    comprasFiltradas.sort((a, b) => {
      const fechaA = new Date(a.createdAt);
      const fechaB = new Date(b.createdAt);
      
      if (sortOrder === 'newest') {
        return fechaB - fechaA; 
      } else {
        return fechaA - fechaB; 
      }
    });

    setComprasFilteredData(comprasFiltradas);
    setCurrentPage(1); 
  }, [compras, searchTerm, statusFilter, sortOrder]);

  const totalPages = Math.ceil(comprasFilteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompras = comprasFilteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const cargarEnvioCompra = async (id_compra, forzarRecarga = false) => {
    if (enviosData[id_compra] && !forzarRecarga) return; 

    try {
      const { data, error } = await getEnvioPorCompra(id_compra);
      if (!error && data?.data) {
        setEnviosData(prev => ({
          ...prev,
          [id_compra]: data.data
        }));
      } else if (error && !error.includes('404')) {
        console.error('Error al cargar envío:', error);
      }
    } catch (error) {
      if (!error.message?.includes('404') && !error.message?.includes('status code 404')) {
        console.error('Error al cargar envío:', error);
      }
    }
  };

  const handleProcesarEnvio = async (compra) => {
    setProcessingShipment(compra.id_compra);
    setLoadingEnvio(true);

    try {
      const serviceCode = "3"; 
      const destinationCoverage = "STGO"; 

      const { data, error } = await procesarEnvio(compra.id_compra, serviceCode, destinationCoverage);

      if (error) {
        alert(`Error al procesar envío: ${error}`);
      } else {
        alert('Orden de transporte creada exitosamente');
        await cargarEnvioCompra(compra.id_compra, true);
      }
    } catch (error) {
      console.error('Error al procesar envío:', error);
      alert('Error interno al procesar el envío');
    } finally {
      setProcessingShipment(null);
      setLoadingEnvio(false);
    }
  };

  const handleVerEtiqueta = async (transportOrderNumber) => {
    try {
      const response = await reimprimirEtiqueta(transportOrderNumber);
      
      if (response.error) {
        alert(`Error al obtener etiqueta: ${response.error}`);
      } else {
        const etiquetaData = response.data?.data || response.data;
        
        if (etiquetaData?.labelData) {
          const labelData = etiquetaData.labelData;
          let mimeType = 'image/jpeg';
          
          if (labelData.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
          } else if (labelData.startsWith('iVBORw0KGgo')) {
            mimeType = 'image/png';
          } else if (labelData.startsWith('JVBERi0x')) {
            mimeType = 'application/pdf';
          }
          
          const byteCharacters = atob(labelData);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            const fileExtension = mimeType === 'application/pdf' ? 'pdf' : 'jpg';
            const displayContent = mimeType === 'application/pdf' 
              ? `<iframe src="${url}" frameborder="0"></iframe>`
              : `<img src="${url}" style="max-width: 100%; height: auto; border: 1px solid #ccc;" alt="Etiqueta de envío">`;
            
            newWindow.document.write(`
              <html>
                <head>
                  <title>Etiqueta - Orden ${etiquetaData.transportOrderNumber || transportOrderNumber}</title>
                  <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .info { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                    .content { text-align: center; margin: 20px 0; }
                    iframe { width: 100%; height: 600px; border: 1px solid #ccc; }
                    img { max-width: 100%; height: auto; border: 1px solid #ccc; }
                    button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
                    button:hover { background: #0056b3; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h2>Etiqueta de Envío - Chilexpress</h2>
                  </div>
                  <div class="info">
                    <strong>Orden de Transporte:</strong> ${etiquetaData.transportOrderNumber || transportOrderNumber}<br>
                    <strong>Referencia:</strong> ${etiquetaData.reference || 'N/A'}<br>
                    <strong>Destinatario:</strong> ${etiquetaData.recipient || 'N/A'}<br>
                    <strong>Dirección:</strong> ${etiquetaData.address || 'N/A'}<br>
                    <strong>Código de Barras:</strong> ${etiquetaData.barcode || 'N/A'}<br>
                    <strong>Tipo de archivo:</strong> ${mimeType === 'application/pdf' ? 'PDF' : 'Imagen (JPEG)'}
                  </div>
                  <div style="text-align: center; margin-bottom: 10px;">
                    <button onclick="descargar()">📥 Descargar ${fileExtension.toUpperCase()}</button>
                    <button onclick="imprimir()">🖨️ Imprimir</button>
                    <button onclick="window.close()">❌ Cerrar</button>
                  </div>
                  <div class="content">
                    ${displayContent}
                  </div>
                  <script>
                    function descargar() {
                      const link = document.createElement('a');
                      link.href = '${url}';
                      link.download = 'etiqueta_${etiquetaData.transportOrderNumber || transportOrderNumber}_${etiquetaData.reference || 'GPS'}.${fileExtension}';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                    function imprimir() {
                      window.print();
                    }
                  </script>
                </body>
              </html>
            `);
            newWindow.document.close();
          } else {
            alert('No se pudo abrir la ventana. Verifica que los popups estén habilitados.');
          }
        } else {
          alert('No se encontraron datos de etiqueta en la respuesta');
        }
      }
    } catch (error) {
      console.error('Error al ver etiqueta:', error);
      alert('Error interno al obtener la etiqueta');
    }
  };

  const handleReimprimirEtiqueta = async (transportOrderNumber) => {
    try {
      const response = await reimprimirEtiqueta(transportOrderNumber);
      
      if (response.error) {
        alert(`Error al reimprimir etiqueta: ${response.error}`);
      } else {
        const etiquetaData = response.data?.data || response.data;
        
        if (etiquetaData?.labelData) {
          const labelData = etiquetaData.labelData;
          
          let mimeType = 'image/jpeg';
          let fileExtension = 'jpg';
          
          if (labelData.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
          } else if (labelData.startsWith('iVBORw0KGgo')) {
            mimeType = 'image/png';
            fileExtension = 'png';
          } else if (labelData.startsWith('JVBERi0x')) {
            mimeType = 'application/pdf';
            fileExtension = 'pdf';
          }
          
          const byteCharacters = atob(labelData);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `etiqueta_${etiquetaData.transportOrderNumber || transportOrderNumber}_${etiquetaData.reference || 'GPS'}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          alert(`Etiqueta reimpresa y descargada exitosamente\n📦 Orden: ${etiquetaData.transportOrderNumber || transportOrderNumber}\n📋 Referencia: ${etiquetaData.reference || 'N/A'}\n👤 Destinatario: ${etiquetaData.recipient || 'N/A'}\n📍 Dirección: ${etiquetaData.address || 'N/A'}\n📄 Formato: ${fileExtension.toUpperCase()}`);
        } else {
          alert('Etiqueta reimpresa exitosamente, pero no se pudo generar el archivo de descarga');
        }
      }
    } catch (error) {
      console.error('Error al reimprimir etiqueta:', error);
      alert('Error interno al reimprimir la etiqueta');
    }
  };

  useEffect(() => {
    if (compras.length > 0) {
      compras.forEach(compra => {
        if (compra.payment_status === 'approved') {
          cargarEnvioCompra(compra.id_compra);
        }
      });
    }
  }, [compras]);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio) => {
    const valor = parseFloat(precio);
    if (isNaN(valor)) {
      return 'Precio no disponible';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(valor);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      default:
        return estado || 'Sin estado';
    }
  };

  const stats = {
    total: compras.length,
    aprobadas: compras.filter(c => c.payment_status === 'approved').length,
    pendientes: compras.filter(c => c.payment_status === 'pending').length,
    montoTotal: compras
      .filter(c => c.payment_status === 'approved')
      .reduce((total, compra) => total + parseFloat(compra.payment_amount || 0), 0)
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">No tienes permisos para acceder a esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión de compras...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Error al cargar las compras: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Compras</h1>
          <p className="text-gray-600">Administra todas las compras realizadas en la plataforma</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Compras</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBox className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Aprobadas</div>
                <div className="text-2xl font-bold text-gray-900">{stats.aprobadas}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTruck className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pendientes</div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendientes}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaDollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Ingresos</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatearPrecio(stats.montoTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre, apellido o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="lg:w-48">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="approved">Aprobadas</option>
                <option value="pending">Pendientes</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
            <div className="lg:w-48">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Más recientes </option>
                <option value="oldest">Más antiguas </option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Mostrar:</span>
              <select
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={15}>15 por página</option>
                <option value={20}>20 por página</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              {comprasFilteredData.length > 0 ? (
                <>
                  Mostrando {startIndex + 1}-{Math.min(endIndex, comprasFilteredData.length)} de {comprasFilteredData.length} compras
                </>
              ) : (
                'No hay compras para mostrar'
              )}
            </div>
          </div>
        </div>

        {comprasFilteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FaShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'todos' 
                ? 'No se encontraron compras con los filtros aplicados' 
                : 'No hay compras registradas'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'todos'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Cuando se realicen compras en la plataforma, aparecerán aquí.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentCompras.map((compra) => (
                <div key={compra.id_compra} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-semibold text-gray-900">
                        Compra #{compra.id_compra}
                      </span>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getEstadoColor(compra.payment_status)}`}>
                        {getEstadoTexto(compra.payment_status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaCalendar className="w-4 h-4 mr-2" />
                        {formatearFecha(compra.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <FaDollarSign className="w-4 h-4 mr-2" />
                        {formatearPrecio(compra.payment_amount)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FaUser className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Información del Cliente</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Nombre:</span>
                        <div className="text-gray-900">{compra.nombre} {compra.apellido}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <div className="text-gray-900">{compra.email}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Teléfono:</span>
                        <div className="text-gray-900">{compra.telefono}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dirección:</span>
                        <div className="text-gray-900">{compra.direccion}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Productos comprados:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(compra.productos || []).map((producto, index) => (
                        <div key={`${compra.id_compra}-${producto.id_producto || index}`} 
                             className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <img
                            src={producto.imagen || '/images/imagenotfound.png'}
                            alt={producto.nombre}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = '/images/imagenotfound.png';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {producto.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              Cantidad: {producto.cantidad}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatearPrecio(producto.precio)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">ID de Pago:</span>
                        <div className="text-gray-900">{compra.payment_id}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Método de Pago:</span>
                        <div className="text-gray-900">{compra.payment_type || 'No especificado'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Referencia:</span>
                        <div className="text-gray-900">{compra.external_reference}</div>
                      </div>
                    </div>
                  </div>

                  {compra.payment_status === 'approved' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <FaShippingFast className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Gestión de Envío</span>
                      </div>
                      
                      {enviosData[compra.id_compra] && enviosData[compra.id_compra].transport_order_number ? (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Estado:</span>
                              <div className="text-green-800 font-medium">{enviosData[compra.id_compra].estado}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Orden de Transporte:</span>
                              <div className="text-gray-900 font-mono">{enviosData[compra.id_compra].transport_order_number}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Servicio:</span>
                              <div className="text-gray-900">{enviosData[compra.id_compra].service_description || 'No especificado'}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Estado Actual:</span>
                              <div className="text-gray-900">{enviosData[compra.id_compra].current_status || 'Pendiente'}</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleVerEtiqueta(enviosData[compra.id_compra].transport_order_number)}
                              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <FaEye className="w-3 h-3 mr-2" />
                              Ver Etiqueta
                            </button>
                            
                            <button
                              onClick={() => handleReimprimirEtiqueta(enviosData[compra.id_compra].transport_order_number)}
                              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FaPrint className="w-3 h-3 mr-2" />
                              Descargar Etiqueta
                            </button>
                            
                            {enviosData[compra.id_compra].barcode && (
                              <button
                                onClick={() => {
                                  const barcode = enviosData[compra.id_compra].barcode;
                                  navigator.clipboard.writeText(barcode).then(() => {
                                    alert(`Código de barras copiado al portapapeles:\n${barcode}`);
                                  }).catch(() => {
                                    alert(`Código de barras: ${barcode}`);
                                  });
                                }}
                                className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                title="Copiar código de barras al portapapeles"
                              >
                                <FaBarcode className="w-3 h-3 mr-2" />
                                Copiar Código
                              </button>
                            )}
                          </div>
                        </div>
                      ) : enviosData[compra.id_compra] && enviosData[compra.id_compra].estado === 'pendiente' ? (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-yellow-800 font-medium">Envío pendiente de procesar</div>
                              <div className="text-yellow-700 text-sm mt-1">
                                Esta compra está lista para generar la orden de transporte y etiqueta de envío.
                              </div>
                            </div>
                            <button
                              onClick={() => handleProcesarEnvio(compra)}
                              disabled={processingShipment === compra.id_compra}
                              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingShipment === compra.id_compra ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <FaTruck className="w-4 h-4 mr-2" />
                                  Procesar Envío
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-yellow-800 font-medium">Envío pendiente de procesar</div>
                              <div className="text-yellow-700 text-sm mt-1">
                                Esta compra está lista para generar la orden de transporte y etiqueta de envío.
                              </div>
                            </div>
                            <button
                              onClick={() => handleProcesarEnvio(compra)}
                              disabled={processingShipment === compra.id_compra}
                              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingShipment === compra.id_compra ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <FaTruck className="w-4 h-4 mr-2" />
                                  Procesar Envío
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft className="w-3 h-3 mr-1" />
                      Anterior
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                page === currentPage
                                  ? 'text-white bg-yellow-600 border border-yellow-600'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 || 
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 py-2 text-sm text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <FaChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GestionCompras;
