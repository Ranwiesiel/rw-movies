import React from 'react'

const Input = React.forwardRef((props, ref) => {
    const { onInput, placeholder, id, name, value, className = "", onKeyPress } = props;

    return (
        <input 
            type='text'
            onChange={(e) => onInput(e)}
            onKeyPress={onKeyPress}
            className={`bg-white border border-gray-200 outline-none w-full px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all ${className}`}
            placeholder={placeholder}
            id={id}
            name={name}
            value={value || ""}
            ref={ref}
        />
    )
})

export default Input