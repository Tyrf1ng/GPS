import express from "express";
const router = express.Router();

const CHILEXPRESS_KEY = process.env.CHILEXPRESS_API_KEY;
const CHILEXPRESS_RATING_KEY = process.env.CHILEXPRESS_RATING_API_KEY;

const regionCodeMap = {
    '1': 'R1',
    '2': 'R2', 
    '3': 'R3',
    '4': 'R4',
    '5': 'R5',
    '6': 'R6',
    '7': 'R7',
    '8': 'R8',
    '9': 'R9',
    '10': 'R10',
    '11': 'R11',
    '12': 'R12',
    '13': 'RM',
    '14': 'R14',
    '15': 'R15',
    '16': 'R16'
};

router.get("/cobertura", async (req, res) => {
    const { regionCode, comunaCode } = req.query;

    if (!regionCode || !comunaCode) {
        return res.status(400).json({ 
            error: "regionCode y comunaCode son requeridos",
            message: "Debe proporcionar tanto el código de región como el código de comuna"
        });
    }

    const chilexpressRegionCode = regionCodeMap[regionCode] || regionCode;

    try {
        const baseUrl = 'https://testservices.wschilexpress.com';
            
        const url = `${baseUrl}/georeference/api/v1.0/coverage-areas?RegionCode=${chilexpressRegionCode}&type=0`;
        
        console.log("URL de consulta:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Ocp-Apim-Subscription-Key": CHILEXPRESS_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error HTTP ${response.status}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Respuesta Chilexpress:", JSON.stringify(data, null, 2));

        if (data.statusCode !== 0) {
            console.log("Error en respuesta Chilexpress:", data.statusDescription);
            return res.json({ 
                cobertura: false, 
                message: data.statusDescription || "Sin cobertura disponible"
            });
        }

        if (!data.coverageAreas || !Array.isArray(data.coverageAreas) || data.coverageAreas.length === 0) {
            console.log("No hay áreas de cobertura disponibles");
            return res.json({ 
                cobertura: false,
                message: "No hay cobertura disponible para esta región"
            });
        }

        const encontrada = data.coverageAreas.find(area => {
            const normalizeCode = (code) => {
                if (!code) return null;
                const codeStr = code.toString();
                if (codeStr.length === 5) {
                    return parseInt(codeStr.substring(2), 10);
                }
                return parseInt(codeStr, 10);
            };
            
            const comunaNormalizada = normalizeCode(comunaCode);
            const areaNormalizada = normalizeCode(area.ineCountyCode);
            
            return areaNormalizada === comunaNormalizada || 
                   area.ineCountyCode?.toString() === comunaCode.toString();
        });

        

        console.log("Comuna encontrada:", encontrada ? 
            `${encontrada.countyName} (${encontrada.countyCode}) - INE: ${encontrada.ineCountyCode}` : 
            "No encontrada");

        if (encontrada) {
            res.json({ 
                cobertura: true,
                data: {
                    countyName: encontrada.countyName,
                    countyCode: encontrada.countyCode,
                    ineCountyCode: encontrada.ineCountyCode,
                    regionCode: encontrada.regionCode,
                    coverageName: encontrada.coverageName,
                    ppd: encontrada.ind_ppd === 1,
                    rd: encontrada.ind_rd === 1
                }
            });
        } else {
            res.json({ 
                cobertura: false,
                message: "No hay cobertura disponible para esta comuna",
                debug: {
                    regionCode: regionCode,
                    chilexpressRegionCode: chilexpressRegionCode,
                    comunaCode: comunaCode,
                    comunaNormalizada: parseInt(comunaCode.toString().substring(2), 10),
                    totalCoverageAreas: data.coverageAreas.length
                }
            });
        }

    } catch (err) {
        console.error("Error detallado en chilexpress:", err);
        res.status(500).json({ 
            error: "Error consultando Chilexpress",
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get("/regiones", async (req, res) => {
    try {
        
        const baseUrl = 'https://testservices.wschilexpress.com';
            
        const url = `${baseUrl}/georeference/api/v1.0/regions`;
        
        console.log("URL de consulta:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Ocp-Apim-Subscription-Key": CHILEXPRESS_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        });


        if (!response.ok) {
            const errorText = await response.text();
            console.log("Error response body:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Respuesta exitosa de Chilexpress");

        if (data.statusCode !== 0) {
            return res.status(400).json({ 
                error: data.statusDescription || "Error en la consulta de regiones"
            });
        }

        res.json({
            success: true,
            data: data.regions || []
        });

    } catch (err) {
        console.error("Error obteniendo regiones:", err);
        res.status(500).json({ 
            error: "Error consultando regiones",
            message: err.message
        });
    }
});

router.get("/areas-cobertura/:regionCode", async (req, res) => {
    const { regionCode } = req.params;

    if (!regionCode) {
        return res.status(400).json({ error: "regionCode es requerido" });
    }

    const chilexpressRegionCode = regionCodeMap[regionCode] || regionCode;

    try {
        const baseUrl = 'https://testservices.wschilexpress.com';
            
        const url = `${baseUrl}/georeference/api/v1.0/coverage-areas?RegionCode=${chilexpressRegionCode}&type=0`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Ocp-Apim-Subscription-Key": CHILEXPRESS_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error HTTP ${response.status}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.statusCode !== 0) {
            return res.status(400).json({ 
                error: data.statusDescription || "Error en la consulta"
            });
        }

        res.json({
            success: true,
            data: data.coverageAreas || []
        });

    } catch (err) {
        console.error("Error obteniendo áreas de cobertura:", err);
        res.status(500).json({ 
            error: "Error consultando áreas de cobertura",
            message: err.message
        });
    }
});

router.post("/cotizar", async (req, res) => {
    const { 
        destinationCountyCode, 
        package: packageInfo, 
        declaredWorth 
    } = req.body;

    if (!destinationCountyCode || !packageInfo) {
        return res.status(400).json({ 
            error: "destinationCountyCode y package son requeridos"
        });
    }

    console.log("Cotizando envío:", { 
        destinationCountyCode, 
        packageInfo, 
        declaredWorth 
    });

    try {
        const baseUrl = 'https://testservices.wschilexpress.com';
        const url = `${baseUrl}/rating/api/v1.0/rates/courier`;
        
        const requestBody = {
            originCountyCode: "LOAL",
            destinationCountyCode: destinationCountyCode,
            package: {
                weight: packageInfo.weight.toString(),
                height: packageInfo.height.toString(),
                width: packageInfo.width.toString(),
                length: packageInfo.length.toString()
            },
            productType: 3, 
            contentType: 1,
            declaredWorth: declaredWorth.toString(),
            deliveryTime: 0 
        };

        console.log("Request body:", JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Ocp-Apim-Subscription-Key": CHILEXPRESS_RATING_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error HTTP ${response.status}:`, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Respuesta Chilexpress cotización:", JSON.stringify(data, null, 2));

        if (data.statusCode !== 0) {
            console.log("Error en respuesta Chilexpress:", data.statusDescription);
            return res.status(400).json({ 
                error: data.statusDescription || "Error al cotizar envío",
                details: data.errors
            });
        }

        const servicios = data.data?.courierServiceOptions || [];
        
        if (servicios.length === 0) {
            return res.json({
                success: false,
                message: "No hay servicios disponibles para esta ubicación"
            });
        }

        const serviciosOrdenados = servicios.sort((a, b) => 
            parseInt(a.serviceValue) - parseInt(b.serviceValue)
        );

        res.json({
            success: true,
            data: {
                servicioRecomendado: serviciosOrdenados[0],
                todosLosServicios: serviciosOrdenados,
                costoEnvio: parseInt(serviciosOrdenados[0].serviceValue),
                descripcionServicio: serviciosOrdenados[0].serviceDescription
            }
        });

    } catch (err) {
        console.error("Error detallado en cotización:", err);
        res.status(500).json({ 
            error: "Error cotizando envío",
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get("/debug", async (req, res) => {
    res.json({
        NODE_ENV: process.env.NODE_ENV,
        CHILEXPRESS_KEY_EXISTS: !!process.env.CHILEXPRESS_API_KEY,
        CHILEXPRESS_KEY_PREVIEW: process.env.CHILEXPRESS_API_KEY ? 
            `${process.env.CHILEXPRESS_API_KEY.substring(0, 8)}...` : 'NO DEFINIDA',
        baseUrl: 'https://testservices.wschilexpress.com',
        timestamp: new Date().toISOString()
    });
});

export default router;