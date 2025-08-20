import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './global-styles.css';
import { 
  Home, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Eye, 
  DollarSign, 
  ArrowUpRight, 
  RotateCcw, 
  ArrowUp,
  User,
  Settings,
  Bell,
  Search,
  Target,
  PieChart,
  BarChart3,
  Wallet,
  ChevronDown,
  X
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

  const handledpaystack = () => {
    navigate('/paystack-checkout');
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const transactions = [
    { id: 1, type: 'Paystack Payment', amount: 'N500,000.34', date: '27 August 2024', time: '12:49 PM', status: 'Received' },
    { id: 2, type: 'Netflix Subscription', amount: 'N3,200.00', date: '26 August 2024', time: '10:30 AM', status: 'Sent' },
    { id: 3, type: 'Grocery Shopping', amount: 'N15,450.20', date: '25 August 2024', time: '3:15 PM', status: 'Sent' }
  ];

  const quickActions = [
    { icon: DollarSign, label: 'Pay', color: 'bg-green-500' },
    { icon: CreditCard, label: 'Withdraw', color: 'bg-blue-500' },
    { icon: RotateCcw, label: 'Renew', color: 'bg-purple-500' },
    { icon: ArrowUp, label: 'Top up', color: 'bg-orange-500' }
  ];

  const addMenuItems = [
    { icon: CreditCard, label: 'Add Card', desc: 'Link a new payment card' },
    { icon: Search, label: 'Discover', desc: 'Explore new features' },
    { icon: Calendar, label: 'Due Dates', desc: 'Manage payment schedules' },
    { icon: Target, label: 'Goals', desc: 'Set financial targets' }
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Wallet, label: 'Wallet' },
    { icon: CreditCard, label: 'Cards' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Calendar, label: 'Due Dates' },
    { icon: Target, label: 'Goals' },
    { icon: Settings, label: 'Settings' }
  ];

  const MobileView = () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="card-container mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 md:text-white">Good morning</h1>
            <p className="text-gray-600 md:text-white">Ankibi Sarah</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Wallet</h2>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-emerald-600 to-green-500 p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm opacity-90">Investment Balance</p>
                <h3 className="text-3xl font-bold">N500,000.34</h3>
                <p className="text-sm opacity-75 mt-1">Amount Due: N60,000</p>
              </div>
              <Calendar className="w-6 h-6 opacity-75" />
            </div>
            
            <div className="flex justify-between items-end mt-8">
              <div className="flex items-center space-x-2">
                <span className="text-lg">****</span>
                <span className="text-lg">5328</span>
                <Eye className="w-4 h-4 opacity-75" />
                <p className="text-sm opacity-75">Ankibi Sarah</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">VISA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <div key={index} className="text-center">
              <div className={`w-14 h-14 ${action.color} rounded-full flex items-center justify-center mb-2 mx-auto`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600">{action.label}</p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transactions</h3>
          <button className="text-green-600 text-sm font-medium">See All</button>
        </div>

        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{transaction.type}</p>
                  <p className="text-sm text-gray-500">{transaction.date} • {transaction.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{transaction.amount}</p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${transaction.status === 'Received' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm text-gray-500">{transaction.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around items-center">
          <Home className="w-6 h-6 text-green-600" />
          <CreditCard className="w-6 h-6 text-gray-400" />
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105"
          >
            {showAddModal ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </button>
          <BarChart3 className="w-6 h-6 text-gray-400" />
          <User className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 transform transition-all duration-300 ease-out scale-100">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
              <p className="text-sm text-gray-500">Choose an action to continue</p>
            </div>
            <div className="space-y-3">
              {addMenuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAddModal(false)}
              className="w-full mt-6 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const DesktopView = () => (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 neumorphic m-4 p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">WalletPro</h2>
            <p className="text-sm text-gray-500">Financial Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Good morning, Ankibi Sarah</h1>
            <p className="text-gray-200">Here's your financial overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3 neumorphic-inset px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="font-medium text-gray-800">Ankibi Sarah</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Balance Card */}
          <div className="col-span-8 row-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-emerald-600 to-green-500 p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-lg opacity-90">Investment Balance</p>
                <h3 className="text-5xl font-bold mb-2">N500,000.34</h3>
                <p className="opacity-75">Amount Due: N60,000</p>
              </div>
              <Calendar className="w-8 h-8 opacity-75" />
            </div>
            
            <div className="flex justify-between items-end mt-12">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">****</span>
                <span className="text-2xl">5328</span>
                <Eye className="w-5 h-5 opacity-75" />
                <p className="opacity-75">Ankibi Sarah</p>
              </div>
              <div className="text-4xl font-bold">VISA</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-4 neumorphic p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-2`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="col-span-6 neumorphic p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Spending Analytics</h3>
              <BarChart3 className="w-5 h-5 text-gray-500" />
            </div>
            <div className="h-32 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-end justify-center p-4">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Chart visualization here</p>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="col-span-3 neumorphic p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Goals</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Emergency Fund</span>
                  <span className="text-xs text-green-600">75%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Vacation</span>
                  <span className="text-xs text-blue-600">45%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-3 neumorphic p-6">
            <h3 className="font-semibold text-gray-800 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Income</span>
                <span className="font-semibold text-green-600">+N750K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold text-red-600">-N250K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Savings</span>
                <span className="font-semibold text-blue-600">N500K</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-8 neumorphic p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
              <button className="text-green-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.type}</p>
                      <p className="text-sm text-gray-500">{transaction.date} • {transaction.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{transaction.amount}</p>
                    <div className="flex items-center justify-end space-x-2">
                      <div className={`w-2 h-2 rounded-full ${transaction.status === 'Received' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className="text-sm text-gray-500">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Menu Items */}
          <div className="col-span-4 neumorphic p-6">
            <h3 className="font-semibold text-gray-800 mb-4">More Actions</h3>
            <div className="space-y-3">
              {addMenuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? <MobileView /> : <DesktopView />;
};

export default Dashboard;