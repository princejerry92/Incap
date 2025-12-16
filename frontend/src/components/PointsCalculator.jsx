import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import referralAPI from '../services/referralAPI';

const PointsCalculator = ({ userPoints = 0, onCalculate, loading = false }) => {
  const [mode, setMode] = useState('points-to-cash'); // 'points-to-cash' or 'cash-to-points'
  const [pointsInput, setPointsInput] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [result, setResult] = useState(null);

  // Calculate when inputs change
  useEffect(() => {
    if (loading) return; // Don't calculate while loading

    if (mode === 'points-to-cash' && pointsInput) {
      const points = parseInt(pointsInput) || 0;
      const cashValue = referralAPI.calculateRedemptionValue(points);
      setResult({
        points,
        cashValue,
        canRedeem: points <= userPoints
      });
    } else if (mode === 'cash-to-points' && cashInput) {
      const cash = parseFloat(cashInput) || 0;
      const pointsNeeded = referralAPI.calculatePointsNeeded(cash);
      const cashValue = referralAPI.calculateRedemptionValue(pointsNeeded);
      setResult({
        points: pointsNeeded,
        cashValue,
        canRedeem: pointsNeeded <= userPoints
      });
    } else {
      setResult(null);
    }
  }, [mode, pointsInput, cashInput, userPoints, loading]);

  const handlePointsChange = (value) => {
    setPointsInput(value);
    setCashInput('');
  };

  const handleCashChange = (value) => {
    setCashInput(value);
    setPointsInput('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('NGN', '₦');
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Points Calculator</h3>
          <p className="text-xs sm:text-sm text-gray-600">Calculate redemption values</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('points-to-cash')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'points-to-cash'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Points → Cash
        </button>
        <button
          onClick={() => setMode('cash-to-points')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'cash-to-points'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Cash → Points
        </button>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        {mode === 'points-to-cash' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points to Redeem
            </label>
            <div className="relative">
              <input
                type="number"
                value={pointsInput}
                onChange={(e) => handlePointsChange(e.target.value)}
                placeholder="Enter points"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-800"
                min="1"
                max={userPoints}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">₦</span>
                </div>
                <span className="text-sm text-gray-500">pts</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: {userPoints} points
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cash Amount Needed
            </label>
            <div className="relative">
              <input
                type="number"
                value={cashInput}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-800"
                min="1000"
                step="1000"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-lg font-bold text-green-600">₦</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₦500 (1 point)
            </p>
          </div>
        )}
      </div>

      {/* Result Section */}
      {result && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-800">Calculation Result</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Points Required:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{result.points}</span>
                <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">₦</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash Value:</span>
              <span className="font-bold text-green-600">{formatCurrency(result.cashValue)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exchange Rate:</span>
              <span className="text-xs text-gray-500">1 point = ₦500</span>
            </div>
          </div>

          {!result.canRedeem && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600">
                Insufficient points. You need {result.points - userPoints} more points.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {result && result.canRedeem && onCalculate && (
        <button
          onClick={() => onCalculate(result)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-medium"
        >
          <span>Redeem {result.points} Points</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Redemption Rules:</p>
            <ul className="space-y-1">
              <li>• Minimum redemption: 1 point (₦500)</li>
              <li>• Maximum monthly redemption: ₦500,000</li>
              <li>• Points expire: Never</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsCalculator;
