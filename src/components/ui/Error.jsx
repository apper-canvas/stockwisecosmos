import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'
import ApperIcon from '@/components/ApperIcon'

const Error = ({ 
  message = "Something went wrong. Please try again.",
  onRetry,
  showRetry = true,
  type = 'default'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6">
          <ApperIcon name="AlertTriangle" size={32} className="text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Oops! Something went wrong
        </h3>
        
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {message}
        </p>
        
        {showRetry && onRetry && (
          <div className="flex justify-center space-x-3">
            <Button
              variant="primary"
              onClick={onRetry}
              icon="RefreshCw"
            >
              Try Again
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              icon="RotateCcw"
            >
              Refresh Page
            </Button>
          </div>
        )}
        
        {!showRetry && (
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            icon="RotateCcw"
          >
            Refresh Page
          </Button>
        )}
      </Card>
    </motion.div>
  )
}

export default Error