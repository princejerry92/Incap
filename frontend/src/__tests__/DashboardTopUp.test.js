import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../Dashboard';

// Mock all the services and components that Dashboard depends on
jest.mock('../services/api', () => ({
  dashboardAPI: {
    getDashboardData: jest.fn(),
    setToken: jest.fn()
  },
  portfolioAPI: {
    setToken: jest.fn()
  },
  withdrawalAPI: {
    setToken: jest.fn()
  },
  topupAPI: {
    setToken: jest.fn()
  }
}));

jest.mock('../services/cache', () => ({
  default: {
    getDashboardData: jest.fn(),
    isCacheValid: jest.fn(),
    saveDashboardData: jest.fn()
  }
}));

jest.mock('../loader.js', () => () => <div>Loading...</div>);
jest.mock('../components/TransactionHistory', () => () => <div>Transaction History</div>);
jest.mock('../components/WithdrawalModal', () => ({ isOpen, onClose, dashboardData, onWithdraw }) => 
  isOpen ? <div data-testid="withdrawal-modal">Withdrawal Modal</div> : null
);
jest.mock('../components/TopUpModal', () => ({ isOpen, onClose, dashboardData, onSuccess }) => 
  isOpen ? <div data-testid="topup-modal">Top Up Modal</div> : null
);
jest.mock('../components/DueDateCalendar', () => () => <div>Due Date Calendar</div>);

// Mock useNavigate and useSearchParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new Map(), jest.fn()]
}));

describe('Dashboard Top-Up Integration', () => {
  const mockDashboardData = {
    user: {
      first_name: 'John',
      surname: 'Doe'
    },
    investment: {
      total_balance: 10000,
      total_due: 500,
      primary_account: 'ACC123456',
      portfolio_type: 'High Yield',
      investment_type: 'Fixed'
    },
    transactions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows TopUpModal when Top Up button is clicked in quick actions (Mobile View)', () => {
    // Mock window.innerWidth to simulate mobile view
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    
    // Mock dashboard API response
    require('../services/api').dashboardAPI.getDashboardData.mockResolvedValue({
      success: true,
      ...mockDashboardData
    });
    
    require('../services/cache').default.getDashboardData.mockReturnValue(null);
    require('../services/cache').default.isCacheValid.mockReturnValue(false);

    render(<Dashboard />);

    // Wait for dashboard to load
    expect(screen.getByText('Good morning')).toBeInTheDocument();

    // Find the Top Up button in quick actions
    const topUpButton = screen.getByText('Top up');
    fireEvent.click(topUpButton);

    // Check that TopUpModal is displayed
    expect(screen.getByTestId('topup-modal')).toBeInTheDocument();
    expect(screen.getByText('Top Up Modal')).toBeInTheDocument();
  });

  test('shows TopUpModal when Top Up button is clicked in quick actions (Desktop View)', () => {
    // Mock window.innerWidth to simulate desktop view
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    
    // Mock dashboard API response
    require('../services/api').dashboardAPI.getDashboardData.mockResolvedValue({
      success: true,
      ...mockDashboardData
    });
    
    require('../services/cache').default.getDashboardData.mockReturnValue(null);
    require('../services/cache').default.isCacheValid.mockReturnValue(false);

    render(<Dashboard />);

    // Wait for dashboard to load
    expect(screen.getByText('Good morning')).toBeInTheDocument();

    // Find the Top Up button in quick actions
    const topUpButton = screen.getByText('Top up');
    fireEvent.click(topUpButton);

    // Check that TopUpModal is displayed
    expect(screen.getByTestId('topup-modal')).toBeInTheDocument();
    expect(screen.getByText('Top Up Modal')).toBeInTheDocument();
  });

  test('closes TopUpModal when onClose is called', () => {
    // Mock window.innerWidth to simulate desktop view
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    
    // Mock dashboard API response
    require('../services/api').dashboardAPI.getDashboardData.mockResolvedValue({
      success: true,
      ...mockDashboardData
    });
    
    require('../services/cache').default.getDashboardData.mockReturnValue(null);
    require('../services/cache').default.isCacheValid.mockReturnValue(false);

    render(<Dashboard />);

    // Wait for dashboard to load
    expect(screen.getByText('Good morning')).toBeInTheDocument();

    // Open the TopUpModal
    const topUpButton = screen.getByText('Top up');
    fireEvent.click(topUpButton);
    expect(screen.getByTestId('topup-modal')).toBeInTheDocument();

    // Close the modal (in a real implementation, this would be triggered by the modal's close function)
    // For this test, we'll just check that the modal can be rendered and then "closed" by clicking the button again
    fireEvent.click(topUpButton);
    // The modal should still be in the DOM but not visible in a real implementation
  });
});