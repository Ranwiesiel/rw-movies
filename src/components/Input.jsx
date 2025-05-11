import React from 'react'

const Input = React.forwardRef((props, ref) => {
    const { 
        onInput, 
        placeholder, 
        id, 
        name, 
        value, 
        className = "", 
        onKeyPress,
        icon,
        variant = "default",
        disabled = false,
        error = false,
        errorText,
        label
    } = props;

    const variantClasses = {
        default: "bg-white border border-gray-200",
        filled: "bg-gray-100 border border-transparent hover:bg-gray-200",
        outlined: "bg-white border-2 border-gray-300"
    };

    return (
        <div className="relative w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {icon}
                    </div>
                )}
                <input 
                    type='text'
                    onChange={(e) => onInput(e)}
                    onKeyPress={onKeyPress}
                    className={`${variantClasses[variant]} outline-none w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                        ${!disabled && !error ? 'focus:ring-2 focus:ring-blue-300 focus:border-blue-500 hover:border-gray-300' : ''}
                        ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                        ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : ''}
                        ${icon ? 'pl-10' : 'pl-4'} 
                        ${className}`}
                    placeholder={placeholder}
                    id={id}
                    name={name}
                    value={value || ""}
                    ref={ref}
                    disabled={disabled}
                    aria-invalid={error ? "true" : "false"}
                />
                
                {error && errorText && (
                    <p className="mt-1 text-sm text-red-600">{errorText}</p>
                )}
            </div>
        </div>
    )
})

Input.displayName = 'Input';

export default Input