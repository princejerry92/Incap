import React, { useState } from 'react';
import { Check, CreditCard, Shield, Lock, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './global-styles.css';

// --- Helper Components Moved Outside ---

const PaymentForm = ({
  orderData,
  formData,
  updateFormData,
  paymentMethod,
  setPaymentMethod,
  handlePayment,
  getCardType
}) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="text-center pb-6 border-b border-gray-700">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Secured by Paystack</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Complete your payment</h3>
      <p className="text-yellow-600 text-sm mt-1">Your payment information is encrypted and secure</p>
    </div>

    {/* Order Summary */}
    <div className="card-container2 border-yellow-800 rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{orderData.merchant}</h3>
          <p className="text-sm text-gray-600">{orderData.items[0].name}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-green-600 text-lg">₦{orderData.amount.toLocaleString()}</p>
          <p className="text-xs text-gray-600">Ref: {orderData.reference}</p>
        </div>
      </div>
    </div>

    {/* Payment Methods */}
    <div>
      <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          className={`p-3 rounded-lg border-2 transition-all ${
            paymentMethod === 'card' 
              ? 'border-style bg-[#cae87e]' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setPaymentMethod('card')}
        >
          <CreditCard className="w-5 h-5 mx-auto mb-1 text-gray-700" />
          <span className="text-xs text-gray-600 font-medium">Card</span>
        </button>
        <button
          className={`p-3 rounded-lg border-2 text-gray-600 transition-all ${
            paymentMethod === 'transfer' 
              ? 'border-style bg-[#cae87e]' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setPaymentMethod('transfer')}
        >
          <div className="w-5 h-5 mx-auto mb-1 bg-gray-400 rounded"></div>
          <span className="text-xs text-gray-600 font-medium">Transfer</span>
        </button>
        <button
          className={`p-3 rounded-lg border-2 transition-all text-gray-600 ${
            paymentMethod === 'ussd' 
              ? 'border-style bg-[#cae87e]' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setPaymentMethod('ussd')}
        >
          <div className="w-5 h-5 mx-auto mb-1 bg-gray-400 rounded-full"></div>
          <span className="text-xs font-medium">USSD</span>
        </button>
      </div>
    </div>

    {/* Card Form */}
    {paymentMethod === 'card' && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-600 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
          <div className="relative">
            <input
              type="text"
              value={formData.cardNumber}
              onChange={(e) => updateFormData('cardNumber', e.target.value)}
              className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs font-medium text-gray-500">
                {getCardType(formData.cardNumber)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <input
              type="text"
              value={formData.expiryDate}
              onChange={(e) => updateFormData('expiryDate', e.target.value)}
              className="w-full text-gray-600 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="MM/YY"
              maxLength="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
            <input
              type="password"
              value={formData.cvv}
              onChange={(e) => updateFormData('cvv', e.target.value.replace(/\D/g, ''))}
              className="w-full p-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123"
              maxLength="4"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
          <input
            type="text"
            value={formData.cardName}
            onChange={(e) => updateFormData('cardName', e.target.value)}
            className="w-full text-gray-600 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="saveCard"
            checked={formData.saveCard}
            onChange={(e) => updateFormData('saveCard', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="saveCard" className="text-sm text-gray-700">
            Save this card for future payments
          </label>
        </div>
      </div>
    )}

    {/* Transfer Instructions */}
    {paymentMethod === 'transfer' && (
      <div className="bg-gray-200 border-style border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Bank Transfer</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Account Name:</span>
            <span className="font-medium">Paystack-TechStore</span>
          </div>
          <div className="flex justify-between">
            <span>Account Number:</span>
            <span className="font-medium">0123456789</span>
          </div>
          <div className="flex justify-between">
            <span>Bank:</span>
            <span className="font-medium">Wema Bank</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">₦{orderData.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    )}

    {/* USSD Instructions */}
    {paymentMethod === 'ussd' && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">USSD Payment</h4>
        <p className="text-sm text-green-800 mb-3">
          Dial the code below from your registered phone number:
        </p>
        <div className="bg-[#cae87e] rounded p-3 text-center">
          <span className="text-lg font-mono font-bold">*737*000*{orderData.amount}#</span>
        </div>
      </div>
    )}

    {/* Security Notice */}
    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
      <Lock className="w-4 h-4" />
      <span>Your payment is protected by 256-bit SSL encryption</span>
    </div>

    {/* Action Buttons */}
    <div className="space-y-3 pt-4">
      <button
        onClick={handlePayment}
        disabled={!formData.email || (paymentMethod === 'card' && (!formData.cardNumber || !formData.expiryDate || !formData.cvv))}
        className="w-full btn-primary btn-primary:hover text-gray-600 py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
      >
        Pay ₦{orderData.amount.toLocaleString()}
      </button>
      
      <button className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4 inline mr-1" />
        Return to merchant
      </button>
    </div>
  </div>
);

const ProcessingScreen = ({ orderData, paymentMethod }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-[#cae87e] rounded-full flex items-center justify-center mx-auto mb-6">
      <Loader className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your payment</h2>
    <p className="text-gray-600 mb-6">Please don't close this window or navigate away</p>
    
    <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Amount:</span>
        <span className="font-medium text-gray-600">₦{orderData.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Reference:</span>
        <span className="font-mono text-xs text-gray-600">{orderData.reference}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Method:</span>
        <span className="font-medium capitalize text-gray-600">{paymentMethod}</span>
      </div>
    </div>
  </div>
);

const SuccessScreen = ({ orderData, paymentMethod, onContinue }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-8 h-8 text-green-600" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
    <p className="text-gray-600 mb-6">Your payment has been processed successfully</p>
    
    <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto mb-8">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Transaction ID:</span>
          <span className="font-mono text-sm">{orderData.reference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount Paid:</span>
          <span className="font-semibold text-green-600">₦{orderData.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium capitalize">{paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className="text-green-600 font-medium">Completed</span>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <button 
        onClick={onContinue}
        className="w-full btn-primary btn-primary:hover btn-accent text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
      >
        Continue to Dashboard
      </button>
      
      <button className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors">
        Download Receipt
      </button>
    </div>
  </div>
);


const PaystackCheckout = () => {
  const navigate = useNavigate();

  const handledashboard = () => {
    navigate('/dashboard');
  };
  
  const [currentStep, setCurrentStep] = useState(0); // 0: payment, 1: processing, 2: success
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    email: 'john.doe@example.com',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    saveCard: false
  });

  // Mock order data
  const orderData = {
    merchant: 'Incap Fx',
    amount: 45000,
    currency: 'NGN',
    reference: 'TS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    items: [
      { name: 'Conservative Portfolio', quantity: 1, price: 50000 }
    ]
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const updateFormData = (field, value) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const getCardType = (number) => {
    const num = number.replace(/\s/g, '');
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'Amex';
    return 'Card';
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setCurrentStep(1);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(2);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="cover p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded"></div>
            </div>
            <div>
              <h1 className="font-semibold">Paystack</h1>
              <p className="text-blue-100 text-sm">Secure Payment Gateway</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-gray-700">
          {currentStep === 0 && (
            <PaymentForm 
              orderData={orderData}
              formData={formData}
              updateFormData={updateFormData}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              handlePayment={handlePayment}
              getCardType={getCardType}
            />
          )}
          {currentStep === 1 && <ProcessingScreen orderData={orderData} paymentMethod={paymentMethod} />}
          {currentStep === 2 && <SuccessScreen orderData={orderData} paymentMethod={paymentMethod} onContinue={handledashboard} />}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackCheckout;
