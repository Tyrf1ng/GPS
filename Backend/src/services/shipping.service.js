"use strict";

const CHILEXPRESS_RATING_KEY = process.env.CHILEXPRESS_RATING_API_KEY;

export async function calcularCostoEnvio(productos, destinationCountyCode) {
    try {
        console.log('🚚 === INICIO COTIZACIÓN ===');
        console.log('📦 Productos recibidos:', productos);
        console.log('📍 Destino INE:', destinationCountyCode);

        const cobertura = await obtenerCodigoChilexpress(destinationCountyCode);
        console.log('🗺️ Resultado cobertura:', cobertura);
        
        if (!cobertura.success) {
            return { success: false, error: cobertura.error };
        }

        let pesoTotal = 0;
        let valorDeclarado = 0;
        
        let anchoMaximo = 0;
        let altoMaximo = 0;
        let profundidadMaxima = 0;

        productos.forEach(item => {
            const cantidad = item.cantidad || 1;
            
            const peso = item.peso ? parseFloat(item.peso) : 0.5;
            const ancho = item.ancho ? parseFloat(item.ancho) : 10;
            const alto = item.alto ? parseFloat(item.alto) : 10;
            const profundidad = item.profundidad ? parseFloat(item.profundidad) : 10;
            const precio = parseInt(item.precio.toString().replace(/\./g, ''));
            
            pesoTotal += peso * cantidad;
            valorDeclarado += precio * cantidad;
            
            anchoMaximo = Math.max(anchoMaximo, ancho);
            altoMaximo = Math.max(altoMaximo, alto);
            profundidadMaxima = Math.max(profundidadMaxima, profundidad);
        });

        const LIMITE_DIMENSION = 100; 
        const factorEmpaque = 1.1; 

        const packageInfo = {
            weight: Math.max(pesoTotal, 0.1),
            height: Math.min(Math.ceil(altoMaximo * factorEmpaque), LIMITE_DIMENSION),
            width: Math.min(Math.ceil(anchoMaximo * factorEmpaque), LIMITE_DIMENSION),
            length: Math.min(Math.ceil(profundidadMaxima * factorEmpaque), LIMITE_DIMENSION)
        };

        console.log('📐 Cálculo de dimensiones:', {
            dimensionesOriginales: `${anchoMaximo}×${altoMaximo}×${profundidadMaxima}`,
            conEmpaque: `${Math.ceil(anchoMaximo * factorEmpaque)}×${Math.ceil(altoMaximo * factorEmpaque)}×${Math.ceil(profundidadMaxima * factorEmpaque)}`,
            final: `${packageInfo.width}×${packageInfo.height}×${packageInfo.length}`,
            peso: `${packageInfo.weight}kg`,
            limitesAplicados: packageInfo.width === LIMITE_DIMENSION || packageInfo.height === LIMITE_DIMENSION || packageInfo.length === LIMITE_DIMENSION
        });

        const baseUrl = 'https://testservices.wschilexpress.com';
        const url = `${baseUrl}/rating/api/v1.0/rates/courier`;
        
        const requestBody = {
            originCountyCode: "ALAM", 
            destinationCountyCode: cobertura.chilexpressCode, 
            package: {
                weight: packageInfo.weight.toString(),
                height: packageInfo.height.toString(),
                width: packageInfo.width.toString(),
                length: packageInfo.length.toString()
            },
            productType: 3,
            contentType: 1,
            declaredWorth: valorDeclarado.toString(),
            deliveryTime: 0
        };

        console.log('📨 Request a Chilexpress:', JSON.stringify(requestBody, null, 2));

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

        console.log('📬 Response status:', response.status);
        
        const data = await response.json();
        console.log('📬 Response completa:', JSON.stringify(data, null, 2));

        if (data.statusCode !== 0) {
            return { 
                success: false, 
                error: data.statusDescription || "Error al cotizar envío" 
            };
        }

        const servicios = data.data?.courierServiceOptions || [];
        
        if (servicios.length === 0) {
            console.log('⚠️ No hay servicios disponibles. Diagnóstico:');
            console.log(`- Dimensiones enviadas: ${packageInfo.width}×${packageInfo.height}×${packageInfo.length}`);
            console.log(`- Peso: ${packageInfo.weight}kg`);
            console.log(`- Destino: ${cobertura.chilexpressCode}`);
            console.log('- Posibles causas: dimensiones exceden límites, peso muy alto, o restricciones de zona');
            
            return {
                success: false,
                error: "No hay servicios disponibles para esta ubicación. Las dimensiones o peso pueden exceder los límites permitidos."
            };
        }

        const servicioMasEconomico = servicios.sort((a, b) => 
            parseInt(a.serviceValue) - parseInt(b.serviceValue)
        )[0];

        console.log('✅ Servicio encontrado:', {
            descripcion: servicioMasEconomico.serviceDescription,
            costo: servicioMasEconomico.serviceValue,
            peso: servicioMasEconomico.finalWeight
        });

        return {
            success: true,
            costoEnvio: parseInt(servicioMasEconomico.serviceValue),
            servicioDescripcion: servicioMasEconomico.serviceDescription,
            pesoFinal: servicioMasEconomico.finalWeight,
            usoPesoVolumetrico: servicioMasEconomico.didUseVolumetricWeight
        };

    } catch (error) {
        console.error("❌ Error completo:", error);
        return { 
            success: false, 
            error: "Error interno al calcular envío" 
        };
    }
}

async function obtenerCodigoChilexpress(ineCode) {
    try {
        const CHILEXPRESS_KEY = process.env.CHILEXPRESS_API_KEY;
        
        const regiones = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'RM', 'R14', 'R15', 'R16'];
        
        for (const region of regiones) {
            const baseUrl = 'https://testservices.wschilexpress.com';
            const url = `${baseUrl}/georeference/api/v1.0/coverage-areas?RegionCode=${region}&type=0`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Ocp-Apim-Subscription-Key": CHILEXPRESS_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.statusCode === 0 && data.coverageAreas) {
                    const comuna = data.coverageAreas.find(area => 
                        area.ineCountyCode === parseInt(ineCode)
                    );
                    
                    if (comuna) {
                        return {
                            success: true,
                            chilexpressCode: comuna.countyCode,
                            nombre: comuna.countyName
                        };
                    }
                }
            }
        }
        
        return {
            success: false,
            error: "No se encontró la comuna en la cobertura de Chilexpress"
        };
    } catch (error) {
        console.error("Error obteniendo código Chilexpress:", error);
        return {
            success: false,
            error: "Error consultando cobertura"
        };
    }
}