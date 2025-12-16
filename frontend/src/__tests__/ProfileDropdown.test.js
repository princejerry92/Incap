import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileDropdown from '../components/ProfileDropdown';

// Mock all the services and components that ProfileDropdown depends on
jest.mock('../services/api', () => ({
  clearSessionToken: jest.fn(),
  dashboardAPI: {
    cleanupRealTimeListeners: jest.fn()
  }
}));

jest.mock('../services/cache', () => ({
  default: {
    clearAll: jest.fn()
  }
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('ProfileDropdown', () => {
  const mockDashboardData = {
    user: {
      first_name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com'
    },
    investment: {
      total_balance: 10000,
      total_due: 500,
      primary_account: 'ACC123456',
      portfolio_type: 'High Yield',
      investment_type: 'Fixed'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.confirm mock
    window.confirm = jest.fn(() => true);
  });

  test('renders profile dropdown with user information', () => {
    render(
      <ProfileDropdown 
        dashboardData={mockDashboardData}
        isOpen={true}
        onClose={jest.fn()}
        isMobile={false}
      />
    );

    // Check that user information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked and confirmed', () => {
    const { clearSessionToken } = require('../services/api');
    const { default: cacheService } = require('../services/cache');
    const { dashboardAPI } = require('../services/api');

    render(
      <ProfileDropdown 
        dashboardData={mockDashboardData}
        isOpen={true}
        onClose={jest.fn()}
        isMobile={false}
      />
    );

    // Find and click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Check that confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');

    // Check that all logout functions were called
    expect(clearSessionToken).toHaveBeenCalled();
    expect(cacheService.clearAll).toHaveBeenCalled();
    expect(dashboardAPI.cleanupRealTimeListeners).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('does not logout when confirmation is cancelled', () => {
    const { clearSessionToken } = require('../services/api');
    const { default: cacheService } = require('../services/cache');
    const { dashboardAPI } = require('../services/api');
    
    // Mock window.confirm to return false (user cancels)
    window.confirm = jest.fn(() => false);

    render(
      <ProfileDropdown 
        dashboardData={mockDashboardData}
        isOpen={true}
        onClose={jest.fn()}
        isMobile={false}
      />
    );

    // Find and click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Check that confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');

    // Check that logout functions were NOT called
    expect(clearSessionToken).not.toHaveBeenCalled();
    expect(cacheService.clearAll).not.toHaveBeenCalled();
    expect(dashboardAPI.cleanupRealTimeListeners).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});