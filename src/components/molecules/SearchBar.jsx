import React from 'react'
import Input from '@/components/atoms/Input'

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = '',
  ...props 
}) => {
  return (
    <div className={`w-full max-w-md ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        icon="Search"
        className="bg-white"
        {...props}
      />
    </div>
  )
}

export default SearchBar