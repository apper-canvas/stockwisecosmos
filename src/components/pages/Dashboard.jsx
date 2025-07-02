import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import StatCard from '@/components/molecules/StatCard'
import Card from '@/components/atoms/Card'
import Badge from '@/components/atoms/Badge'
import Button from '@/components/atoms/Button'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import ApperIcon from '@/components/ApperIcon'
import { productService } from '@/services/api/productService'
import { orderService } from '@/services/api/orderService'
import { salesService } from '@/services/api/salesService'
import { format } from 'date-fns'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    products: [],
    lowStockProducts: [],
    pendingOrders: [],
    todaysSales: [],
    stats: {
      totalProducts: 0,
      lowStockCount: 0,
      pendingOrdersCount: 0,
      todaysRevenue: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [products, lowStock, pendingOrders, todaysSales] = await Promise.all([
        productService.getAll(),
        productService.getLowStock(),
        orderService.getPending(),
        salesService.getTodaysSales()
      ])
      
      const totalInventoryValue = products.reduce((sum, product) => 
        sum + (product.price * product.stockLevel), 0
      )
      
      const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      
      setDashboardData({
        products,
        lowStockProducts: lowStock,
        pendingOrders,
        todaysSales,
        stats: {
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          pendingOrdersCount: pendingOrders.length,
          todaysRevenue,
          totalInventoryValue
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return <Loading type="cards" />
  }

  if (error) {
    return <Error message={error} onRetry={loadDashboardData} />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Welcome back! Here's what's happening with your inventory today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Products"
          value={dashboardData.stats.totalProducts}
          icon="Package"
          color="primary"
        />
        
        <StatCard
          title="Low Stock Items"
          value={dashboardData.stats.lowStockCount}
          icon="AlertTriangle"
          color={dashboardData.stats.lowStockCount > 0 ? "warning" : "success"}
        />
        
        <StatCard
          title="Pending Orders"
          value={dashboardData.stats.pendingOrdersCount}
          icon="ShoppingCart"
          color="info"
        />
        
        <StatCard
          title="Today's Revenue"
          value={`$${dashboardData.stats.todaysRevenue.toFixed(2)}`}
          icon="DollarSign"
          color="success"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <ApperIcon name="AlertTriangle" size={24} className="mr-3 text-yellow-600" />
                Low Stock Alerts
              </h2>
              <Badge variant="warning">
                {dashboardData.lowStockProducts.length} items
              </Badge>
            </div>
            
            <div className="space-y-4">
              {dashboardData.lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <ApperIcon name="CheckCircle" size={48} className="mx-auto text-emerald-500 mb-4" />
                  <p className="text-slate-600">All products are well stocked!</p>
                </div>
              ) : (
                <>
                  {dashboardData.lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.Id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{product.name}</h3>
                        <p className="text-sm text-slate-600">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-700">
                          {product.stockLevel}
                        </p>
                        <p className="text-xs text-slate-500">
                          Min: {product.lowStockThreshold}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.lowStockProducts.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      And {dashboardData.lowStockProducts.length - 5} more items...
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Sales */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <ApperIcon name="TrendingUp" size={24} className="mr-3 text-emerald-600" />
                Today's Sales
              </h2>
              <Badge variant="success">
                ${dashboardData.stats.todaysRevenue.toFixed(2)}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {dashboardData.todaysSales.length === 0 ? (
                <div className="text-center py-8">
                  <ApperIcon name="ShoppingBag" size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No sales recorded today yet.</p>
                </div>
              ) : (
                <>
                  {dashboardData.todaysSales.slice(0, 5).map((sale) => (
                    <div key={sale.Id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          Sale #{sale.Id}
                        </p>
                        <p className="text-sm text-slate-600">
                          {format(sale.timestamp, 'HH:mm')} • {sale.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-700">
                          ${sale.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.todaysSales.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      And {dashboardData.todaysSales.length - 5} more sales...
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              size="lg"
              icon="Plus"
              className="w-full justify-center"
              onClick={() => window.location.href = '/inventory'}
            >
              Add New Product
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              icon="ShoppingCart"
              className="w-full justify-center"
              onClick={() => window.location.href = '/orders'}
            >
              Create Purchase Order
            </Button>
            
            <Button
              variant="success"
              size="lg"
              icon="DollarSign"
              className="w-full justify-center"
              onClick={() => window.location.href = '/sales'}
            >
              Record Sale
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard