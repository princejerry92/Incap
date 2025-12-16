import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, User, Building, Shield, CheckCircle, Info, Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import './global-styles.css';
import { useNavigate } from 'react-router-dom';
import PaymentService from './paymentService';

// --- Constants Moved Outside Component ---
const amounts = [100000, 250000, 500000, 1000000, 2500000, 5000000];

// --- Tooltip Component ---
const InvestmentTooltip = ({ investment, isOpen, onClose, position, onMouseEnter, onMouseLeave }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Mobile Overlay - Full screen modal on mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-[9999] md:hidden"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Mobile Modal / Desktop Tooltip */}
      <div
        className="fixed z-[10000] w-auto md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={position ? {
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, 0)',
          zIndex: 99999
        } : {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '400px',
          maxHeight: '80vh',
          zIndex: 100000
        }}
      >
        <div className="p-3 md:p-4 max-h-[70vh] md:max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 text-sm">Available Investment Types</h4>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 md:p-0 rounded-lg md:rounded-none hover:bg-gray-100 md:hover:bg-transparent touch-manipulation"
              type="button"
            >
              <X className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(investment.details).map(([key, data]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border-2 bg-gradient-to-r ${investment.gradient} ${investment.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-bold text-sm ${investment.accent}`}>{key}</h5>
                  <div className={`px-2 py-1 rounded-lg bg-white ${investment.accent} font-bold text-xs`}>
                    {data.weekly_interest_rate}%
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Min. Balance:</span>
                    <div className={`font-bold ${investment.accent}`}>
                      ₦{data.minimum_balance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <div className={`font-bold ${investment.accent}`}>
                      {data.expiry_weeks} weeks
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Weekly Return:</span>
                    <span className={`ml-1 font-bold ${investment.accent}`}>
                      ₦{(data.minimum_balance * data.weekly_interest_rate / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Tap portfolio to select • Compare investment types
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// --- Enhanced Portfolio Data with Investment Details ---
const portfolioInvestmentData = {
  "Conservative Portfolio": {
    details: {
      "Gold Starter": {
        minimum_balance: 100000,
        expiry_weeks: 20,
        weekly_interest_rate: 5.0
      },
      "Gold Flair": {
        minimum_balance: 250000,
        expiry_weeks: 20,
        weekly_interest_rate: 5.0
      }
      // Real Estate and Agriculture are not available for Conservative portfolio
    },
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-600'
  },
  "Balanced Portfolio": {
    details: {
      "Gold Starter": {
        minimum_balance: 2500000,
        expiry_weeks: 12,
        weekly_interest_rate: 7.0
      },
      "Gold Flair": {
        minimum_balance: 5000000,
        expiry_weeks: 12,
        weekly_interest_rate: 7.0
      },
      "Gold Accent": {
        minimum_balance: 7500000,
        expiry_weeks: 12,
        weekly_interest_rate: 7.0
      }
      // Gold Luxury is not available for Balanced portfolio
    },
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    accent: 'text-blue-600'
  },
  "Growth Portfolio": {
    details: {
      "Gold Starter": {
        minimum_balance: 10000000,
        expiry_weeks: 10,
        weekly_interest_rate: 10.0
      },
      "Gold Flair": {
        minimum_balance: 12000000,
        expiry_weeks: 10,
        weekly_interest_rate: 10.0
      },
      "Gold Accent": {
        minimum_balance: 15000000,
        expiry_weeks: 10,
        weekly_interest_rate: 10.0
      },
      "Gold Luxury": {
        minimum_balance: 20000000,
        expiry_weeks: 10,
        weekly_interest_rate: 10.0
      }
    },
    gradient: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    accent: 'text-purple-600'
  }
};

const investmentTypes = [
  {
    type: 'Conservative Portfolio',
    returns: '5-7% weekly',
    risk: 'Low',
    duration: '3-4 months',
    description: 'Up to 40% of investment risk insured',
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-600'
  },
  {
    type: 'Balanced Portfolio',
    returns: '8-12% weekly',
    risk: 'Medium',
    duration: '3-6 months',
    description: 'Up to 20% of your investment insured ',
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    accent: 'text-blue-600'
  },
  {
    type: 'Growth Portfolio',
    returns: '18-25% weekly',
    risk: 'High',
    duration: '3-5 months',
    description: 'Aggressive Trades , No insurance on Investments',
    gradient: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    accent: 'text-purple-600'
  }
];

const steps = [
  {
    title: 'Personal',
    icon: User,
    description: 'Your information'
  },
  {
    title: 'Investment',
    icon: Sparkles,
    description: 'Choose amount'
  },
  {
    title: 'Banking',
    icon: Building,
    description: 'Link account'
  },
  {
    title: 'Security',
    icon: Shield,
    description: 'Create PIN'
  },
  {
    title: 'Complete',
    icon: CheckCircle,
    description: 'All set'
  }
];

// --- Step Components ---

const StepPersonalDetails = ({ formData, updateFormData }) => (
  <div className="space-y-6 animate-fadeIn">
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-lg">
        <User className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
      <p className="text-sm md:text-base text-gray-600">Let's get your investment journey started</p>
    </div>

    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="group">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            placeholder="John"
            className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
          />
        </div>
        <div className="group">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Surname</label>
          <input
            type="text"
            placeholder="Doe"
            className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
            value={formData.surname}
            onChange={(e) => updateFormData('surname', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          placeholder="john.doe@example.com"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
        <input
          type="tel"
          placeholder="0801 234 5678"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Address</label>
        <textarea
          placeholder="Enter your full residential address"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none text-sm md:text-base"
          rows="3"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
        <input
          type="date"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm md:text-base"
          value={formData.dob}
          onChange={(e) => updateFormData('dob', e.target.value)}
        />
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 md:p-5 border border-gray-200">
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-3">Verification Type</label>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <label className="flex-1 cursor-pointer">
            <div className={`p-3 md:p-4 rounded-lg border-2 transition-all ${formData.identityType === 'BVN' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
              <input
                type="radio"
                name="identityType"
                value="BVN"
                checked={formData.identityType === 'BVN'}
                onChange={(e) => updateFormData('identityType', e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm md:text-base">BVN</span>
                {formData.identityType === 'BVN' && <Check className="w-5 h-5 text-green-600" />}
              </div>
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <div className={`p-3 md:p-4 rounded-lg border-2 transition-all ${formData.identityType === 'NIN' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
              <input
                type="radio"
                name="identityType"
                value="NIN"
                checked={formData.identityType === 'NIN'}
                onChange={(e) => updateFormData('identityType', e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm md:text-base">NIN</span>
                {formData.identityType === 'NIN' && <Check className="w-5 h-5 text-green-600" />}
              </div>
            </div>
          </label>
        </div>
        <input
          type="text"
          maxLength="11"
          placeholder={`Enter your ${formData.identityType || 'BVN/NIN'} number`}
          className="w-full px-4 py-3 md:py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
          value={formData.identityNumber}
          onChange={(e) => updateFormData('identityNumber', e.target.value.replace(/\D/g, ''))}
        />
      </div>
    </div>
  </div>
);

const StepInvestmentDetails = ({ amount, setAmount, customAmount, setCustomAmount, isOthersSelected, setIsOthersSelected, selectedInvestment, setSelectedInvestment }) => {
  const [tooltipOpen, setTooltipOpen] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const triggerRefs = React.useRef({});
  const closeTimeoutRef = React.useRef(null);

  const calculateAndSetPosition = (investmentType) => {
    const triggerEl = triggerRefs.current[investmentType];
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
        // Desktop: position below the trigger
        setTooltipPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX + (rect.width / 2)
        });
      }
    }
  };

  const handleInfoClick = (investmentType, event) => {
    event.stopPropagation();
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Toggle the tooltip on click
    if (tooltipOpen === investmentType) {
      setTooltipOpen(null);
      return;
    }

    calculateAndSetPosition(investmentType);
    setTooltipOpen(investmentType);
  };

  const handleMouseEnter = (investmentType) => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      calculateAndSetPosition(investmentType);
      setTooltipOpen(investmentType);
    }
  };

  const handleMouseLeave = () => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      // Delay closing slightly so moving cursor to portal doesn't immediately close it
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setTooltipOpen(null);
        closeTimeoutRef.current = null;
      }, 150);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="text-center mb-6 md:mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mb-4 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Choose your investment</h2>
        <p className="text-sm md:text-base text-gray-600">Select amount and portfolio type</p>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-4">Investment Amount</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {amounts.map((amt) => (
            <button
              key={amt}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 ${!isOthersSelected && amt === amount
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              onClick={() => {
                setAmount(amt);
                setIsOthersSelected(false);
                setCustomAmount('');
              }}
            >
              <div className={`font-bold text-sm md:text-base ${!isOthersSelected && amt === amount ? 'text-green-700' : 'text-gray-900'}`}>
                ₦{amt.toLocaleString()}
              </div>
            </button>
          ))}
          <button
            className={`p-3 md:p-4 rounded-xl border-2 transition-all duration-200 ${isOthersSelected
              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md scale-105'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            onClick={() => setIsOthersSelected(true)}
          >
            <div className={`font-bold text-sm md:text-base ${isOthersSelected ? 'text-green-700' : 'text-gray-900'}`}>
              Others
            </div>
          </button>
        </div>

        {isOthersSelected && (
          <div className="mt-4">
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Enter Custom Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-900 font-bold text-lg">
                ₦
              </span>
              <input
                type="text"
                placeholder="Enter your desired amount"
                className="w-full px-8 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
                value={customAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setCustomAmount(value);
                  if (value) {
                    const numValue = parseInt(value, 10);
                    setAmount(numValue);
                  } else {
                    setAmount(0);
                  }
                }}
              />
            </div>
            {customAmount && parseInt(customAmount, 10) < 50000 && (
              <p className="text-xs md:text-sm text-amber-600 mt-2 ml-1 font-medium">Minimum investment amount is ₦50,000</p>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs md:text-sm font-semibold text-gray-700">Portfolio Type</label>
          <div className="group relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Toggle a general info tooltip if needed
              }}
              className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
            >
              <Info className="w-3 h-3 text-blue-600" />
            </button>
            <div className="absolute left-6 top-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
              <div className="bg-gray-900 text-white p-3 rounded-lg text-xs w-64 shadow-lg whitespace-nowrap">
                <p className="font-semibold mb-1">Investment Types Guide:</p>
                <ul className="space-y-1">
                  <li>• <strong>Gold Starter:</strong> Entry-level investment</li>
                  <li>• <strong>Gold Flair:</strong> Mid-tier investment</li>
                  <li>• <strong>Gold Accent:</strong> Premium investment</li>
                  <li>• <strong>Gold Luxury:</strong> Elite investment (Growth only)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3 relative">
          {investmentTypes.map((investment) => (
            <div
              key={investment.type}
              className={`relative p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-gradient-to-r ${investment.gradient} ${selectedInvestment === investment.type
                ? 'border-green-500 shadow-lg scale-102'
                : `${investment.border} hover:shadow-md`
                }`}
              onClick={() => setSelectedInvestment(investment.type)}
            >
              {selectedInvestment === investment.type && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Info icon - tooltip moved outside to avoid transform issues */}
              <div
                className="absolute top-3 right-14 z-10"
                ref={(el) => {
                  if (el) triggerRefs.current[investment.type] = el;
                }}
                onMouseEnter={() => handleMouseEnter(investment.type)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={(e) => handleInfoClick(investment.type, e)}
                  className="w-6 h-6 bg-white rounded-full border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors duration-200 shadow-sm touch-manipulation"
                  type="button"
                  aria-label={`View ${investment.type} details`}
                >
                  <Info className="w-3 h-3 text-gray-600" />
                </button>
              </div>

              <h3 className={`font-bold text-base md:text-lg mb-1 ${investment.accent}`}>
                {investment.type}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3">{investment.description}</p>
              <div className="flex flex-wrap gap-2 md:gap-3 text-xs">
                <span className={`px-2 py-1 rounded-lg bg-white ${investment.accent} font-semibold`}>
                  {investment.returns}
                </span>
                <span className="px-2 py-1 rounded-lg bg-white text-gray-600">
                  Risk: {investment.risk}
                </span>
                <span className="px-2 py-1 rounded-lg bg-white text-gray-600">
                  {investment.duration}
                </span>
              </div>
            </div>
          ))}

          {/* Tooltips rendered via Portal */}
          {investmentTypes.map((investment) => {
            const isMobile = window.innerWidth < 768;
            const position = !isMobile ? tooltipPosition : null;

            return (
              <InvestmentTooltip
                key={`tooltip-${investment.type}`}
                investment={portfolioInvestmentData[investment.type]}
                isOpen={tooltipOpen === investment.type}
                onClose={() => setTooltipOpen(null)}
                position={position}
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = setTimeout(() => {
                    setTooltipOpen(null);
                    closeTimeoutRef.current = null;
                  }, 150);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StepBankInfo = ({ formData, updateFormData }) => (
  <div className="space-y-6 animate-fadeIn">
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl mb-4 shadow-lg">
        <Building className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Link your bank account</h2>
      <p className="text-sm md:text-base text-gray-600">For deposits and withdrawals</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
        <select
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm md:text-base"
          value={formData.bankName}
          onChange={(e) => updateFormData('bankName', e.target.value)}
        >
          <option value="">Select your bank</option>
          <option value="Access Bank">Access Bank</option>
          <option value="GTBank">GTBank</option>
          <option value="First Bank">First Bank</option>
          <option value="UBA">UBA</option>
          <option value="Zenith Bank">Zenith Bank</option>
          <option value="Fidelity Bank">Fidelity Bank</option>
          <option value="Opay">Opay</option>
          <option value="Money Point">Money Point</option>
          <option value="Skye Bank">Skye Bank</option>
          <option value="Eco Bank">Eco Bank </option>
          <option value="Bank PHB">Bank PHB</option>
          <option value="Kuda Bank">Kuda Bank</option>
          <option value="SunTrust Bank">SunTrust Bank</option>
          <option value="Palm Pay">Palm Pay</option>
          <option value="Union Bank">Union Bank</option>

        </select>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Account Name</label>
        <input
          type="text"
          placeholder="Account holder name"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base"
          value={formData.accountName}
          onChange={(e) => updateFormData('accountName', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1.5 ml-1">Must match your NIN/BVN records</p>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Account Number</label>
        <input
          type="text"
          placeholder="10-digit account number"
          maxLength="10"
          className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm md:text-base tracking-wider"
          value={formData.accountNumber}
          onChange={(e) => updateFormData('accountNumber', e.target.value.replace(/\D/g, ''))}
        />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1 text-sm md:text-base">Account Verification</h4>
            <p className="text-xs md:text-sm text-gray-700">
              We'll verify your account details with your bank for security purposes.
            </p>
          </div>
        </div>
      </div>
    </div >
  </div >
);

const StepSecurityInfo = ({ formData, updateFormData, showPin, setShowPin, showConfirmPin, setShowConfirmPin }) => (
  <div className="space-y-6 animate-fadeIn">
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4 shadow-lg">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Secure your account</h2>
      <p className="text-sm md:text-base text-gray-600">Create a 4-digit transaction PIN</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Transaction PIN</label>
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            placeholder="••••"
            maxLength="4"
            className="w-full px-4 py-4 md:py-5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 text-center text-2xl md:text-3xl tracking-widest font-bold"
            value={formData.pin}
            onChange={(e) => updateFormData('pin', e.target.value.replace(/\D/g, ''))}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Confirm PIN</label>
        <div className="relative">
          <input
            type={showConfirmPin ? "text" : "password"}
            placeholder="••••"
            maxLength="4"
            className="w-full px-4 py-4 md:py-5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 text-gray-900 text-center text-2xl md:text-3xl tracking-widest font-bold"
            value={formData.confirmPin}
            onChange={(e) => updateFormData('confirmPin', e.target.value.replace(/\D/g, ''))}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowConfirmPin(!showConfirmPin)}
          >
            {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.confirmPin && formData.pin !== formData.confirmPin && (
          <p className="text-xs md:text-sm text-red-600 mt-2 ml-1 font-medium">PINs do not match</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2 text-sm md:text-base">PIN Security Tips</h4>
            <ul className="text-xs md:text-sm text-gray-700 space-y-1">
              <li>• Never share your PIN with anyone</li>
              <li>• Avoid using obvious numbers like 1234</li>
              <li>• Change your PIN regularly in settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StepConfirmation = ({ accountNumber, amount, selectedInvestment }) => (
  <div className="text-center space-y-6 animate-fadeIn">
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
      <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
      </div>
    </div>

    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Account Created!</h2>
      <p className="text-sm md:text-base text-gray-600">Welcome to your investment journey</p>
    </div>

    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 md:p-6 border-2 border-gray-200 shadow-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-xs md:text-sm text-gray-600 font-medium">Account Number</span>
          <span className="text-sm md:text-base text-gray-900 font-bold">{accountNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-xs md:text-sm text-gray-600 font-medium">Initial Investment</span>
          <span className="text-sm md:text-base text-green-600 font-bold">₦{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-xs md:text-sm text-gray-600 font-medium">Portfolio Type</span>
          <span className="text-sm md:text-base text-blue-600 font-bold">{selectedInvestment}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-xs md:text-sm text-gray-600 font-medium">Status</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm font-bold">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Active
          </span>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-5 text-left">
      <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base">Next Steps</h4>
      <ul className="text-xs md:text-sm text-gray-700 space-y-2">
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span><strong>Check your Dashboard after payment to view your Account Number</strong></span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>Fund your account to start investing</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>Set up automatic investments</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>Track your portfolio performance</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>Enable notifications for updates</span>
        </li>
      </ul>
    </div>
  </div>
);

const AccountWizard = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [isOthersSelected, setIsOthersSelected] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    identityType: '',
    identityNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    pin: '',
    confirmPin: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.surname && formData.email && formData.phone && formData.address && formData.dob && formData.identityType && formData.identityNumber;
      case 1:
        return selectedInvestment !== '' && amount > 0 && (!isOthersSelected || (isOthersSelected && parseInt(customAmount, 10) >= 50000));
      case 2:
        return formData.bankName && formData.accountName && formData.accountNumber;
      case 3:
        return formData.pin.length === 4 && formData.pin === formData.confirmPin;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepPersonalDetails formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <StepInvestmentDetails amount={amount} setAmount={setAmount} customAmount={customAmount} setCustomAmount={setCustomAmount} isOthersSelected={isOthersSelected} setIsOthersSelected={setIsOthersSelected} selectedInvestment={selectedInvestment} setSelectedInvestment={setSelectedInvestment} />;
      case 2:
        return <StepBankInfo formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepSecurityInfo formData={formData} updateFormData={updateFormData} showPin={showPin} setShowPin={setShowPin} showConfirmPin={showConfirmPin} setShowConfirmPin={setShowConfirmPin} />;
      case 4:
        return <StepConfirmation accountNumber={accountNumber} amount={amount} selectedInvestment={selectedInvestment} />;
      default:
        return null;
    }
  };

  const progressPercent = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-4 md:py-8 px-3 md:px-4">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Open Investment Account
          </h1>
          <p className="text-sm md:text-base text-gray-600">Professional investment management made simple</p>
        </div>

        <div className="mb-6 md:mb-8">
          <div className="hidden md:flex justify-between items-start mb-6 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${isCompleted
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg'
                    : isCurrent
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg scale-110'
                      : 'bg-gray-200'
                    }`}>
                    <Icon className={`w-6 h-6 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold mb-1 ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 ${index < currentStep ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'
                      }`} style={{ transform: 'translateY(-50%)' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-900">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-xs font-semibold text-blue-600">{steps[currentStep].title}</span>
            </div>
          </div>

          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 mb-4 md:mb-6 border border-gray-100">
          {renderStep()}
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-semibold transition-all text-sm md:text-base ${currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md active:scale-95'
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-4 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-semibold transition-all text-sm md:text-base ${isStepValid()
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);

                const investorData = {
                  name: formData.name,
                  surname: formData.surname,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                  dob: formData.dob,
                  identityType: formData.identityType,
                  identityNumber: formData.identityNumber,
                  bankName: formData.bankName,
                  accountName: formData.accountName,
                  accountNumber: formData.accountNumber,
                  pin: formData.pin
                };

                try {
                  const paymentData = {
                    email: formData.email,
                    amount: amount,
                    portfolio_type: selectedInvestment,
                    investor_data: investorData
                  };

                  const data = await PaymentService.initializePayment(paymentData);

                  if (data.status && data.data?.authorization_url) {
                    window.location.href = data.data.authorization_url;
                  } else {
                    throw new Error(data.message || 'Failed to initialize payment');
                  }
                } catch (err) {
                  setSubmitError(err.message || String(err));
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className={`flex items-center gap-2 px-4 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-semibold transition-all text-sm md:text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl active:scale-95 ${submitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              <span>{submitting ? 'Processing...' : 'Proceed to Payment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-fadeIn">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 text-sm">Submission Failed</h4>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountWizard;
