import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import ApperIcon from '@/components/ApperIcon'

const Empty = ({ 
  title = "No data found",
  description = "Get started by adding your first item.",
  icon = "Package",
  actionText = "Add Item",
  onAction,
  showAction = true
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="text-center py-16">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mb-6">
          <ApperIcon name={icon} size={40} className="text-slate-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          {description}
        </p>
        
        {showAction && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            icon="Plus"
            size="lg"
          >
            {actionText}
          </Button>
        )}
      </Card>
    </motion.div>
  )
}

export default Empty