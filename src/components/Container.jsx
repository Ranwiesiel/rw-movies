const Container = ({ children, className = "", fluid = false }) => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 ${fluid ? 'max-w-full' : 'max-w-[1200px]'} ${className}`}>
        {children}
    </div>
  )
}

export default Container