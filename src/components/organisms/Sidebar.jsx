import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Purchase Orders', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Sales', href: '/sales', icon: 'TrendingUp' },
    { name: 'Reports', href: '/reports', icon: 'FileText' },
  ]
  
  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href
    
    return (
      <NavLink
        to={item.href}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`
        }
      >
        <ApperIcon name={item.icon} size={20} className="mr-3" />
        {item.name}
      </NavLink>
    )
  }
  
  // Desktop Sidebar (Static)
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 shadow-sm">
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="Store" size={24} className="text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-slate-900">StockWise</h1>
              <p className="text-xs text-slate-500">Inventory Management</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            © 2024 StockWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
  
  // Mobile Sidebar (Overlay)
  const MobileSidebar = () => (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900 bg-opacity-50"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl"
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <ApperIcon name="Store" size={20} className="text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-slate-900">StockWise</h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              <ApperIcon name="X" size={20} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </motion.div>
    </>
  )
  
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}

export default Sidebar