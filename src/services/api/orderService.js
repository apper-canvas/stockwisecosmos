import ordersData from '@/services/mockData/purchaseOrders.json'

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let orders = [...ordersData]

export const orderService = {
  async getAll() {
    await delay(350)
    return orders.map(order => ({
      ...order,
      orderDate: new Date(order.orderDate)
    }))
  },

  async getById(id) {
    await delay(200)
    const order = orders.find(o => o.Id === parseInt(id))
    if (!order) {
      throw new Error('Order not found')
    }
    return {
      ...order,
      orderDate: new Date(order.orderDate)
    }
  },

  async create(orderData) {
    await delay(500)
    const maxId = Math.max(...orders.map(o => o.Id), 0)
    const newOrder = {
      Id: maxId + 1,
      ...orderData,
      orderDate: new Date(),
      status: 'Pending',
      totalAmount: orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }
    orders.push(newOrder)
    return { ...newOrder }
  },

  async update(id, updates) {
    await delay(400)
    const index = orders.findIndex(o => o.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Order not found')
    }
    
    const updatedOrder = {
      ...orders[index],
      ...updates,
      Id: parseInt(id)
    }
    
    if (updates.items) {
      updatedOrder.totalAmount = updates.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }
    
    orders[index] = updatedOrder
    return { ...updatedOrder }
  },

  async delete(id) {
    await delay(300)
    const index = orders.findIndex(o => o.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Order not found')
    }
    
    const deleted = orders.splice(index, 1)[0]
    return { ...deleted }
  },

  async updateStatus(id, status) {
    await delay(250)
    const index = orders.findIndex(o => o.Id === parseInt(id))
    if (index === -1) {
      throw new Error('Order not found')
    }
    
    orders[index].status = status
    return { ...orders[index] }
  },

  async getPending() {
    await delay(200)
    return orders.filter(o => o.status === 'Pending').map(o => ({
      ...o,
      orderDate: new Date(o.orderDate)
    }))
  }
}