import { useState } from 'react';

export function ValidatedInput({ 
    label, 
    name, 
    type = "text", 
    value, 
    onChange, 
    onBlur,
    error, 
    placeholder,
    required = false,
    disabled = false,
    maxLength,
    autoFormat = false,
    formatFunction,
    className = ""
}) {
    const [focused, setFocused] = useState(false);

    const handleChange = (e) => {
        let newValue = e.target.value;
        
        if (autoFormat && formatFunction) {
            newValue = formatFunction(newValue);
        }
        
        onChange(name, newValue);
    };

    const handleFocus = () => {
        setFocused(true);
    };

    const handleBlur = (e) => {
        setFocused(false);
        if (onBlur) {
            onBlur(name, e.target.value);
        }
    };

    const inputClasses = `
        w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 
        ${error 
            ? 'border-red-500 bg-red-50 focus:border-red-600' 
            : focused 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'focus:outline-none'}
        ${className}
    `;

    return (
        <div className="mb-4">
            <label 
                htmlFor={name} 
                className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    error ? 'text-red-700' : focused ? 'text-blue-700' : 'text-gray-700'
                }`}
            >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    className={inputClasses}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${name}-error` : undefined}
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {error && (
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    )}
                    
                    {!error && value && (
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            </div>
            
            {error && (
                <p id={`${name}-error`} className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            
            {maxLength && (
                <p className="mt-1 text-xs text-gray-500 text-right">
                    {value?.length || 0}/{maxLength}
                </p>
            )}
        </div>
    );
}