import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns'
import { saveAs } from 'file-saver'
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
  const [allProducts, setAllProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'quantity', 'transactions'])
  const [sortBy, setSortBy] = useState('revenue')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const availableMetrics = [
    { id: 'revenue', label: 'Revenue', icon: 'DollarSign' },
    { id: 'quantity', label: 'Quantity Sold', icon: 'Package' },
    { id: 'transactions', label: 'Transactions', icon: 'ShoppingBag' },
    { id: 'profit', label: 'Profit Margin', icon: 'TrendingUp' },
    { id: 'averageValue', label: 'Average Order Value', icon: 'Calculator' }
  ]

  const sortOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'productName', label: 'Product Name' },
    { value: 'transactions', label: 'Transactions' }
  ]

  const getDateRange = () => {
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'week':
        return { start: subWeeks(now, 1), end: now }
      case 'month':
        return { start: subMonths(now, 1), end: now }
      case 'quarter':
        return { start: subMonths(now, 3), end: now }
      case 'year':
        return { start: subMonths(now, 12), end: now }
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

  const loadProducts = async () => {
    try {
      const products = await productService.getAll()
      setAllProducts(products)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const calculateProductMetrics = (sales, products) => {
    const productSales = {}
    
    // Initialize product sales data
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (selectedProducts.length === 0 || selectedProducts.includes(item.productId)) {
          if (!productSales[item.productId]) {
            const product = products.find(p => p.Id === item.productId)
            productSales[item.productId] = {
              productId: item.productId,
              productName: item.productName,
              quantitySold: 0,
              revenue: 0,
              transactions: 0,
              profit: 0,
              averageValue: 0,
              costPrice: product ? product.costPrice || 0 : 0
            }
          }
          
          productSales[item.productId].quantitySold += item.quantity
          productSales[item.productId].revenue += item.totalPrice
          productSales[item.productId].transactions += 1
          
          // Calculate profit (revenue - cost)
          const costPrice = productSales[item.productId].costPrice
          productSales[item.productId].profit += (item.totalPrice - (costPrice * item.quantity))
        }
      })
    })

    // Calculate average order value
    Object.values(productSales).forEach(product => {
      if (product.transactions > 0) {
        product.averageValue = product.revenue / product.transactions
      }
    })

    return Object.values(productSales)
  }

  const filterAndSortData = (data) => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    return filtered
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
      
      // Calculate basic metrics
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const totalTransactions = sales.length
      const totalItemsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )
      const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Calculate product metrics
      const productMetrics = calculateProductMetrics(sales, products)
      const filteredAndSorted = filterAndSortData(productMetrics)
      
      // Daily sales breakdown
      const dailySales = {}
      sales.forEach(sale => {
        const day = format(sale.timestamp, 'yyyy-MM-dd')
        if (!dailySales[day]) {
          dailySales[day] = { revenue: 0, transactions: 0, quantity: 0 }
        }
        dailySales[day].revenue += sale.totalAmount
        dailySales[day].transactions += 1
        dailySales[day].quantity += sale.items.reduce((sum, item) => sum + item.quantity, 0)
      })
      
      const dailyBreakdown = Object.entries(dailySales)
        .map(([date, data]) => ({
          date: new Date(date),
          ...data
        }))
        .sort((a, b) => a.date - b.date)

      // Summary metrics based on selected metrics
      const summaryMetrics = {
        totalRevenue: selectedMetrics.includes('revenue') ? totalRevenue : null,
        totalTransactions: selectedMetrics.includes('transactions') ? totalTransactions : null,
        totalItemsSold: selectedMetrics.includes('quantity') ? totalItemsSold : null,
        averageSale: selectedMetrics.includes('averageValue') ? averageSale : null,
        totalProfit: selectedMetrics.includes('profit') ? 
          productMetrics.reduce((sum, p) => sum + p.profit, 0) : null
      }
      
      setReportData({
        dateRange: { start, end },
        summaryMetrics,
        productMetrics: filteredAndSorted,
        dailyBreakdown,
        totalProducts: products.length
      })
      
    } catch (err) {
      setError(err.message || 'Failed to load report data')
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const headers = ['Product Name', ...selectedMetrics.map(metric => 
      availableMetrics.find(m => m.id === metric)?.label || metric
    )]
    
    const rows = reportData.productMetrics.map(product => [
      product.productName,
      ...selectedMetrics.map(metric => {
        switch (metric) {
          case 'revenue':
            return `$${product.revenue.toFixed(2)}`
          case 'quantity':
            return product.quantitySold
          case 'transactions':
            return product.transactions
          case 'profit':
            return `$${product.profit.toFixed(2)}`
          case 'averageValue':
            return `$${product.averageValue.toFixed(2)}`
          default:
            return product[metric] || 0
        }
      })
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    saveAs(blob, filename)
    toast.success('Report exported successfully')
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleMetricSelection = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  const clearAllFilters = () => {
    setSelectedProducts([])
    setSelectedMetrics(['revenue', 'quantity', 'transactions'])
    setSearchTerm('')
    setSortBy('revenue')
    setSortOrder('desc')
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (allProducts.length > 0) {
      loadReportData()
    }
  }, [dateRange, customStartDate, customEndDate, selectedProducts, selectedMetrics, sortBy, sortOrder, searchTerm, allProducts])

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Report Builder</h1>
            <p className="text-slate-600">
              Generate customized sales reports with advanced filtering and analysis
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Filter" size={16} />
              Filters
            </Button>
            <Button
              variant="primary"
              onClick={exportToCSV}
              disabled={!reportData || reportData.productMetrics.length === 0}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Download" size={16} />
              Export CSV
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Report Configuration</h2>
              <Button variant="secondary" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
            
            {/* Date Range */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900 mb-3">Date Range</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                  { value: 'quarter', label: 'Last 3 Months' },
                  { value: 'year', label: 'Last Year' },
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
            </div>

            {/* Metrics Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900 mb-3">Metrics to Include</h3>
              <div className="flex flex-wrap gap-2">
                {availableMetrics.map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => toggleMetricSelection(metric.id)}
                    className={`filter-chip ${selectedMetrics.includes(metric.id) ? 'filter-chip-active' : ''}`}
                  >
                    <ApperIcon name={metric.icon} size={14} className="mr-1" />
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900 mb-3">
                Product Filter ({selectedProducts.length === 0 ? 'All Products' : `${selectedProducts.length} Selected`})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {allProducts.map(product => (
                  <button
                    key={product.Id}
                    onClick={() => toggleProductSelection(product.Id)}
                    className={`filter-chip text-left ${selectedProducts.includes(product.Id) ? 'filter-chip-active' : ''}`}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search Products"
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon="Search"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="input-field"
                >
                  <option value="desc">Highest to Lowest</option>
                  <option value="asc">Lowest to Highest</option>
                </select>
              </div>
            </div>

            {reportData && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Reporting Period:</strong> {' '}
                  {format(reportData.dateRange.start, 'MMM dd, yyyy')} - {' '}
                  {format(reportData.dateRange.end, 'MMM dd, yyyy')} | {' '}
                  <strong>Products:</strong> {reportData.productMetrics.length} | {' '}
                  <strong>Metrics:</strong> {selectedMetrics.length}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Summary Metrics */}
      {reportData && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportData.summaryMetrics.totalRevenue !== null && (
              <Card>
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <ApperIcon name="DollarSign" size={24} className="text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${reportData.summaryMetrics.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {reportData.summaryMetrics.totalTransactions !== null && (
              <Card>
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ApperIcon name="ShoppingBag" size={24} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {reportData.summaryMetrics.totalTransactions}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {reportData.summaryMetrics.totalItemsSold !== null && (
              <Card>
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ApperIcon name="Package" size={24} className="text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Items Sold</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {reportData.summaryMetrics.totalItemsSold}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {reportData.summaryMetrics.totalProfit !== null && (
              <Card>
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ApperIcon name="TrendingUp" size={24} className="text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Profit</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${reportData.summaryMetrics.totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Product Performance Table */}
      {reportData && (
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <ApperIcon name="BarChart3" size={24} className="mr-3 text-chart-600" />
                Product Performance Analysis
              </h2>
              <div className="text-sm text-slate-600">
                {reportData.productMetrics.length} products
              </div>
            </div>
            
            {reportData.productMetrics.length === 0 ? (
              <div className="text-center py-12">
                <ApperIcon name="AlertCircle" size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 mb-2">No data found for current filters</p>
                <p className="text-sm text-slate-500">Try adjusting your date range or removing some filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Product</th>
                      {selectedMetrics.map(metric => {
                        const metricInfo = availableMetrics.find(m => m.id === metric)
                        return (
                          <th key={metric} className="text-right py-3 px-4 font-medium text-slate-700">
                            {metricInfo?.label}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.productMetrics.map((product, index) => (
                      <tr key={product.productId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-primary-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">{product.productName}</span>
                          </div>
                        </td>
                        {selectedMetrics.map(metric => (
                          <td key={metric} className="py-3 px-4 text-right">
                            {metric === 'revenue' && (
                              <span className="font-bold text-emerald-600">
                                ${product.revenue.toFixed(2)}
                              </span>
                            )}
                            {metric === 'quantity' && (
                              <span className="font-medium text-slate-900">
                                {product.quantitySold}
                              </span>
                            )}
                            {metric === 'transactions' && (
                              <span className="font-medium text-slate-900">
                                {product.transactions}
                              </span>
                            )}
                            {metric === 'profit' && (
                              <span className={`font-bold ${product.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                ${product.profit.toFixed(2)}
                              </span>
                            )}
                            {metric === 'averageValue' && (
                              <span className="font-medium text-slate-900">
                                ${product.averageValue.toFixed(2)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Daily Breakdown Chart */}
      {reportData && reportData.dailyBreakdown.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
              <ApperIcon name="Calendar" size={24} className="mr-3 text-blue-600" />
              Daily Performance Trend
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reportData.dailyBreakdown.map((day) => (
                <div key={day.date.toISOString()} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {format(day.date, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {day.transactions} transactions • {day.quantity} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      ${day.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600">
                      ${day.transactions > 0 ? (day.revenue / day.transactions).toFixed(2) : '0.00'} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Reports