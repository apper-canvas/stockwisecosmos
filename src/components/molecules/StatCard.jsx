import React from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/atoms/Card'
import ApperIcon from '@/components/ApperIcon'

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  color = 'primary',
  className = '' 
}) => {
  const colors = {
    primary: 'text-primary-600 bg-primary-50 border-primary-100',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    danger: 'text-red-600 bg-red-50 border-red-100',
    info: 'text-blue-600 bg-blue-50 border-blue-100'
  }
  
  return (
    <Card className={`p-6 ${className}`} hover={true}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <motion.p 
            className="text-3xl font-bold text-slate-900"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
          
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <ApperIcon 
                name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} 
                size={16} 
                className={`mr-1 ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} 
              />
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <ApperIcon name={icon} size={24} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard