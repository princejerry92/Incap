import React from 'react';
import { TrendingUp, ArrowDownCircle, PiggyBank, Calendar } from 'lucide-react';

// Portfolio Metrics component showing key analytics in cards
const PortfolioMetrics = ({ portfolioMetrics, summaryStats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('NGN', '₦');
  };

  const metrics = [
    {
      title: 'Total Interest Earned',
      value: portfolioMetrics?.total_interest || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Withdrawn',
      value: portfolioMetrics?.total_withdrawals || 0,
      icon: ArrowDownCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Current Balance',
      value: portfolioMetrics?.current_balance || 0,
      icon: PiggyBank,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Weeks Remaining',
      value: `${portfolioMetrics?.weeks_remaining || 0} weeks`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isText: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className={`rounded-2xl p-4 sm:p-6 ${metric.bgColor} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`p-3 rounded-full ${metric.bgColor} ${metric.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                <IconComponent className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">{metric.title}</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                {metric.isText ? metric.value : formatCurrency(metric.value)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Additional summary card */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-2xl p-4 sm:p-6 bg-gray-50 transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-white rounded-xl">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Weekly Interest Rate</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {portfolioMetrics?.weekly_interest_rate || 0}%
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-white rounded-xl">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Portfolio Type</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
              {portfolioMetrics?.portfolio_type || 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-white rounded-xl">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Investment Type</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
              {portfolioMetrics?.investment_type || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioMetrics;