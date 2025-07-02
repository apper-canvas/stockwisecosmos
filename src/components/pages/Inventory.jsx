import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import Card from '@/components/atoms/Card'
import Button from '@/components/atoms/Button'
import Badge from '@/components/atoms/Badge'
import Input from '@/components/atoms/Input'
import Loading from '@/components/ui/Loading'
import Error from '@/components/ui/Error'
import Empty from '@/components/ui/Empty'
import ApperIcon from '@/components/ApperIcon'
import { productService } from '@/services/api/productService'

const Inventory = ({ searchValue = '' }) => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    stockLevel: '',
    lowStockThreshold: '',
    category: '',
    supplier: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await productService.getAll()
      setProducts(data)
      setFilteredProducts(data)
    } catch (err) {
      setError(err.message || 'Failed to load products')
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (productId, newStockLevel) => {
    try {
      await productService.updateStock(productId, newStockLevel)
      setProducts(prev => prev.map(p => 
        p.Id === productId ? { ...p, stockLevel: parseInt(newStockLevel) } : p
      ))
      setFilteredProducts(prev => prev.map(p => 
        p.Id === productId ? { ...p, stockLevel: parseInt(newStockLevel) } : p
      ))
      toast.success('Stock level updated successfully')
    } catch (err) {
      toast.error('Failed to update stock level')
    }
  }

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.sku || !newProduct.price) {
        toast.error('Please fill in all required fields')
        return
      }

      const createdProduct = await productService.create(newProduct)
      setProducts(prev => [...prev, createdProduct])
      setFilteredProducts(prev => [...prev, createdProduct])
      setNewProduct({
        name: '',
        sku: '',
        price: '',
        stockLevel: '',
        lowStockThreshold: '',
        category: '',
        supplier: ''
      })
      setShowAddForm(false)
      toast.success('Product added successfully')
    } catch (err) {
      toast.error('Failed to add product')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await productService.delete(productId)
      setProducts(prev => prev.filter(p => p.Id !== productId))
      setFilteredProducts(prev => prev.filter(p => p.Id !== productId))
      toast.success('Product deleted successfully')
    } catch (err) {
      toast.error('Failed to delete product')
    }
  }

  const getStockStatus = (product) => {
    if (product.stockLevel === 0) {
      return { variant: 'error', text: 'Out of Stock' }
    } else if (product.stockLevel <= product.lowStockThreshold) {
      return { variant: 'warning', text: 'Low Stock' }
    } else {
      return { variant: 'success', text: 'In Stock' }
    }
  }

  // Filter products based on search
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.category.toLowerCase().includes(searchValue.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchValue, products])

  useEffect(() => {
    loadProducts()
  }, [])

  if (loading) {
    return <Loading type="table" />
  }

  if (error) {
    return <Error message={error} onRetry={loadProducts} />
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
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600 mt-1">
            Manage your product inventory and stock levels
          </p>
        </div>
        
        <Button
          variant="primary"
          icon="Plus"
          onClick={() => setShowAddForm(true)}
        >
          Add Product
        </Button>
      </motion.div>

      {/* Add Product Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Add New Product</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
              
              <Input
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU"
                required
              />
              
              <Input
                label="Price"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
              
              <Input
                label="Initial Stock Level"
                type="number"
                value={newProduct.stockLevel}
                onChange={(e) => setNewProduct(prev => ({ ...prev, stockLevel: e.target.value }))}
                placeholder="0"
              />
              
              <Input
                label="Low Stock Threshold"
                type="number"
                value={newProduct.lowStockThreshold}
                onChange={(e) => setNewProduct(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                placeholder="5"
              />
              
              <Input
                label="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter category"
              />
              
              <Input
                label="Supplier"
                value={newProduct.supplier}
                onChange={(e) => setNewProduct(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Enter supplier name"
                className="md:col-span-2"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddProduct}
              >
                Add Product
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Empty
          title="No products found"
          description={searchValue ? "No products match your search criteria." : "Start by adding your first product to the inventory."}
          icon="Package"
          actionText="Add Product"
          onAction={() => setShowAddForm(true)}
          showAction={!searchValue}
        />
      ) : (
        <motion.div variants={itemVariants}>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Product</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">SKU</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Price</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Stock Level</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Category</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product)
                    const isEditing = editingProduct === product.Id
                    
                    return (
                      <motion.tr
                        key={product.Id}
                        variants={itemVariants}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                        custom={index}
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-600">{product.supplier}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-700">{product.sku}</td>
                        <td className="py-4 px-6 text-slate-900 font-medium">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={product.stockLevel}
                              onChange={(e) => {
                                const newLevel = e.target.value
                                setProducts(prev => prev.map(p => 
                                  p.Id === product.Id ? { ...p, stockLevel: parseInt(newLevel) || 0 } : p
                                ))
                                setFilteredProducts(prev => prev.map(p => 
                                  p.Id === product.Id ? { ...p, stockLevel: parseInt(newLevel) || 0 } : p
                                ))
                              }}
                              className="w-20"
                            />
                          ) : (
                            <span className="text-slate-900 font-medium">{product.stockLevel}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.text}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-slate-700">{product.category}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end space-x-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  icon="Check"
                                  onClick={() => {
                                    handleUpdateStock(product.Id, product.stockLevel)
                                    setEditingProduct(null)
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon="X"
                                  onClick={() => {
                                    setEditingProduct(null)
                                    loadProducts() // Reset values
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon="Edit"
                                  onClick={() => setEditingProduct(product.Id)}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon="Trash2"
                                  onClick={() => handleDeleteProduct(product.Id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Inventory