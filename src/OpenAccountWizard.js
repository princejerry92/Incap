import React, { useState, useEffect } from 'react';
import { Check, User, Building, Shield, CheckCircle, Info, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import './global-styles.css';
import { useNavigate } from 'react-router-dom'; 

const AccountWizard = () => {
  const navigate = useNavigate();

  const handledpaystack = () => {
    navigate('/paystack-checkout');
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState(50000);
  const [selectedInvestment, setSelectedInvestment] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    pin: '',
    confirmPin: ''
  });

  const amounts = [10000, 25000, 50000, 100000, 250000, 500000];

  const investmentTypes = [
    {
      type: 'Conservative Portfolio',
      returns: '8-12%',
      risk: 'Low',
      duration: '6-12 months',
      description: 'Government bonds and blue-chip stocks',
      color: 'bg-gray-100 border-green-200'
    },
    {
      type: 'Balanced Portfolio',
      returns: '12-18%',
      risk: 'Medium',
      duration: '1-3 years',
      description: 'Mixed equities and fixed income',
      color: 'bg-gray-100 border-green-200'
    },
    {
      type: 'Growth Portfolio',
      returns: '18-25%',
      risk: 'High',
      duration: '3-5 years',
      description: 'High-growth stocks and emerging markets',
      color: 'bg-gray-100 border-green-200'
    }
  ];

  const steps = [
    { 
      title: 'Investment Details', 
      icon: User, 
      description: 'Choose your investment amount and type'
    },
    { 
      title: 'Bank Information', 
      icon: Building, 
      description: 'Link your bank account for transactions'
    },
    { 
      title: 'Security Setup', 
      icon: Shield, 
      description: 'Create your secure transaction PIN'
    },
    { 
      title: 'Account Ready', 
      icon: CheckCircle, 
      description: 'Your investment account is now active'
    }
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (currentStep === steps.length - 2) {
      const newAccNum = `INV${Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 8)}`;
      setAccountNumber(newAccNum);
    }
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return selectedInvestment !== '';
      case 1:
        return formData.bankName && formData.accountName && formData.accountNumber;
      case 2:
        return formData.pin.length === 4 && formData.pin === formData.confirmPin;
      default:
        return true;
    }
  };

  const StepInvestmentDetails = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h4 className="text-2xl font-semibold text-green-900 mb-2">Let's start your investment journey</h4>
        <p className="text-gray-600">Choose your initial investment amount and portfolio type</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Investment Amount</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-gray-300">
          {amounts.map((amt) => (
            <button
              key={amt}
              className={` action-btn:hover p-4 rounded-xl border-2 transition-all duration-200 ${
                amt === amount 
                  ? 'border-style  text-gray-700' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setAmount(amt)}
            >
              <div className="font-semibold">₦{amt.toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Choose Investment Type</label>
        <div className="space-y-3">
          {investmentTypes.map((investment) => (
            <div
              key={investment.type}
              className={`p-4 card-container2 neumorphic neumorphic-inset rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedInvestment === investment.type
                  ? 'border-style bg-gray-100'
                  : `${investment.color} hover:border-gray-300`
              }`}
              onClick={() => setSelectedInvestment(investment.type)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-green-700">{investment.type}</h3>
                    {selectedInvestment === investment.type && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{investment.description}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600 font-medium">Returns: {investment.returns}</span>
                    <span className="text-gray-500">Risk: {investment.risk}</span>
                    <span className="text-gray-500">Duration: {investment.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const StepBankInfo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="h2 text-green-700 mb-2">Link your bank account</h2>
        <p className="text-gray-600">We'll use this account for deposits and withdrawals</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
          <select 
            className="w-full p-3 input-field input-field:focus text-gray-700"
            value={formData.bankName}
            onChange={(e) => updateFormData('bankName', e.target.value)}
            autoFocus="true"
          >
            <option value="">Select your bank</option>
            <option value="Access Bank">Access Bank</option>
            <option value="GTBank">GTBank</option>
            <option value="First Bank">First Bank</option>
            <option value="UBA">UBA</option>
            <option value="Zenith Bank">Zenith Bank</option>
            <option value="Fidelity Bank">Fidelity Bank</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
          <input
            type="text"
            placeholder="Enter account holder name"
            className="w-full p-3 input-field input-field:focus text-gray-700 border border-gray-300"
            value={formData.accountName}
            onChange={(e) => updateFormData('accountName', e.target.value)}
            autoFocus="true"
          />
          <p className="text-xs text-gray-500 mt-1">Must match your NIN/BVN records</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
          <input
            type="text"
            placeholder="10-digit account number"
            maxLength="10"
            className="w-full p-3 input-field input-field:focus text-gray-700"
            value={formData.accountNumber}
            onChange={(e) => updateFormData('accountNumber', e.target.value.replace(/\D/g, ''))}
            autoFocus="true"
          />
        </div>

        <div className="stylish-card rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-700">Account Verification</h4>
              <p className="text-sm text-gray-700 mt-1">
                We'll verify your account details with your bank for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StepSecurityInfo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-green-700 mb-2">Secure your account</h2>
        <p className="text-gray-600">Create a 4-digit PIN for transaction authorization</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction PIN</label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              placeholder="Enter 4-digit PIN"
              maxLength="4"
              className="w-full p-3 pr-10 input-field input-field:focus text-gray-700 text-center text-xl tracking-widest"
              value={formData.pin}
              onChange={(e) => updateFormData('pin', e.target.value.replace(/\D/g, ''))}
              autoFocus="true"

            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff className="w-5 h-5 green-400" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm PIN</label>
          <div className="relative">
            <input
              type={showConfirmPin ? "text" : "password"}
              placeholder="Re-enter PIN"
              maxLength="4"
              className="w-full p-3 pr-10 input-field input-field:focus text-gray-700 text-center text-xl tracking-widest"
              value={formData.confirmPin}
              onChange={(e) => updateFormData('confirmPin', e.target.value.replace(/\D/g, ''))}
              autoFocus="false"

            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
            >
              {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPin && formData.pin !== formData.confirmPin && (
            <p className="text-sm text-red-600 mt-1">PINs do not match</p>
          )}
        </div>

        <div className="border-style rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">PIN Security Tips</h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Never share your PIN with anyone</li>
                <li>• Avoid using obvious numbers like 1234 or your birth year</li>
                <li>• You can change your PIN anytime in settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StepConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Account Created Successfully!</h2>
        <p className="text-gray-600">Welcome to your investment journey</p>
      </div>

    <div className="bg-gray-50 rounded-xl p-6"> 
        <div className="space-y-4"> 
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600">Account Number:</span>
            <span className="text-gray-600 font-semibold">{accountNumber}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600">Initial Investment:</span>
            <span className="text-blue-600 font-semibold">₦{amount.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600">Portfolio Type:</span>
            <span className="text-yellow-600 font-semibold">{selectedInvestment}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-600 ">Status:</span>
            <span className="card-text-light font-semibold ">Active</span>
          </div>
        </div>
      </div>

      <div className="stylish-card  border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">Next Steps</h4>
        <ul className="text-sm text-gray-700 space-y-1 text-left">
          <li>• Fund your account to start investing</li>
          <li>• Set up automatic investments</li>
          <li>• Track your portfolio performance</li>
          <li>• Enable notifications for updates</li>
        </ul>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepInvestmentDetails />;
      case 1: return <StepBankInfo />;
      case 2: return <StepSecurityInfo />;
      case 3: return <StepConfirmation />;
      default: return null;
    }
  };

  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className=" md:text-3xl sm:text-sm md:font-bold text-green-900 mb-2">Open Investment Account</h2>
          <p className="text-gray-600">Get started with professional investment management</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    index < currentStep 
                      ? 'bg-green-500 text-white' 
                      : index === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500 hidden md:block">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block absolute h-0.5 w-24 mt-5 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} style={{ marginLeft: '6rem' }} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isStepValid()
                  ? 'btn-primary text-white btn-primary:hover'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                handledpaystack(); // Navigate to payment page
              }}
              className="flex items-center gap-1 md:gap-2 px-4 md:px-4 py-2 md:py-3 btn-primary btn-primary:hover text-white rounded-xl font-medium hover:bg-green-700 transition-all"            >
              Proceed to Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountWizard;