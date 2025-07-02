import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Card from '@/components/atoms/Card'

const BarcodeScanner = ({ 
  onScanSuccess, 
  onScanError, 
  isActive, 
  onClose,
  className = '' 
}) => {
  const [scanner, setScanner] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)

  useEffect(() => {
    if (isActive && !scanner) {
      initializeScanner()
    } else if (!isActive && scanner) {
      cleanupScanner()
    }

    return () => {
      cleanupScanner()
    }
  }, [isActive])

  const initializeScanner = () => {
    try {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "barcode-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          supportedScanTypes: [
            Html5QrcodeScanner.SCAN_TYPE_CAMERA
          ]
        },
        false
      )

      html5QrcodeScanner.render(
        (decodedText) => {
          setIsScanning(false)
          setError('')
          onScanSuccess(decodedText)
          cleanupScanner()
        },
        (errorMessage) => {
          // Only show persistent errors, not scanning noise
          if (errorMessage.includes('NotAllowedError') || 
              errorMessage.includes('NotFoundError') ||
              errorMessage.includes('permission')) {
            setError('Camera access denied or not available')
            onScanError?.(errorMessage)
          }
        }
      )

      setScanner(html5QrcodeScanner)
      setIsScanning(true)
      setError('')
    } catch (err) {
      setError('Failed to initialize camera scanner')
      onScanError?.(err.message)
    }
  }

  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear()
      } catch (err) {
        console.warn('Scanner cleanup error:', err)
      }
      setScanner(null)
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    cleanupScanner()
    onClose()
  }

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          className="w-full max-w-md"
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <ApperIcon name="Camera" size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Barcode Scanner</h3>
                  <p className="text-sm text-slate-600">Point camera at product barcode</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon="X"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600"
              />
            </div>

            {error ? (
              <div className="text-center py-8">
                <div className="p-4 bg-red-50 rounded-lg mb-4">
                  <ApperIcon name="AlertCircle" size={24} className="text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-medium">Scanner Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setError('')
                    initializeScanner()
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div>
                <div 
                  id="barcode-scanner-container" 
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden bg-slate-100"
                  style={{ minHeight: '300px' }}
                />
                
                {isScanning && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-slate-600">Scanning for barcode...</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Position the barcode within the scanner frame
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BarcodeScanner