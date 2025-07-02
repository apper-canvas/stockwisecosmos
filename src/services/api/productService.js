import productsData from '@/services/mockData/products.json'

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let products = [...productsData]

export const productService = {
  async getAll() {
    await delay(300)
    return [...products]
  },

  async getById(id) {
    await delay(200)
    const product = products.find(p => p.Id === parseInt(id))
    if (!product) {
      throw new Error('Product not found')
    }
    return { ...product }
  },

  async create(productData) {
    await delay(400)
    const maxId = Math.max(...products.map(p => p.Id), 0)
    const newProduct = {
      Id: maxId + 1,
      ...productData,
      stockLevel: parseInt(productData.stockLevel) || 0,
      lowStockThreshold: parseInt(productData.lowStockThreshold) || 5,
      price: parseFloat(productData.price) || 0
    }
    products.push(newProduct)
    return { ...newProduct }
  },

  async update(id, updates) {
    await delay(300)
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Product not found')
    }
    
    const updatedProduct = {
      ...products[index],
      ...updates,
      Id: parseInt(id),
      stockLevel: parseInt(updates.stockLevel) || products[index].stockLevel,
      lowStockThreshold: parseInt(updates.lowStockThreshold) || products[index].lowStockThreshold,
      price: parseFloat(updates.price) || products[index].price
    }
    
    products[index] = updatedProduct
    return { ...updatedProduct }
  },

  async delete(id) {
    await delay(250)
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Product not found')
    }
    
    const deleted = products.splice(index, 1)[0]
    return { ...deleted }
  },

  async getLowStock() {
    await delay(200)
    return products.filter(p => p.stockLevel <= p.lowStockThreshold).map(p => ({...p}))
  },

  async updateStock(id, newStockLevel) {
    await delay(250)
    const index = products.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Product not found')
    }
    
    products[index].stockLevel = parseInt(newStockLevel) || 0
    return { ...products[index] }
  }
}