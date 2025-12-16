import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Clock, User, Building, CreditCard, ExternalLink } from 'lucide-react';
import { withdrawalAPI, getSessionToken } from '../services/api';
import cacheService from '../services/cache';

const WithdrawalModal = ({ isOpen, onClose, dashboardData, onWithdraw }) => {
  const [step, setStep] = useState('amount'); // amount, confirm, pin, success
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pinError, setPinError] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setPin('');
      setError('');
      setPinError('');
      setIsProcessing(false);

      // Set auth token
      const token = getSessionToken();
      if (token) {
        withdrawalAPI.setToken(token);
      }
    }
  }, [isOpen]);

  // Real-time PIN validation
  useEffect(() => {
    if (pin && (pin.length !== 4 || !/^\d+$/.test(pin))) {
      setPinError('PIN must be a 4-digit number');
    } else {
      setPinError('');
    }
  }, [pin]);

  // Prefer canonical spending account fields across responses
  const resolveSpendingBalance = (data) => {
    if (!data) return 0;
    if (typeof data.user?.spending_account_balance === 'number') return data.user.spending_account_balance;
    if (data.user?.spending_account_balance) return parseFloat(data.user.spending_account_balance) || 0;
    if (typeof data.investment?.spending_balance === 'number') return data.investment.spending_balance;
    if (data.investment?.spending_balance) return parseFloat(data.investment.spending_balance) || 0;
    if (typeof data.due_dates?.amount_due === 'number') return data.due_dates.amount_due;
    if (data.due_dates?.amount_due) return parseFloat(data.due_dates.amount_due) || 0;
    if (typeof data.investment?.total_due === 'number') return data.investment.total_due;
    if (data.investment?.total_due) return parseFloat(data.investment.total_due) || 0;
    if (Array.isArray(data.investments) && data.investments[0]) {
      const inv = data.investments[0];
      if (typeof inv.spending_balance === 'number') return inv.spending_balance;
      if (inv.spending_balance) return parseFloat(inv.spending_balance) || 0;
      if (typeof inv.total_due === 'number') return inv.total_due;
      if (inv.total_due) return parseFloat(inv.total_due) || 0;
    }
    // If we still don't have a positive value, try cached dashboard snapshot
    const cached = cacheService.getDashboardData();
    if (cached && cached !== data) {
      // Try same resolution on cached object
      const cachedResolved = resolveSpendingBalance(cached);
      if (cachedResolved) return cachedResolved;
    }

    return 0;
  };

  const handleAmountSubmit = () => {
    const amountValue = parseFloat(amount);

    if (!amountValue || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // spendingBalance resolved below

    const spendingBalance = resolveSpendingBalance(dashboardData);

    if (amountValue > spendingBalance) {
      setError('Withdrawal amount cannot be higher than spending account balance');
      return;
    }

    // Check if investor has required bank details
    const investor = dashboardData?.investments?.[0];
    if (!investor?.bank_name || !investor?.bank_account_number) {
      setError('Bank details are missing. Please contact support.');
      return;
    }

    setError('');
    setStep('confirm');
  };

  const handleConfirmSubmit = () => {
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    // Final PIN validation
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setPinError('Please enter a valid 4-digit PIN');
      return;
    }

    setIsProcessing(true);
    setError('');
    setPinError('');

    try {
      const result = await withdrawalAPI.requestWithdrawal(parseFloat(amount), pin);
      if (result.success) {
        // Call the parent's onWithdraw function to handle UI updates
        if (onWithdraw) {
          await onWithdraw(parseFloat(amount), pin);
        }

        // Set transaction details for success view
        const investorDetails = getInvestorDetails();
        setTransactionDetails({
          id: result.transaction_id || 'PENDING',
          amount: parseFloat(amount),
          fee: 500,
          bank_name: investorDetails.bank_name,
          account_number: investorDetails.bank_account_number,
          date: new Date().toLocaleDateString()
        });

        // Move to success step
        setStep('success');
      } else {
        // Use setPinError for PIN-related errors so they appear under the input
        setPinError(result.message || result.error || 'Failed to process withdrawal');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      if (err.message) {
        setPinError(err.message);
      } else {
        setPinError('Failed to process withdrawal. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('amount');
    } else if (step === 'pin') {
      setStep('confirm');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  const getInvestorDetails = () => {
    // we'll use data from dashboard
    return {
      full_name: dashboardData?.user?.full_name || `${dashboardData?.user?.first_name || ''} ${dashboardData?.user?.surname || ''}`.trim(),
      bank_name: dashboardData?.investments?.[0]?.bank_name || 'N/A',
      bank_account_number: dashboardData?.investments?.[0]?.bank_account_number || '****',
      account_number: dashboardData?.investment?.primary_account || '****'
    };
  };

  if (!isOpen) return null;

  const investorDetails = getInvestorDetails();
  // Use spending account balance instead of amount due
  const spendingBalance = resolveSpendingBalance(dashboardData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 transform transition-all duration-300 ease-out scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {step === 'amount' && 'Withdraw Returns'}
              {step === 'confirm' && 'Confirm Withdrawal'}
              {step === 'pin' && 'Enter PIN'}
              {step === 'success' && 'Withdrawal Successful'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'amount' && 'Enter the amount you want to withdraw'}
              {step === 'confirm' && 'Please confirm your bank details'}
              {step === 'pin' && 'Enter your 4-digit PIN to authorize'}
              {step === 'success' && 'Your withdrawal request has been submitted'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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

        {step === 'amount' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="0.00"
                  disabled={isProcessing}
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">NGN</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Available in Spending Account:</span>
                <span className="font-medium text-gray-700">{formatCurrency(spendingBalance)}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Processing Fee</p>
                  <p className="text-sm text-blue-700 mt-1">
                    A processing fee of ₦500 will be deducted from your withdrawal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAmountSubmit}
                disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount to Withdraw</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Processing Fee</span>
                <span className="text-gray-900">₦500</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Total Deducted</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(parseFloat(amount) + 500)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Bank Details</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="font-medium text-gray-900">{investorDetails.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-medium text-gray-900">{investorDetails.bank_name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium text-gray-900">{investorDetails.bank_account_number}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Important</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please verify that these are the correct bank details. If not, please contact support.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isProcessing}
              >
                Confirm Details
              </button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Enter Your PIN</h3>
              <p className="mt-2 text-sm text-gray-500">
                Enter your 4-digit PIN to authorize this withdrawal
              </p>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                4-Digit PIN
              </label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className={`block w-full text-center text-2xl tracking-widest py-3 border rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 ${pinError ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="••••"
                disabled={isProcessing}
              />
              {pinError && (
                <p className="mt-1 text-sm text-red-600">{pinError}</p>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Processing Fee</p>
                  <p className="text-sm text-blue-700 mt-1">
                    A processing fee of ₦500 will be deducted from your withdrawal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 4 || isProcessing || !!pinError}
                className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
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
                  'Confirm Withdrawal'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && transactionDetails && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request Submitted</h3>
              <p className="text-sm text-gray-500 mt-2">
                Your withdrawal request has been successfully submitted for processing.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Transaction ID</span>
                <span className="text-sm font-mono font-medium text-gray-900">{transactionDetails.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(transactionDetails.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Fee</span>
                <span className="text-sm text-gray-900">{formatCurrency(transactionDetails.fee)}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Bank</span>
                <span className="text-sm font-medium text-gray-900">{transactionDetails.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Account</span>
                <span className="text-sm font-medium text-gray-900">{transactionDetails.account_number}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Processing Time</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Funds typically arrive within 24-48 hours after admin approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Done
              </button>

              <a
                href="/customer-care"
                className="flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  window.location.href = '/customer-care';
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;