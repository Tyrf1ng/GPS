import { useState, useCallback } from 'react';

export function useFormValidation() {
    const [errors, setErrors] = useState({});
    const [isValidating, setIsValidating] = useState(false);

    const validateEmail = useCallback((email) => {
        if (!email) {
            return 'Email es requerido';
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|yahoo|outlook|icloud|live|correo)\.(com|net|org|cl|co|es|mx|ar)$/i;
        
        if (!emailRegex.test(email)) {
            return 'Email debe ser de un proveedor válido (Gmail, Hotmail, Yahoo, Outlook, etc.)';
        }

        return null;
    }, []);

    const validatePhone = useCallback((phone) => {
        if (!phone) {
            return 'Teléfono es requerido';
        }

        const phoneRegex = /^\+569[0-9]{8}$/;
        
        if (!phoneRegex.test(phone)) {
            return 'Teléfono debe tener formato +569XXXXXXXX (9 dígitos después de +569)';
        }

        return null;
    }, []);

    const validateNombre = useCallback((nombre) => {
        if (!nombre) {
            return 'Nombre es requerido';
        }

        if (nombre.length < 4) {
            return 'Nombre debe tener al menos 4 caracteres';
        }

        if (nombre.length > 50) {
            return 'Nombre no puede exceder 50 caracteres';
        }

        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        
        if (!nombreRegex.test(nombre)) {
            return 'Nombre solo puede contener letras y espacios';
        }

        return null;
    }, []);

    const validateApellido = useCallback((apellido) => {
        if (!apellido) {
            return 'Apellido es requerido';
        }

        if (apellido.length < 4) {
            return 'Apellido debe tener al menos 4 caracteres';
        }

        if (apellido.length > 50) {
            return 'Apellido no puede exceder 50 caracteres';
        }

        const apellidoRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        
        if (!apellidoRegex.test(apellido)) {
            return 'Apellido solo puede contener letras y espacios';
        }

        return null;
    }, []);

    const validateAddress = useCallback((address) => {
        if (!address) {
            return 'Dirección es requerida';
        }

        if (address.length < 10) {
            return 'Dirección debe tener al menos 10 caracteres';
        }

        if (address.length > 255) {
            return 'Dirección no puede exceder 255 caracteres';
        }

        return null;
    }, []);

    const validatePostalCode = useCallback((postalCode) => {
        if (!postalCode) {
            return 'Código postal es requerido';
        }

        const postalRegex = /^[0-9]{7}$/;
        
        if (!postalRegex.test(postalCode)) {
            return 'Código postal debe tener 7 dígitos';
        }

        return null;
    }, []);

    const validateForm = useCallback((formData) => {
        setIsValidating(true);
        const newErrors = {};

        if (formData.nombres !== undefined) {
            const nombreError = validateNombre(formData.nombres);
            if (nombreError) newErrors.nombres = nombreError;
        }

        if (formData.apellidos !== undefined) {
            const apellidoError = validateApellido(formData.apellidos);
            if (apellidoError) newErrors.apellidos = apellidoError;
        }

        if (formData.email !== undefined) {
            const emailError = validateEmail(formData.email);
            if (emailError) newErrors.email = emailError;
        }

        if (formData.phone !== undefined) {
            const phoneError = validatePhone(formData.phone);
            if (phoneError) newErrors.phone = phoneError;
        }

        if (formData.address !== undefined) {
            const addressError = validateAddress(formData.address);
            if (addressError) newErrors.address = addressError;
        }

        if (formData.postalCode !== undefined) {
            const postalError = validatePostalCode(formData.postalCode);
            if (postalError) newErrors.postalCode = postalError;
        }

        if (formData.regionCode !== undefined && !formData.regionCode) {
            newErrors.regionCode = 'Región es requerida';
        }

        if (formData.comunaCode !== undefined && !formData.comunaCode) {
            newErrors.comunaCode = 'Comuna es requerida';
        }

        setErrors(newErrors);
        setIsValidating(false);

        return {
            isValid: Object.keys(newErrors).length === 0,
            errors: newErrors
        };
    }, [validateNombre, validateApellido, validateEmail, validatePhone, validateAddress, validatePostalCode]);

    const validateField = useCallback((fieldName, value) => {
        let error = null;

        switch (fieldName) {
            case 'nombres':
                error = validateNombre(value);
                break;
            case 'apellidos':
                error = validateApellido(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'phone':
                error = validatePhone(value);
                break;
            case 'address':
                error = validateAddress(value);
                break;
            case 'postalCode':
                error = validatePostalCode(value);
                break;
            default:
                break;
        }

        setErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));

        return error === null;
    }, [validateNombre, validateApellido, validateEmail, validatePhone, validateAddress, validatePostalCode]);

    const formatPhone = useCallback((value) => {
        const numbersOnly = value.replace(/\D/g, '');
        
        if (numbersOnly.startsWith('56')) {
            return '+' + numbersOnly;
        }
        
        if (numbersOnly.startsWith('9') && numbersOnly.length <= 9) {
            return '+569' + numbersOnly;
        }
        
        if (value.startsWith('+569')) {
            return '+569' + numbersOnly.slice(3);
        }
        
        return value;
    }, []);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const clearFieldError = useCallback((fieldName) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    return {
        errors,
        isValidating,
        validateForm,
        validateField,
        validateEmail,
        validatePhone,
        validateNombre,
        validateApellido,
        validateAddress,
        validatePostalCode,
        formatPhone,
        clearErrors,
        clearFieldError
    };
}