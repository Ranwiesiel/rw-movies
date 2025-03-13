const Input = (props) => {
    const { onInput, placeholder, id, name } = props;

    return (
        <input 
            type='text'
            onChange={(e) => onInput(e)}
            className="bg-white border border-gray-200 outline-none w-full px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all"
            placeholder={placeholder}
            id={id}
            name={name}
        />
    )
}

export default Input