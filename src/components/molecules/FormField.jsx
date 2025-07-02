import React from 'react'
import Input from '@/components/atoms/Input'

const FormField = ({ 
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  icon,
  options = [],
  className = '',
  ...props 
}) => {
  const handleChange = (e) => {
    const fieldValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    onChange(name, fieldValue)
  }
  
  if (type === 'select') {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
  
  if (type === 'textarea') {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 resize-none
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        />
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
  
  return (
    <div className={className}>
      <Input
        label={label}
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        error={error}
        disabled={disabled}
        icon={icon}
        {...props}
      />
    </div>
  )
}

export default FormField