import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalonApp from './App';
import { authAPI, customersAPI, subscriptionsAPI, subscriptionTypesAPI } from './services/api';

// Mock the API services
jest.mock('./services/api', () => ({
  authAPI: {
    login: jest.fn(),
    registerSalon: jest.fn(),
  },
  customersAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  subscriptionsAPI: {
    getByCustomer: jest.fn(),
    create: jest.fn(),
    redeemVisit: jest.fn(),
    updateVisitNote: jest.fn(),
    deleteVisit: jest.fn(),
  },
  subscriptionTypesAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockCustomer = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  join_date: '2023-10-27',
};

const mockSubscription = {
  id: 1,
  customer_id: 1,
  type_id: 1,
  start_date: '2023-10-27',
  is_active: true,
  name: 'Test Subscription',
  price: '100',
  total_visits: '10',
  usedVisits: 1,
  visits: [
    { id: 1, subscription_id: 1, date: '2024-01-15T12:00:00.000Z', note: 'First visit' },
  ],
};

describe('SalonApp Date Formatting', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock successful login
    authAPI.login.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { role: 'owner', salon_id: 1, salon_name: 'Test Salon' },
      },
    });
    
    // Mock data for owner portal
    customersAPI.getAll.mockResolvedValue({ data: [mockCustomer] });
    subscriptionTypesAPI.getAll.mockResolvedValue({ data: [] });
  });

  test('should display visit dates in the correct local format', async () => {
    // Mock subscriptions for the detail view
    subscriptionsAPI.getByCustomer.mockResolvedValue({ data: [mockSubscription] });

    render(<SalonApp />);
    
    // Simulate login
    fireEvent.change(screen.getByPlaceholderText('owner@salon.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Wait for the customer list to appear
    await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on the customer to go to the detail view
    fireEvent.click(screen.getByText('John Doe'));

    // Wait for the subscription detail to appear
    await waitFor(() => {
      expect(screen.getByText('Test Subscription')).toBeInTheDocument();
    });
    
    // Check for the formatted date
    // The date from the mock is '2024-01-15T...'
    // The component should format it as 'Jan 15, 2024'
    const expectedDate = 'Jan 15, 2024';
    await waitFor(() => {
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });
});