import React from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/atoms/Card'

const Loading = ({ type = 'default' }) => {
  if (type === 'table') {
    return (
      <div className="space-y-4">
        {/* Table header skeleton */}
        <Card padding="sm">
          <div className="flex space-x-4">
            <div className="h-4 bg-slate-200 rounded w-1/4 animate-shimmer"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
          </div>
        </Card>
        
        {/* Table rows skeleton */}
        {[...Array(8)].map((_, index) => (
          <Card key={index} padding="sm">
            <div className="flex space-x-4 items-center">
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-shimmer"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6 animate-shimmer"></div>
              <div className="h-6 bg-slate-200 rounded-full w-16 animate-shimmer"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }
  
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} padding="default">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-shimmer"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 animate-shimmer"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3 animate-shimmer"></div>
              </div>
              <div className="w-12 h-12 bg-slate-200 rounded-lg animate-shimmer"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }
  
  if (type === 'form') {
    return (
      <Card padding="default">
        <div className="space-y-6">
          <div className="h-6 bg-slate-200 rounded w-1/4 animate-shimmer"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3 animate-shimmer"></div>
                <div className="h-10 bg-slate-200 rounded animate-shimmer"></div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <div className="h-10 bg-slate-200 rounded w-20 animate-shimmer"></div>
            <div className="h-10 bg-slate-200 rounded w-24 animate-shimmer"></div>
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary-300 rounded-full animate-spin animation-delay-150"></div>
      </div>
      <p className="mt-4 text-slate-600 font-medium">Loading...</p>
    </motion.div>
  )
}

export default Loading