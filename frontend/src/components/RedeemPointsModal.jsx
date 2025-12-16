import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import referralAPI from '../services/referralAPI';

const RedeemPointsModal = ({ isOpen, onClose, redemptionData, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !redemptionData) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  const handleRedeem = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await referralAPI.redeemPoints(redemptionData.points);

      if (response.success) {
        setSuccess(true);
        // Call success callback after a delay to show success message
        setTimeout(() => {
          onSuccess && onSuccess(response.data);
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.error || 'Failed to redeem points');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while redeeming points');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Confirm Redemption</h3>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Redemption Successful!</h4>
            <p className="text-gray-600">
              {formatCurrency(redemptionData.cashValue)} has been added to your spending account.
            </p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && !success && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">Processing Redemption</h4>
            <p className="text-gray-600">Please wait while we process your request...</p>
          </div>
        )}

        {/* Main Content */}
        {!success && !isProcessing && (
          <>
            {/* Redemption Summary */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">₦</span>
                </div>
                Redemption Summary
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Points to Redeem:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{redemptionData.points}</span>
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">₦</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cash Value:</span>
                  <span className="font-bold text-green-600">{formatCurrency(redemptionData.cashValue)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Exchange Rate:</span>
                  <span className="text-xs text-gray-500">1 point = ₦500</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="space-y-1">
                    <li>• Redeemed points cannot be reversed</li>
                    <li>• Funds will be added to your spending account</li>
                    <li>• Processing may take up to 5 minutes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Redemption'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RedeemPointsModal;
