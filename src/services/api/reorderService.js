import { salesService } from '@/services/api/salesService'
import { productService } from '@/services/api/productService'
import { subDays, isAfter } from 'date-fns'

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const reorderService = {
  async getSuggestions(daysToAnalyze = 30) {
    await delay(400)
    
    try {
      // Get all products and sales data
      const [products, allSales] = await Promise.all([
        productService.getAll(),
        salesService.getAll()
      ])
      
      // Calculate date range for analysis
      const analysisStartDate = subDays(new Date(), daysToAnalyze)
      
      // Filter sales within the analysis period
      const recentSales = allSales.filter(sale => 
        isAfter(sale.timestamp, analysisStartDate)
      )
      
      // Calculate sales velocity for each product
      const productVelocity = new Map()
      
      // Initialize velocity tracking for all products
      products.forEach(product => {
        productVelocity.set(product.Id, {
          product,
          totalQuantitySold: 0,
          salesCount: 0,
          lastSaleDate: null,
          averageDailyVelocity: 0
        })
      })
      
      // Process sales to calculate velocity
      recentSales.forEach(sale => {
        sale.items.forEach(item => {
          const velocityData = productVelocity.get(item.productId)
          if (velocityData) {
            velocityData.totalQuantitySold += item.quantity
            velocityData.salesCount += 1
            
            // Track most recent sale date
            if (!velocityData.lastSaleDate || sale.timestamp > velocityData.lastSaleDate) {
              velocityData.lastSaleDate = sale.timestamp
            }
          }
        })
      })
      
      // Calculate suggestions based on velocity and stock levels
      const suggestions = []
      
      productVelocity.forEach((velocityData, productId) => {
        const { product, totalQuantitySold, salesCount } = velocityData
        
        // Skip products that haven't been sold recently
        if (totalQuantitySold === 0) return
        
        // Calculate average daily velocity
        const averageDailyVelocity = totalQuantitySold / daysToAnalyze
        velocityData.averageDailyVelocity = averageDailyVelocity
        
        // Estimate days until stock runs out at current velocity
        const daysUntilStockOut = averageDailyVelocity > 0 
          ? product.stockLevel / averageDailyVelocity 
          : Infinity
        
        // Determine if reorder is needed
        const shouldReorder = (
          product.stockLevel <= product.lowStockThreshold ||
          daysUntilStockOut <= 14 // Stock will run out in 2 weeks
        )
        
        if (shouldReorder) {
          // Calculate suggested reorder quantity
          // Base on 30-45 days of stock at current velocity
          const suggestedDays = 35
          const baseQuantity = Math.ceil(averageDailyVelocity * suggestedDays)
          const minOrderQuantity = product.lowStockThreshold * 2
          const suggestedQuantity = Math.max(baseQuantity, minOrderQuantity)
          
          // Determine priority based on urgency
          let priority = 'medium'
          if (product.stockLevel === 0) {
            priority = 'high'
          } else if (daysUntilStockOut <= 7) {
            priority = 'high'
          } else if (daysUntilStockOut <= 14) {
            priority = 'medium'
          } else {
            priority = 'low'
          }
          
          suggestions.push({
            product,
            velocity: averageDailyVelocity,
            daysUntilStockOut,
            suggestedQuantity,
            priority,
            salesCount,
            totalQuantitySold
          })
        }
      })
      
      // Sort by priority and urgency
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      suggestions.sort((a, b) => {
        // First by priority
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        // Then by days until stock out (ascending - most urgent first)
        return a.daysUntilStockOut - b.daysUntilStockOut
      })
      
      return suggestions
    } catch (error) {
      throw new Error('Failed to calculate reorder suggestions: ' + error.message)
    }
  }
}