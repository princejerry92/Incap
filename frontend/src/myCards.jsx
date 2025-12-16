import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Plus, Settings, CreditCard, BarChart3, Home, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import UnderDevelopmentOverlay from './components/UnderDevelopmentOverlay';

const SecureCardWallet = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const cards = [
    {
      id: 1,
      number: '1234 5678 9000 0000',
      holder: 'Sarah Akinbi',
      expiry: '9/25',
      type: 'VISA',
      gradient: 'bg-gradient-to-br from-teal-700 via-green-600 to-green-500'
    },
    {
      id: 2,
      number: '9876 5432 1000 1111',
      holder: 'Sarah Akinbi',
      expiry: '12/26',
      type: 'MASTERCARD',
      gradient: 'bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500'
    },
    {
      id: 3,
      number: '5555 4444 3333 2222',
      holder: 'Sarah Akinbi',
      expiry: '3/27',
      type: 'AMEX',
      gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500'
    }
  ];

  const analyticsData = [
    { month: 'Jan', capital: 2400, interest: 400 },
    { month: 'Feb', capital: 1398, interest: 300 },
    { month: 'Mar', capital: 9800, interest: 600 },
    { month: 'Apr', capital: 3908, interest: 800 },
    { month: 'May', capital: 4800, interest: 700 },
    { month: 'Jun', capital: 3800, interest: 900 },
  ];

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
    if (isRightSwipe && currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const maskCardNumber = (number) => {
    if (showDetails) return number;
    return number.replace(/\d(?=\d{4})/g, '*');
  };

  return (
    <UnderDevelopmentOverlay onClose={() => window.history.back()}>
      <div className="min-h-screen bg-gradient-to-b from-blue-800 via-green-600 to-green-700 text-white font-['Lexend_Deca']">
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="bg-white/90 backdrop-blur-xl rounded-t-3xl min-h-screen pt-8 px-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">My Cards</h2>
              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
            </div>

            {/* Card Container */}
            <div className="relative mb-8">
              <div
                className="overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentCard * 100}%)` }}
                >
                  {cards.map((card, index) => (
                    <div key={card.id} className="w-full flex-shrink-0 px-4">
                      <div className={`${card.gradient} rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                        <div className="relative z-10">
                          <div className="text-lg font-mono tracking-widest mb-6 pt-4">
                            {maskCardNumber(card.number)}
                          </div>

                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs opacity-70 mb-1">Card Holder</p>
                              <p className="font-medium">{card.holder}</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-70 mb-1">Exp Date</p>
                              <p className="font-medium">{card.expiry}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                              <span className="text-sm font-bold">{card.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Indicators */}
              <div className="flex justify-center space-x-2 mt-4">
                {cards.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentCard ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="bg-green-200 hover:bg-green-300 transition-colors rounded-xl p-4 flex flex-col items-center space-y-2"
              >
                {showDetails ? <EyeOff className="w-6 h-6 text-green-700" /> : <Eye className="w-6 h-6 text-green-700" />}
                <span className="text-sm font-medium text-green-700">Show details</span>
              </button>

              <button className="bg-green-200 hover:bg-green-300 transition-colors rounded-xl p-4 flex flex-col items-center space-y-2">
                <Plus className="w-6 h-6 text-green-700" />
                <span className="text-sm font-medium text-green-700">Add Card</span>
              </button>

              <button className="bg-green-200 hover:bg-green-300 transition-colors rounded-xl p-4 flex flex-col items-center space-y-2">
                <Settings className="w-6 h-6 text-green-700" />
                <span className="text-sm font-medium text-green-700">Settings</span>
              </button>
            </div>

            {/* Analytics Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">AI Powered Analytics</h3>
                  <p className="text-sm text-gray-500">UX Metric sales by format (inflation-adjusted)</p>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Area
                      type="monotone"
                      dataKey="capital"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="url(#colorCapital)"
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      stackId="1"
                      stroke="#10B981"
                      fill="url(#colorInterest)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-around">
                <button className="flex flex-col items-center space-y-1">
                  <Home className="w-6 h-6 text-gray-400" />
                </button>
                <button className="flex flex-col items-center space-y-1">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </button>
                <button className="bg-green-500 p-3 rounded-full">
                  <Plus className="w-6 h-6 text-white" />
                </button>
                <button className="flex flex-col items-center space-y-1">
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                </button>
                <button className="flex flex-col items-center space-y-1">
                  <Settings className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop View */}
        <div className="hidden md:block">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Cards Section */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold mb-8">My Wallet</h1>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {cards.map((card, index) => (
                    <div key={card.id} className={`${card.gradient} rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform duration-300`}>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

                      <div className="relative z-10">
                        <div className="text-xl font-mono tracking-widest mb-8 pt-6">
                          {maskCardNumber(card.number)}
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm opacity-70 mb-2">Card Holder</p>
                            <p className="font-semibold text-lg">{card.holder}</p>
                          </div>
                          <div>
                            <p className="text-sm opacity-70 mb-2">Exp Date</p>
                            <p className="font-semibold text-lg">{card.expiry}</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <span className="text-lg font-bold">{card.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors rounded-2xl p-6 flex items-center space-x-3"
                  >
                    {showDetails ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    <span className="font-medium">
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </span>
                  </button>

                  <button className="bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors rounded-2xl p-6 flex items-center space-x-3">
                    <Plus className="w-6 h-6" />
                    <span className="font-medium">Add Card</span>
                  </button>

                  <button className="bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors rounded-2xl p-6 flex items-center space-x-3">
                    <Settings className="w-6 h-6" />
                    <span className="font-medium">Settings</span>
                  </button>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-xl">AI Powered Analytics</h3>
                    <p className="text-sm text-gray-600">Capital vs Interest over time</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-gray-600" />
                      <YAxis axisLine={false} tickLine={false} className="text-gray-600" />
                      <Area
                        type="monotone"
                        dataKey="capital"
                        stackId="1"
                        stroke="#1E40AF"
                        fill="url(#colorCapital)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        stackId="1"
                        stroke="#059669"
                        fill="url(#colorInterest)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm text-gray-600">Capital</span>
                    </div>
                    <p className="font-bold text-gray-800">$24,890</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-sm text-gray-600">Interest</span>
                    </div>
                    <p className="font-bold text-gray-800">$4,760</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnderDevelopmentOverlay>
  );
};

export default SecureCardWallet;
