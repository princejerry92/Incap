import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { dashboardAPI } from '../services/api';

const RenewModal = ({ isOpen, onClose, dashboardData, onRenew }) => {
  const [step, setStep] = useState('choice'); // choice, endConfirm, renewConfirm, processing
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleEndInvestment = () => {
    setStep('endConfirm');
  };

  const handleRenew = () => {
    setStep('renewConfirm');
  };

  const confirmEndInvestment = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const result = await dashboardAPI.fetchWithAuth('/dashboard/end-investment', {
        method: 'POST',
        body: JSON.stringify({
          investor_id: dashboardData?.investments?.[0]?.investor_id
        })
      });
      if (result.success) {
        await onRenew('end');
      } else {
        setError(result.message || result.error || 'Failed to end investment');
      }
    } catch (err) {
      if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to end investment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRenew = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const result = await dashboardAPI.fetchWithAuth('/dashboard/renew-investment', {
        method: 'POST',
        body: JSON.stringify({
          investor_id: dashboardData?.investments?.[0]?.investor_id
        })
      });
      if (result.success) {
        await onRenew('renew');
      } else {
        setError(result.message || result.error || 'Failed to renew investment');
      }
    } catch (err) {
      if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to renew investment. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'endConfirm' || step === 'renewConfirm') {
      setStep('choice');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  const getInvestmentDetails = () => {
    return {
      initial_investment: dashboardData?.investments?.[0]?.initial_investment || 0,
      investment_type: dashboardData?.investments?.[0]?.investment_type || 'N/A',
      portfolio_type: dashboardData?.investments?.[0]?.portfolio_type || 'N/A'
    };
  };

  if (!isOpen) return null;

  const investmentDetails = getInvestmentDetails();
  const forfeitureAmount = investmentDetails.initial_investment * 0.25;
  const remainingAmount = investmentDetails.initial_investment - forfeitureAmount;
  
  // For renewal: 20% service fee
  const serviceFee = investmentDetails.initial_investment * 0.20;
  const amountAfterFee = investmentDetails.initial_investment - serviceFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg transform transition-all duration-300 ease-out scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {step === 'choice' && 'Renew Investment'}
              {step === 'endConfirm' && 'End Investment'}
              {step === 'renewConfirm' && 'Renew Investment'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'choice' && 'Choose how you want to proceed with your investment'}
              {step === 'endConfirm' && 'Confirm ending your investment'}
              {step === 'renewConfirm' && 'Confirm renewing your investment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-600"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        {step === 'choice' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Current Investment</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(investmentDetails.initial_investment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Investment Type</span>
                <span className="font-medium text-gray-900">
                  {investmentDetails.investment_type}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleEndInvestment}
                className="w-full flex items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">End Investment</p>
                  <p className="text-sm text-gray-600">Receive 75% of initial deposit in spending account</p>
                </div>
              </button>
              <button
                onClick={handleRenew}
                className="w-full flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Renew Investment</p>
                  <p className="text-sm text-gray-600">Pay 20% service fee and start new service with remaining amount</p>
                </div>
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        )}
        {step === 'endConfirm' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">End Investment</h3>
              <p className="mt-2 text-sm text-gray-600">
                You're about to end your investment and receive funds in your spending account.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Initial Investment</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(investmentDetails.initial_investment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Forfeiture (25%)</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(forfeitureAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Amount to Spending Account</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Important</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This action cannot be undone. Your investment records will be marked as ended.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-4 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                onClick={confirmEndInvestment}
                disabled={isProcessing}
                className="flex-1 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'End Investment'
                )}
              </button>
            </div>
          </div>
        )}
        {step === 'renewConfirm' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <RefreshCw className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Renew Investment</h3>
              <p className="mt-2 text-sm text-gray-600">
                You're about to renew your investment and start afresh with a service fee deduction.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Initial Investment</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(investmentDetails.initial_investment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Service Fee (20%)</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(serviceFee)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Amount for New Investment</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(amountAfterFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Investment Type</span>
                <span className="font-medium text-gray-900">
                  {investmentDetails.investment_type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Portfolio Type</span>
                <span className="font-medium text-gray-900">
                  {investmentDetails.portfolio_type}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">What happens when you renew?</p>
                  <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                    <li>20% service fee is deducted from your initial investment</li>
                    <li>Investment records are cleared</li>
                    <li>Remaining amount is available for new investment</li>
                    <li>You'll select a new investment type</li>
                    <li>Transaction history will show renewal</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-4 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                onClick={confirmRenew}
                disabled={isProcessing}
                className="flex-1 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Renew Investment'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenewModal;