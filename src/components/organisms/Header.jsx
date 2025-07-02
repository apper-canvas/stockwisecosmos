import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/atoms/Button'
import SearchBar from '@/components/molecules/SearchBar'
import ApperIcon from '@/components/ApperIcon'

const Header = ({ onMenuClick, searchValue, onSearchChange }) => {
  return (
    <motion.header 
      className="lg:ml-64 bg-white border-b border-slate-200 px-4 lg:px-8 py-4 shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            icon="Menu"
            onClick={onMenuClick}
            className="lg:hidden"
          />
          
          {/* Page title */}
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your stock levels and sales efficiently
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="hidden md:block">
            <SearchBar
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, orders..."
              className="w-80"
            />
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon="Bell"
              className="relative"
            >
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2"></span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon="Settings"
            />
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header