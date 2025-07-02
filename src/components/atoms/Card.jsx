import React from 'react'
import { motion } from 'framer-motion'

const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  hover = true,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg border border-slate-200 transition-all duration-200'
  const hoverClasses = hover ? 'shadow-card hover:shadow-card-hover' : 'shadow-card'
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  }
  
  const classes = `${baseClasses} ${hoverClasses} ${paddings[padding]} ${className}`
  
  return (
    <motion.div
      className={classes}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card