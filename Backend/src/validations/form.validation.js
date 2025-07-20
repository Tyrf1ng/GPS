import Joi from "joi";

const emailValidation = Joi.string()
    .email({ 
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net', 'org', 'cl', 'co', 'es', 'mx', 'ar'] }
    })
    .pattern(/^[a-zA-Z0-9._%+-]+@(gmail|hotmail|yahoo|outlook|icloud|live|correo)\./)
    .required()
    .messages({
        'string.email': 'Debe ser un email válido',
        'string.pattern.base': 'Email debe ser de un proveedor válido (Gmail, Hotmail, Yahoo, Outlook, etc.)',
        'string.empty': 'Email es requerido',
        'any.required': 'Email es requerido'
    });

const telefonoValidation = Joi.string()
    .pattern(/^\+569[0-9]{8}$/)
    .required()
    .messages({
        'string.pattern.base': 'Teléfono debe tener formato +569XXXXXXXX (9 dígitos después de +569)',
        'string.empty': 'Teléfono es requerido',
        'any.required': 'Teléfono es requerido'
    });

const nombreValidation = Joi.string()
    .min(4)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
        'string.min': 'Nombre debe tener al menos 4 caracteres',
        'string.max': 'Nombre no puede exceder 50 caracteres',
        'string.pattern.base': 'Nombre solo puede contener letras y espacios',
        'string.empty': 'Nombre es requerido',
        'any.required': 'Nombre es requerido'
    });

const apellidoValidation = Joi.string()
    .min(4)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
        'string.min': 'Apellido debe tener al menos 4 caracteres',
        'string.max': 'Apellido no puede exceder 50 caracteres',
        'string.pattern.base': 'Apellido solo puede contener letras y espacios',
        'string.empty': 'Apellido es requerido',
        'any.required': 'Apellido es requerido'
    });

const direccionValidation = Joi.string()
    .min(10)
    .max(255)
    .required()
    .messages({
        'string.min': 'Dirección debe tener al menos 10 caracteres',
        'string.max': 'Dirección no puede exceder 255 caracteres',
        'string.empty': 'Dirección es requerida',
        'any.required': 'Dirección es requerida'
    });

const codigoPostalValidation = Joi.string()
    .pattern(/^[0-9]{7}$/)
    .required()
    .messages({
        'string.pattern.base': 'Código postal debe tener 7 dígitos',
        'string.empty': 'Código postal es requerido',
        'any.required': 'Código postal es requerido'
    });


export const checkoutFormValidation = Joi.object({
    nombres: nombreValidation,
    apellidos: apellidoValidation,
    email: emailValidation,
    phone: telefonoValidation,
    address: direccionValidation,
    postalCode: codigoPostalValidation,
    regionCode: Joi.string().required().messages({
        'string.empty': 'Región es requerida',
        'any.required': 'Región es requerida'
    }),
    comunaCode: Joi.string().required().messages({
        'string.empty': 'Comuna es requerida',
        'any.required': 'Comuna es requerida'
    }),
    instructions: Joi.string().max(500).allow('').messages({
        'string.max': 'Instrucciones no pueden exceder 500 caracteres'
    })
});

export const userRegistrationValidation = Joi.object({
    nombreCompleto: Joi.string()
        .min(8) 
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .required()
        .messages({
            'string.min': 'Nombre completo debe tener al menos 8 caracteres',
            'string.max': 'Nombre completo no puede exceder 100 caracteres',
            'string.pattern.base': 'Nombre completo solo puede contener letras y espacios',
            'string.empty': 'Nombre completo es requerido',
            'any.required': 'Nombre completo es requerido'
        }),
    email: emailValidation,
    telefono: telefonoValidation.optional(),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': 'Contraseña debe tener al menos 8 caracteres',
            'string.pattern.base': 'Contraseña debe tener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 símbolo',
            'string.empty': 'Contraseña es requerida',
            'any.required': 'Contraseña es requerida'
        })
});

export const profileUpdateValidation = Joi.object({
    nombreCompleto: Joi.string()
        .min(8)
        .max(100)
        .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .optional()
        .messages({
            'string.min': 'Nombre completo debe tener al menos 8 caracteres',
            'string.max': 'Nombre completo no puede exceder 100 caracteres',
            'string.pattern.base': 'Nombre completo solo puede contener letras y espacios'
        }),
    email: emailValidation.optional(),
    telefono: telefonoValidation.optional()
});

export const validateEmail = (email) => {
    const { error } = emailValidation.validate(email);
    return {
        isValid: !error,
        message: error?.details[0]?.message || null
    };
};

export const validatePhone = (phone) => {
    const { error } = telefonoValidation.validate(phone);
    return {
        isValid: !error,
        message: error?.details[0]?.message || null
    };
};

export const validateNombre = (nombre) => {
    const { error } = nombreValidation.validate(nombre);
    return {
        isValid: !error,
        message: error?.details[0]?.message || null
    };
};

export const validateApellido = (apellido) => {
    const { error } = apellidoValidation.validate(apellido);
    return {
        isValid: !error,
        message: error?.details[0]?.message || null
    };
};