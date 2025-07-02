import salesData from '@/services/mockData/sales.json'
import { productService } from '@/services/api/productService'

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let sales = [...salesData]

export const salesService = {
  async getAll() {
    await delay(300)
    return sales.map(sale => ({
      ...sale,
      timestamp: new Date(sale.timestamp)
    }))
  },

  async getById(id) {
    await delay(200)
    const sale = sales.find(s => s.Id === parseInt(id))
    if (!sale) {
      throw new Error('Sale not found')
    }
    return {
      ...sale,
      timestamp: new Date(sale.timestamp)
    }
  },

  async create(saleData) {
    await delay(400)
    
    // Update product stock levels
    for (const item of saleData.items) {
      try {
        const product = await productService.getById(item.productId)
        const newStockLevel = Math.max(0, product.stockLevel - item.quantity)
        await productService.updateStock(item.productId, newStockLevel)
      } catch (error) {
        console.warn(`Failed to update stock for product ${item.productId}:`, error)
      }
    }
    
    const maxId = Math.max(...sales.map(s => s.Id), 0)
    const newSale = {
      Id: maxId + 1,
      timestamp: new Date(),
      items: saleData.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })),
      totalAmount: saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }
    
    sales.push(newSale)
    return { ...newSale }
  },

  async delete(id) {
    await delay(250)
    const index = sales.findIndex(s => s.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Sale not found')
    }
    
    const deleted = sales.splice(index, 1)[0]
    return { ...deleted }
  },

  async getTodaysSales() {
    await delay(200)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    }).map(sale => ({
      ...sale,
      timestamp: new Date(sale.timestamp)
    }))
  },

  async getSalesInRange(startDate, endDate) {
    await delay(250)
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp)
      return saleDate >= start && saleDate <= end
    }).map(sale => ({
      ...sale,
      timestamp: new Date(sale.timestamp)
    }))
  },

  async getDailySummary(date) {
    await delay(200)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    const dailySales = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === targetDate.getTime()
    })
    
    const totalRevenue = dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalTransactions = dailySales.length
    const totalItems = dailySales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    
    return {
      date: targetDate,
      totalRevenue,
      totalTransactions,
      totalItems,
      sales: dailySales.map(sale => ({
        ...sale,
        timestamp: new Date(sale.timestamp)
      }))
    }
  }
}