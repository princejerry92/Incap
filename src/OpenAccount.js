import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './global-styles.css';

const InvestmentPage = () => {
  const navigate = useNavigate();

  const handlewizard = () => {
    navigate('/open-account-wizard');
  };
  return (
    <div className="min-h-screen bg-[var(--background-gradient)] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Mobile Layout (default) - Desktop Layout (lg:flex-row) */}
        <div className="card-container2 neumorphic-inset:focus-within  neumorphic neumorphic-inset rounded-3xl shadow-xl overflow-hidden lg:flex lg:items-center lg:min-h-[500px]">
          
          {/* Image Section */}
          <div className="lg:w-1/2 lg:flex lg:justify-center lg:items-center lg:p-12 p-8 bg-[var(--accent-secodary)]">
            <div className="flex justify-center mb-8 lg:mb-0">
              <div className="relative">
                {/* Wallet illustration */}
                <div className="relative">
                  <div className="w-48 h-36 bg-red-900 rounded-2xl transform rotate-12 shadow-lg">
                    <div className="absolute top-4 left-4 w-8 h-6 bg-pink-400 rounded"></div>
                  </div>
                  
                  {/* Money bills */}
                  <div className="absolute -top-4 left-8 w-20 h-12 bg-green-400 rounded transform -rotate-12 shadow-md">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="absolute -top-2 left-12 w-20 h-12 bg-green-500 rounded transform -rotate-6 shadow-md">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>
                  
                  {/* Floating coins */}
                  <div className="absolute -top-8 -right-4 w-8 h-8 bg-yellow-400 rounded-full shadow-lg animate-bounce"></div>
                  <div className="absolute top-2 -right-8 w-6 h-6 bg-yellow-500 rounded-full shadow-lg animate-bounce" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute -bottom-4 -right-2 w-7 h-7 bg-yellow-400 rounded-full shadow-lg animate-bounce" style={{animationDelay: '1s'}}></div>
                  <div className="absolute bottom-8 -left-6 w-5 h-5 bg-yellow-500 rounded-full shadow-lg animate-bounce" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="flex text-3xl grid grid-col-2 lg:text-4xl font-bold text-green-900 m-8 text-center lg:text-center">
                Watch Your<br />            
                Investment grow
              </div>

              {/* Features List */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Earn up to 15% monthly</span> on your investment
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">AI Tracked Payout</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">No Delays in Payments</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center lg:text-left">
                <button 
                  className="flex w-full btn-primary lg:w-auto text-gray-100 font-semibold size-auto md:py-4 px-4 md:px-8 rounded-full text-sm md:text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform"
                  onClick={handlewizard}
                >Open Investment Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPage;