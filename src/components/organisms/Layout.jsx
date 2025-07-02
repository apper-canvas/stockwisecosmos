import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/organisms/Sidebar'
import Header from '@/components/organisms/Header'
import Dashboard from '@/components/pages/Dashboard'
import Inventory from '@/components/pages/Inventory'
import Orders from '@/components/pages/Orders'
import Sales from '@/components/pages/Sales'
import Reports from '@/components/pages/Reports'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      <div className="lg:ml-64">
        <Header 
          onMenuClick={handleMenuClick}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="px-4 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory searchValue={searchValue} />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default Layout