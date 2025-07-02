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
import ApperIcon from '@/components/ApperIcon'
import { orderService } from '@/services/api/orderService'
import { productService } from '@/services/api/productService'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newOrder, setNewOrder] = useState({
    supplier: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  })

  const suppliers = [
    'TechSupply Co',
    'Green Textiles',
    'EcoWare Ltd',
    'Bright Solutions',
    'Wellness Direct',
    'Roasters Guild',
    'Paper Plus',
    'EcoTech',
    'Aroma Works',
    'Fit Supply'
  ]

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const [ordersData, productsData] = await Promise.all([
        orderService.getAll(),
        productService.getAll()
      ])
      setOrders(ordersData)
      setProducts(productsData)
    } catch (err) {
      setError(err.message || 'Failed to load orders')
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      if (!newOrder.supplier) {
        toast.error('Please select a supplier')
        return
      }

      if (newOrder.items.length === 0 || !newOrder.items[0].productId) {
        toast.error('Please add at least one product')
        return
      }

      const orderData = {
        ...newOrder,
        items: newOrder.items.map(item => {
          const product = products.find(p => p.Id === parseInt(item.productId))
          return {
            ...item,
            productId: parseInt(item.productId),
            productName: product?.name || '',
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseInt(item.quantity) * parseFloat(item.unitPrice)
          }
        })
      }

      const createdOrder = await orderService.create(orderData)
      setOrders(prev => [createdOrder, ...prev])
      setNewOrder({
        supplier: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }]
      })
      setShowCreateForm(false)
      toast.success('Purchase order created successfully')
    } catch (err) {
      toast.error('Failed to create order')
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status)
      setOrders(prev => prev.map(order => 
        order.Id === orderId ? { ...order, status } : order
      ))
      toast.success(`Order marked as ${status.toLowerCase()}`)
    } catch (err) {
      toast.error('Failed to update order status')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return
    }

    try {
      await orderService.delete(orderId)
      setOrders(prev => prev.filter(order => order.Id !== orderId))
      toast.success('Order deleted successfully')
    } catch (err) {
      toast.error('Failed to delete order')
    }
  }

  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeOrderItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateOrderItem = (index, field, value) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-fill unit price when product is selected
          if (field === 'productId' && value) {
            const product = products.find(p => p.Id === parseInt(value))
            if (product) {
              updatedItem.unitPrice = product.price * 0.7 // Wholesale price (30% discount)
            }
          }
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning'
      case 'Received': return 'success'
      case 'Cancelled': return 'error'
      default: return 'default'
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  if (loading) {
    return <Loading type="table" />
  }

  if (error) {
    return <Error message={error} onRetry={loadOrders} />
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
          <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-600 mt-1">
            Manage your inventory restocking and supplier orders
          </p>
        </div>
        
        <Button
          variant="primary"
          icon="Plus"
          onClick={() => setShowCreateForm(true)}
        >
          Create Order
        </Button>
      </motion.div>

      {/* Create Order Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Create Purchase Order</h2>
            
            <div className="space-y-6">
              <FormField
                label="Supplier"
                type="select"
                name="supplier"
                value={newOrder.supplier}
                onChange={(name, value) => setNewOrder(prev => ({ ...prev, [name]: value }))}
                options={suppliers.map(supplier => ({ value: supplier, label: supplier }))}
                placeholder="Select supplier"
                required
              />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">Order Items</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="Plus"
                    onClick={addOrderItem}
                  >
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {newOrder.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                      <FormField
                        label="Product"
                        type="select"
                        name="productId"
                        value={item.productId}
                        onChange={(name, value) => updateOrderItem(index, 'productId', value)}
                        options={products.map(product => ({ 
                          value: product.Id.toString(), 
                          label: `${product.name} (${product.sku})` 
                        }))}
                        placeholder="Select product"
                        required
                      />
                      
                      <FormField
                        label="Quantity"
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(name, value) => updateOrderItem(index, 'quantity', value)}
                        placeholder="1"
                        required
                      />
                      
                      <FormField
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        name="unitPrice"
                        value={item.unitPrice}
                        onChange={(name, value) => updateOrderItem(index, 'unitPrice', value)}
                        placeholder="0.00"
                        required
                      />
                      
                      <div className="flex items-end">
                        <Button
                          variant="danger"
                          size="sm"
                          icon="Trash2"
                          onClick={() => removeOrderItem(index)}
                          disabled={newOrder.items.length === 1}
                          className="mb-0.5"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Total */}
                <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-slate-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${newOrder.items.reduce((sum, item) => 
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
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateOrder}
              >
                Create Order
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Orders Table */}
      {orders.length === 0 ? (
        <Empty
          title="No purchase orders found"
          description="Create your first purchase order to start restocking inventory."
          icon="ShoppingCart"
          actionText="Create Order"
          onAction={() => setShowCreateForm(true)}
        />
      ) : (
        <motion.div variants={itemVariants}>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Order ID</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Supplier</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Date</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Items</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Total</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Status</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order.Id}
                      variants={itemVariants}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                      custom={index}
                    >
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-900">PO-{order.Id.toString().padStart(4, '0')}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{order.supplier}</td>
                      <td className="py-4 px-6 text-slate-700">
                        {format(order.orderDate, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-700">{order.items.length} items</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-900">${order.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          {order.status === 'Pending' && (
                            <Button
                              size="sm"
                              variant="success"
                              icon="Check"
                              onClick={() => handleUpdateOrderStatus(order.Id, 'Received')}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="Trash2"
                            onClick={() => handleDeleteOrder(order.Id)}
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

export default Orders