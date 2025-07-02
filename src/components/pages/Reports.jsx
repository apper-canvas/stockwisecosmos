import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns'
import Card from '@/components/atoms/Card'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import ApperIcon from '@/components/ApperIcon'
import { salesService } from '@/services/api/salesService'
import { productService } from '@/services/api/productService'

const Reports = () => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [topProducts, setTopProducts] = useState([])

  const getDateRange = () => {
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'week':
        return { start: subWeeks(now, 1), end: now }
      case 'month':
        return { start: subMonths(now, 1), end: now }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate) 
          }
        }
        return { start: subWeeks(now, 1), end: now }
      default:
        return { start: subWeeks(now, 1), end: now }
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { start, end } = getDateRange()
      const [sales, products] = await Promise.all([
        salesService.getSalesInRange(start, end),
        productService.getAll()
      ])
      
      // Calculate metrics
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalTransactions = sales.length
      const totalItemsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )
      const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      // Calculate top products
      const productSales = {}
      sales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantitySold: 0,
              revenue: 0
            }
          }
          productSales[item.productId].quantitySold += item.quantity
          productSales[item.productId].revenue += item.totalPrice
        })
      })
      
      const topProductsList = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
      
      // Daily sales breakdown
      const dailySales = {}
      sales.forEach(sale => {
        const day = format(sale.timestamp, 'yyyy-MM-dd')
        if (!dailySales[day]) {
          dailySales[day] = { revenue: 0, transactions: 0 }
        }
        dailySales[day].revenue += sale.totalAmount
        dailySales[day].transactions += 1
      })
      
      const dailyBreakdown = Object.entries(dailySales)
        .map(([date, data]) => ({
          date: new Date(date),
          ...data
        }))
        .sort((a, b) => a.date - b.date)
      
      // Low stock and inventory value
      const lowStockProducts = products.filter(p => p.stockLevel <= p.lowStockThreshold)
      const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stockLevel), 0)
      
      setReportData({
        dateRange: { start, end },
        totalRevenue,
        totalTransactions,
        totalItemsSold,
        averageSale,
        dailyBreakdown,
        lowStockCount: lowStockProducts.length,
        totalInventoryValue,
        totalProducts: products.length
      })
      
      setTopProducts(topProductsList)
      
    } catch (err) {
      setError(err.message || 'Failed to load report data')
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [dateRange, customStartDate, customEndDate])

  if (loading) {
    return <Loading type="cards" />
  }

  if (error) {
    return <Error message={error} onRetry={loadReportData} />
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Reports</h1>
        <p className="text-slate-600">
          Analyze your sales performance and inventory insights
        </p>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div variants={itemVariants}>
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Report Period</h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'custom', label: 'Custom Range' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDateRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
          
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>Reporting Period:</strong> {' '}
              {format(reportData.dateRange.start, 'MMM dd, yyyy')} - {' '}
              {format(reportData.dateRange.end, 'MMM dd, yyyy')}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <ApperIcon name="DollarSign" size={24} className="text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${reportData.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ApperIcon name="ShoppingBag" size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Transactions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {reportData.totalTransactions}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ApperIcon name="Package" size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Items Sold</p>
                <p className="text-2xl font-bold text-slate-900">
                  {reportData.totalItemsSold}
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ApperIcon name="TrendingUp" size={24} className="text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Average Sale</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${reportData.averageSale.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <ApperIcon name="Trophy" size={24} className="mr-3 text-yellow-600" />
              Top Selling Products
            </h2>
            
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8">
                  <ApperIcon name="Package" size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No product sales in this period</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.productName}</p>
                        <p className="text-sm text-slate-600">
                          {product.quantitySold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        ${product.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Daily Sales Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <ApperIcon name="Calendar" size={24} className="mr-3 text-blue-600" />
              Daily Sales Breakdown
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reportData.dailyBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <ApperIcon name="Calendar" size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No sales in this period</p>
                </div>
              ) : (
                reportData.dailyBreakdown.map((day) => (
                  <div key={day.date.toISOString()} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {format(day.date, 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {day.transactions} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        ${day.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <ApperIcon name="Warehouse" size={24} className="mr-3 text-purple-600" />
            Inventory Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <ApperIcon name="Package" size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{reportData.totalProducts}</p>
            </div>
            
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <ApperIcon name="AlertTriangle" size={32} className="mx-auto text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-1">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-700">{reportData.lowStockCount}</p>
            </div>
            
            <div className="text-center p-6 bg-emerald-50 rounded-lg">
              <ApperIcon name="DollarSign" size={32} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 mb-1">Inventory Value</p>
              <p className="text-2xl font-bold text-emerald-700">
                ${reportData.totalInventoryValue.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Reports