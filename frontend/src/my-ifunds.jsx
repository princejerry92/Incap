import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  TrendingUp, 
  Settings,
  Truck,
  Wheat,
  TrendingDown,
  User,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const MyIFunds = () => {
    
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const investmentData = [
    { name: 'Transportation', amount: 500.48, color: '#FF6B6B', icon: Truck, change: '+2.4%' },
    { name: 'Agriculture', amount: 500.00, color: '#4ECDC4', icon: Wheat, change: '+1.8%' },
    { name: 'Forex and Crypto', amount: 54.48, color: '#45B7D1', icon: TrendingUp, change: '-0.5%' }
  ];

  const totalAmount = investmentData.reduce((sum, item) => sum + item.amount, 0);
  const investedThisWeek = 5.48;

  const chartData = {
    labels: investmentData.map(item => item.name),
    datasets: [{
      data: investmentData.map(item => item.amount),
      backgroundColor: investmentData.map(item => item.color),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverBorderWidth: 5,
      hoverOffset: 15,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false
      }
    },
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        setHoveredSegment(activeElements[0].index);
      } else {
        setHoveredSegment(null);
      }
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Calendar, label: 'Calendar' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Settings, label: 'Settings' }
  ];

  const historyItems = [
    { type: 'Interest Paid', amount: 5.48, date: '31 Jan 2024', positive: true },
    { type: 'Transport Investment', amount: 500.48, date: '31 Jan 2024', positive: false }
  ];

  const circleMembers = [
    { id: 1, avatar: '👤' },
    { id: 2, avatar: '👤' },
    { id: 3, avatar: '👤' },
    { id: 4, avatar: '👤' },
    { id: 5, avatar: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">i-Funds</h1>
        </div>
        <nav className="mt-8 flex-1">
          {sidebarItems.map((item, index) => (
            <a
              key={index}
              href="#"
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">i-Funds</h1>
              <button onClick={() => setIsMenuOpen(false)} className="text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-8">
              {sidebarItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setIsMenuOpen(true)} className="text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">my i-Funds</h1>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 max-w-md mx-auto lg:max-w-none">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="hidden lg:block w-2 h-8 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">my i-Funds</h2>
              </div>
              <div className="lg:hidden w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            {/* Chart Section */}
            <div className="p-6 pt-4">
              <div className="relative">
                {/* Chart Container */}
                <div className="relative h-64 w-64 mx-auto mb-6">
                  <Doughnut data={chartData} options={chartOptions} />
                  
                  {/* Center Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">Total Portfolio</p>
                      <p className="text-2xl font-bold text-gray-800">${totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Hover Info Card */}
                {hoveredSegment !== null && (
                  <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-48 transform transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      {React.createElement(investmentData[hoveredSegment].icon, { 
                        className: "h-5 w-5", 
                        style: { color: investmentData[hoveredSegment].color }
                      })}
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {investmentData[hoveredSegment].name}
                      </h4>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-1">
                      ${investmentData[hoveredSegment].amount}
                    </p>
                    <div className="flex items-center gap-1">
                      {investmentData[hoveredSegment].change.startsWith('+') ? 
                        <ArrowUpRight className="h-3 w-3 text-green-500" /> : 
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      }
                      <span className={`text-xs font-medium ${
                        investmentData[hoveredSegment].change.startsWith('+') ? 
                        'text-green-600' : 'text-red-600'
                      }`}>
                        {investmentData[hoveredSegment].change}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Investment Legend */}
              <div className="space-y-3 mb-6">
                {investmentData.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: item.color }}
                        />
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">${item.amount}</p>
                        <p className={`text-xs ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">Invested this Week</p>
                  <p className="text-lg font-bold text-green-700">${investedThisWeek}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">Account Connected</p>
                  <p className="text-lg font-bold text-blue-700">${totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Your Circle */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Your Circle</h3>
                  <button className="text-xs text-blue-600 font-medium hover:text-blue-700">
                    see all
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {circleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm"
                    >
                      <span className="text-sm">{member.avatar}</span>
                    </div>
                  ))}
                  <button className="w-9 h-9 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Plus className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">History</h3>
                <div className="space-y-3">
                  {historyItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${item.positive ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.type}</p>
                          <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${item.positive ? 'text-green-600' : 'text-gray-800'}`}>
                        {item.positive ? '+' : ''}${item.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Navigation (Mobile) */}
            <div className="lg:hidden border-t border-gray-200 p-4">
              <div className="flex justify-around">
                {sidebarItems.map((item, index) => (
                  <button
                    key={index}
                    className={`p-3 rounded-xl transition-colors ${
                      item.active ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyIFunds;