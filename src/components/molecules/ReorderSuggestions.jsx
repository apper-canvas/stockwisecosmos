import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import Card from '@/components/atoms/Card'
import StatCard from '@/components/molecules/StatCard'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import { reorderService } from '@/services/api/reorderService'

const ReorderSuggestions = () => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await reorderService.getSuggestions()
      setSuggestions(data)
    } catch (err) {
      setError(err.message || 'Failed to load reorder suggestions')
      toast.error('Failed to load reorder suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuggestions()
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'primary'
    }
  }

  const formatDaysUntilStockOut = (days) => {
    if (days === Infinity) return 'N/A'
    if (days <= 0) return 'Out of stock'
    if (days < 1) return 'Today'
    return `${Math.ceil(days)} days`
  }

  if (loading) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Reorder Suggestions</h2>
          <p className="text-slate-600 text-sm mt-1">
            Products that may need reordering based on sales velocity
          </p>
        </div>
        <Loading type="content" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Reorder Suggestions</h2>
          <p className="text-slate-600 text-sm mt-1">
            Products that may need reordering based on sales velocity
          </p>
        </div>
        <Error message={error} onRetry={loadSuggestions} />
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Reorder Suggestions</h2>
          <p className="text-slate-600 text-sm mt-1">
            Products that may need reordering based on sales velocity
          </p>
        </div>
        <Empty
          title="No reorder suggestions"
          description="All products appear to have sufficient stock based on recent sales velocity."
          icon="CheckCircle"
          showAction={false}
        />
      </Card>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Reorder Suggestions</h2>
          <p className="text-slate-600 text-sm mt-1">
            Products that may need reordering based on sales velocity over the last 30 days
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <motion.div key={suggestion.product.Id} variants={itemVariants}>
              <StatCard
                title={suggestion.product.name}
                value={`${suggestion.suggestedQuantity} units`}
                icon="Package"
                color={getPriorityColor(suggestion.priority)}
                subtitle={`Current: ${suggestion.product.stockLevel} • ${formatDaysUntilStockOut(suggestion.daysUntilStockOut)}`}
                trend={suggestion.priority === 'high' ? 'up' : suggestion.priority === 'medium' ? 'neutral' : 'down'}
              />
            </motion.div>
          ))}
        </div>
        
        {suggestions.length > 6 && (
          <div className="mt-4 text-center">
            <p className="text-slate-600 text-sm">
              Showing top 6 suggestions • {suggestions.length - 6} more products need attention
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default ReorderSuggestions