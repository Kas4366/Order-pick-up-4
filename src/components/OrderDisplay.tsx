import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Box, Check, Volume2, VolumeX, Package, User, Hash, AlertTriangle } from 'lucide-react';
import { Order } from '../types/Order';
import { VoiceSettings } from '../types/VoiceSettings';
import { StockTrackingItem } from '../types/StockTracking';

interface OrderDisplayProps {
  order: Order;
  onOrderComplete?: (order: Order) => void;
  voiceSettings: VoiceSettings;
  onMarkForReorder: (order: Order) => void;
  stockTrackingItems: StockTrackingItem[];
  onUnmarkForReorder: (sku: string, markedDate: string) => void;
}

export const OrderDisplay: React.FC<OrderDisplayProps> = ({ 
  order, 
  onOrderComplete, 
  voiceSettings, 
  onMarkForReorder,
  stockTrackingItems,
  onUnmarkForReorder
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const speakTimeoutRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Check if current order is already tracked for reordering
  const currentTrackedItem = useMemo(() => {
    return stockTrackingItems.find(item => 
      item.sku === order.sku && 
      item.orderNumber === order.orderNumber
    );
  }, [stockTrackingItems, order.sku, order.orderNumber]);
  
  // Set the order's completed status
  useEffect(() => {
    setIsCompleted(order.completed || false);
    setImageError(false);
    setImageLoading(true);
  }, [order]);

  // Automatically read out the order details based on voice settings
  useEffect(() => {
    if (order && !isCompleted && voiceSettings.enabled) {
      speakOrderDetails();
    }
    
    return () => {
      if (speakTimeoutRef.current) {
        window.clearTimeout(speakTimeoutRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, [order, voiceSettings]);

  const speakOrderDetails = () => {
    if (!window.speechSynthesis || !voiceSettings.enabled) return;
    
    window.speechSynthesis.cancel();
    
    // Build text to speak based on selected fields
    const textParts: string[] = [];
    
    if (voiceSettings.fields.customerName) {
      textParts.push(`Customer ${order.customerName}`);
    }
    if (voiceSettings.fields.orderNumber) {
      textParts.push(`Order ${order.orderNumber}`);
    }
    if (voiceSettings.fields.sku) {
      textParts.push(`SKU ${order.sku}`);
    }
    if (voiceSettings.fields.quantity) {
      textParts.push(`Quantity ${order.quantity}`);
    }
    if (voiceSettings.fields.location) {
      textParts.push(`Location ${order.location}`);
    }
    
    if (textParts.length === 0) return; // Nothing to speak
    
    const textToSpeak = textParts.join('. ');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = voiceSettings.speed;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Add a slight delay before speaking
    speakTimeoutRef.current = window.setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 500);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      speakOrderDetails();
    }
  };

  const markAsCompleted = async () => {
    setIsCompleted(true);
    
    if (onOrderComplete) {
      try {
        await onOrderComplete(order);
      } catch (error) {
        // If the completion fails, revert the local state
        setIsCompleted(false);
      }
    } else {
      // Fallback for backward compatibility
      order.completed = true;
    }
  };

  const handleCheckboxChange = () => {
    if (currentTrackedItem) {
      // Item is already tracked, so unmark it
      onUnmarkForReorder(currentTrackedItem.sku, currentTrackedItem.markedDate);
    } else {
      // Item is not tracked, so mark it
      onMarkForReorder(order);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    console.log('✓ Image loaded successfully for order:', order.orderNumber);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.log('✗ Image failed to load for order:', order.orderNumber, 'URL:', order.imageUrl);
  };

  // Determine if quantity should flash (quantity > 1)
  const shouldFlash = order.quantity > 1;

  // Calculate stock status
  const getStockStatus = () => {
    if (order.remainingStock === undefined) return null;
    
    if (order.remainingStock < order.quantity) {
      return { status: 'insufficient', color: 'text-red-600', message: 'Insufficient stock!', bgColor: 'bg-red-50' };
    } else if (order.remainingStock <= 5) {
      return { status: 'low', color: 'text-orange-600', message: 'Low stock', bgColor: 'bg-orange-50' };
    } else if (order.remainingStock <= 10) {
      return { status: 'medium', color: 'text-yellow-600', message: 'Medium stock', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'good', color: 'text-green-600', message: 'Good stock', bgColor: 'bg-green-50' };
    }
  };

  const stockStatus = getStockStatus();
  const showLowStockWarning = stockStatus && (stockStatus.status === 'insufficient' || stockStatus.status === 'low');

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Order #{order.orderNumber}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">{order.customerName}</span>
              </div>
            </div>
            
            {order.buyerPostcode && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  Postcode: {order.buyerPostcode}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {voiceSettings.enabled && (
              <button
                onClick={toggleSpeaking}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={isSpeaking ? "Stop speaking" : "Speak order details"}
              >
                {isSpeaking ? (
                  <VolumeX className="h-5 w-5 text-gray-700" />
                ) : (
                  <Volume2 className="h-5 w-5 text-gray-700" />
                )}
              </button>
            )}
            
            <button
              onClick={markAsCompleted}
              disabled={isCompleted}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isCompleted 
                  ? 'bg-green-100 text-green-700 cursor-default' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Check className="h-4 w-4" />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="w-full bg-gray-100 rounded-lg overflow-hidden relative" style={{ minHeight: '400px', maxHeight: '600px' }}>
              {order.imageUrl && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <img 
                    ref={imageRef}
                    src={order.imageUrl} 
                    alt={`Product image for ${order.sku}`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Box className="h-20 w-20 mb-2" />
                  <p className="text-sm text-center px-4">
                    {imageError ? 'Image not found' : 'No image available'}
                  </p>
                  {imageError && order.imageUrl && (
                    <p className="text-xs text-gray-500 mt-1 px-4 text-center">
                      SKU: {order.sku}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Product Details</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium text-blue-700 mb-1">SKU</h5>
                  <p className="text-lg font-bold text-blue-900">{order.sku}</p>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-blue-700 mb-1">Quantity</h5>
                  <p className={`text-2xl font-bold text-red-600 ${shouldFlash ? 'animate-pulse' : ''}`}>
                    {order.quantity}
                  </p>
                </div>

                {/* Stock Information */}
                {order.remainingStock !== undefined && (
                  <div>
                    <h5 className="text-xs font-medium text-blue-700 mb-1">Stock Info</h5>
                    <div className="space-y-1">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Available:</span> {order.remainingStock}
                      </p>
                      {stockStatus && (
                        <div className={`p-2 rounded ${stockStatus.bgColor}`}>
                          <p className={`text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h4 className="text-sm font-medium text-green-800">Warehouse Location</h4>
              </div>
              
              <div className="inline-block bg-green-200 text-green-900 px-4 py-2 rounded-lg text-xl font-bold">
                {order.location}
              </div>
            </div>

            {/* Low Stock Warning - Only shown when stock is low */}
            {showLowStockWarning && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">Low Stock Alert</h4>
                    <p className="text-sm text-orange-700">
                      This item has low stock levels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mark for Reorder - Always visible */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentTrackedItem}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-800">
                  {currentTrackedItem ? 'Marked for reorder ✓' : 'Mark for reorder'}
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-2">
                Mark this item to track it for reordering later
              </p>
            </div>
            
            {order.additionalDetails && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
                <p className="text-gray-800 text-sm">{order.additionalDetails}</p>
              </div>
            )}
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 border-t pt-2">
                <p>Image URL: {order.imageUrl ? 'Available' : 'None'}</p>
                <p>Image Status: {imageLoading ? 'Loading' : imageError ? 'Error' : 'Loaded'}</p>
                <p>Buyer Postcode: {order.buyerPostcode || 'Not extracted'}</p>
                <p>Remaining Stock: {order.remainingStock !== undefined ? order.remainingStock : 'Not available'}</p>
                <p>Tracked for reorder: {currentTrackedItem ? 'Yes' : 'No'}</p>
                {order.selroOrderId && <p>Selro Order ID: {order.selroOrderId}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};