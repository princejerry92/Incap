import React, { useState } from 'react';
import { DollarSign, CreditCard, X } from 'lucide-react';
import { topupAPI } from '../services/api';

const TopUpModal = ({ isOpen, onClose, onSuccess, dashboardData }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('amount'); // amount, confirm, processing
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAmountSubmit = () => {
    const amountValue = Number(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amountValue < 1000) {
      setError('Minimum top-up amount is ₦1,000');
      return;
    }
    setStep('confirm');
    setError('');
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      setError('');
      const data = await topupAPI.initiateTopUp(parseFloat(amount));
      if (data.success) {
        if (data.paystack_url) {
          window.location.href = data.paystack_url;
        } else {
          onSuccess(parseFloat(amount));
          onClose();
        }
      } else {
        setError(data.error || 'Failed to initiate top-up');
      }
    } catch (err) {
      // Extract the detailed error message from the API error
      const errorMessage = err.message || 'Failed to process top-up request';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Top Up Investment</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {step === 'amount' && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top-up Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-700 font-medium">₦</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setAmount(raw);
                  }}
                  className="block w-full pl-8 pr-12 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 text-lg bg-white text-gray-900"
                  placeholder="0"
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Minimum amount: ₦1,000
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Current Investment</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(dashboardData?.investment?.total_balance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">After Top-up</span>
                <span className="font-bold text-green-600">
                  {(() => {
                    const amountNumber = Number(amount) || 0;
                    return formatCurrency((dashboardData?.investment?.total_balance || 0) + amountNumber);
                  })()}
                </span>
              </div>
            </div>
            <button
              onClick={handleAmountSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 shadow-sm"
            >
              Continue
            </button>
          </div>
        )}
        {step === 'confirm' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Top-up</h4>
              <p className="text-gray-600 mb-4">You're about to add {formatCurrency(Number(amount) || 0)} to your investment.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Top-up Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(Number(amount) || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900">Paystack</span>
              </div>
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 py-4 border-2 border-gray-300 text-gray-900 rounded-xl font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 shadow-sm"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
