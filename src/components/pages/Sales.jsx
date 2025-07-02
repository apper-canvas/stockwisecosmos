import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import Card from '@/components/atoms/Card'
import Button from '@/components/atoms/Button'
import Badge from '@/components/atoms/Badge'
import Input from '@/components/atoms/Input'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import FormField from '@/components/molecules/FormField'
import BarcodeScanner from '@/components/molecules/BarcodeScanner'
import ApperIcon from '@/components/ApperIcon'
import { salesService } from '@/services/api/salesService'
import { productService } from '@/services/api/productService'

const Sales = () => {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [activeSaleItemIndex, setActiveSaleItemIndex] = useState(0)
  const [newSale, setNewSale] = useState({
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  })
  const loadSales = async () => {
    try {
      setLoading(true)
      setError('')
      const [salesData, productsData] = await Promise.all([
        salesService.getAll(),
        productService.getAll()
      ])
      setSales(salesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
      setProducts(productsData)
    } catch (err) {
      setError(err.message || 'Failed to load sales')
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordSale = async () => {
    try {
      if (newSale.items.length === 0 || !newSale.items[0].productId) {
        toast.error('Please add at least one product')
        return
      }

      // Validate stock levels
      for (const item of newSale.items) {
        const product = products.find(p => p.Id === parseInt(item.productId))
        if (product && product.stockLevel < parseInt(item.quantity)) {
          toast.error(`Insufficient stock for ${product.name}. Available: ${product.stockLevel}`)
          return
        }
      }

      const saleData = {
        items: newSale.items.map(item => {
          const product = products.find(p => p.Id === parseInt(item.productId))
          return {
            productId: parseInt(item.productId),
            productName: product?.name || '',
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseInt(item.quantity) * parseFloat(item.unitPrice)
          }
        })
      }

      const createdSale = await salesService.create(saleData)
      setSales(prev => [createdSale, ...prev])
      
      // Update local products state to reflect new stock levels
      const updatedProducts = [...products]
      for (const item of saleData.items) {
        const productIndex = updatedProducts.findIndex(p => p.Id === item.productId)
        if (productIndex !== -1) {
          updatedProducts[productIndex].stockLevel = Math.max(0, 
            updatedProducts[productIndex].stockLevel - item.quantity
          )
        }
      }
      setProducts(updatedProducts)
      
      setNewSale({
        items: [{ productId: '', quantity: 1, unitPrice: 0 }]
      })
      setShowSaleForm(false)
      toast.success('Sale recorded successfully')
    } catch (err) {
      toast.error('Failed to record sale')
    }
  }

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) {
      return
    }

    try {
      await salesService.delete(saleId)
      setSales(prev => prev.filter(sale => sale.Id !== saleId))
      toast.success('Sale deleted successfully')
    } catch (err) {
      toast.error('Failed to delete sale')
    }
  }

  const addSaleItem = () => {
    setNewSale(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeSaleItem = (index) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateSaleItem = (index, field, value) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-fill unit price when product is selected
          if (field === 'productId' && value) {
            const product = products.find(p => p.Id === parseInt(value))
            if (product) {
              updatedItem.unitPrice = product.price
            }
          }
          
          return updatedItem
        }
        return item
      })
    }))
}

  const handleBarcodeSuccess = async (barcode) => {
    try {
      const product = await productService.getByBarcode(barcode)
      if (product) {
        updateSaleItem(activeSaleItemIndex, 'productId', product.Id.toString())
        setShowBarcodeScanner(false)
        toast.success(`Product "${product.name}" selected`)
      }
    } catch (err) {
      toast.error('Product not found for this barcode')
    }
  }

  const handleBarcodeError = (error) => {
    console.warn('Barcode scan error:', error)
  }

  const openBarcodeScanner = (itemIndex) => {
    setActiveSaleItemIndex(itemIndex)
    setShowBarcodeScanner(true)
  }

  useEffect(() => {
    loadSales()
  }, [])

  if (loading) {
    return <Loading type="table" />
  }

  if (error) {
    return <Error message={error} onRetry={loadSales} />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  // Calculate today's totals
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp)
    saleDate.setHours(0, 0, 0, 0)
    return saleDate.getTime() === today.getTime()
  })
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const todaysTransactions = todaysSales.length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Management</h1>
          <p className="text-slate-600 mt-1">
            Record sales and track your daily revenue
          </p>
        </div>
        
        <Button
          variant="primary"
          icon="Plus"
          onClick={() => setShowSaleForm(true)}
        >
          Record Sale
        </Button>
      </motion.div>

      {/* Today's Summary */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <ApperIcon name="DollarSign" size={24} className="text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${todaysRevenue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-slate-900">{todaysTransactions}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ApperIcon name="TrendingUp" size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg. Sale</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${todaysTransactions > 0 ? (todaysRevenue / todaysTransactions).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Record Sale Form */}
      {showSaleForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Record New Sale</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">Sale Items</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Plus"
                    onClick={addSaleItem}
                  >
                    Add Item
                  </Button>
                </div>
<div className="space-y-4">
                  {newSale.items.map((item, index) => {
                    const selectedProduct = products.find(p => p.Id === parseInt(item.productId))
                    const availableStock = selectedProduct?.stockLevel || 0
                    
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <FormField
                            label="Product"
                            type="select"
                            name="productId"
                            value={item.productId}
                            onChange={(name, value) => updateSaleItem(index, 'productId', value)}
                            options={products.map(product => ({ 
                              value: product.Id.toString(), 
                              label: `${product.name} (Stock: ${product.stockLevel})` 
                            }))}
                            placeholder="Select product"
                            required
                          />
                          <div className="flex justify-center mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon="Camera"
                              onClick={() => openBarcodeScanner(index)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Scan Barcode
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <FormField
                            label="Quantity"
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(name, value) => updateSaleItem(index, 'quantity', value)}
                            placeholder="1"
                            required
                          />
                          {selectedProduct && (
                            <p className="text-xs text-slate-500 mt-1">
                              Available: {availableStock}
                            </p>
                          )}
                        </div>
                        
                        <FormField
                          label="Unit Price"
                          type="number"
                          step="0.01"
                          name="unitPrice"
                          value={item.unitPrice}
                          onChange={(name, value) => updateSaleItem(index, 'unitPrice', value)}
                          placeholder="0.00"
                          required
                        />
                        
                        <div className="flex items-end">
                          <Button
                            variant="danger"
                            size="sm"
                            icon="Trash2"
                            onClick={() => removeSaleItem(index)}
                            disabled={newSale.items.length === 1}
                            className="mb-0.5"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Sale Total */}
                <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-slate-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${newSale.items.reduce((sum, item) => 
                        sum + (parseInt(item.quantity || 0) * parseFloat(item.unitPrice || 0)), 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowSaleForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRecordSale}
              >
                Record Sale
              </Button>
            </div>
</Card>
        </motion.div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isActive={showBarcodeScanner}
        onScanSuccess={handleBarcodeSuccess}
        onScanError={handleBarcodeError}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Sales Table */}
      {sales.length === 0 ? (
        <Empty
          title="No sales recorded"
          description="Start recording your sales to track daily revenue and inventory changes."
          icon="TrendingUp"
          actionText="Record Sale"
          onAction={() => setShowSaleForm(true)}
        />
      ) : (
        <motion.div variants={itemVariants}>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Sale ID</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Date & Time</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Items</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Total Amount</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => (
                    <motion.tr
                      key={sale.Id}
                      variants={itemVariants}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                      custom={index}
                    >
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-900">
                          SALE-{sale.Id.toString().padStart(4, '0')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-slate-900 font-medium">
                            {format(sale.timestamp, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-slate-600">
                            {format(sale.timestamp, 'HH:mm')}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-slate-900">{sale.items.length} items</p>
                          <p className="text-sm text-slate-600">
                            {sale.items.slice(0, 2).map(item => item.productName).join(', ')}
                            {sale.items.length > 2 && `, +${sale.items.length - 2} more`}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-lg font-bold text-emerald-600">
                          ${sale.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="Trash2"
                            onClick={() => handleDeleteSale(sale.Id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Sales