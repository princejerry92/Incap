import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopUpModal from '../TopUpModal';

// Mock the topupAPI
jest.mock('../../services/api', () => ({
  topupAPI: {
    initiateTopUp: jest.fn()
  }
}));

describe('TopUpModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockDashboardData = {
    investment: {
      total_balance: 10000
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly when open', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        dashboardData={mockDashboardData} 
      />
    );

    expect(screen.getByText('Top Up Investment')).toBeInTheDocument();
    expect(screen.getByText('Top-up Amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    const { container } = render(
      <TopUpModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        dashboardData={mockDashboardData} 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('shows error for invalid amount', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        dashboardData={mockDashboardData} 
      />
    );

    const amountInput = screen.getByPlaceholderText('0.00');
    const continueButton = screen.getByText('Continue');

    // Test empty amount
    fireEvent.click(continueButton);
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();

    // Test negative amount
    fireEvent.change(amountInput, { target: { value: '-1000' } });
    fireEvent.click(continueButton);
    expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();

    // Test amount below minimum
    fireEvent.change(amountInput, { target: { value: '500' } });
    fireEvent.click(continueButton);
    expect(screen.getByText('Minimum top-up amount is ₦1,000')).toBeInTheDocument();
  });

  test('proceeds to confirmation with valid amount', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        dashboardData={mockDashboardData} 
      />
    );

    const amountInput = screen.getByPlaceholderText('0.00');
    const continueButton = screen.getByText('Continue');

    // Enter valid amount
    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(continueButton);

    // Should now show confirmation screen
    expect(screen.getByText('Confirm Top-up')).toBeInTheDocument();
    expect(screen.getByText('₦5,000.00')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <TopUpModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        dashboardData={mockDashboardData} 
      />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});