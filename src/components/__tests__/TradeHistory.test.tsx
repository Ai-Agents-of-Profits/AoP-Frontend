import { render, screen, fireEvent } from '@testing-library/react';
import { useAccount, useContractEvent } from 'wagmi';
import { TradeHistory } from '../TradeHistory';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useContractEvent: jest.fn(),
}));

describe('TradeHistory', () => {
  const mockAddress = '0x123';
  let contractEventListeners: { [key: string]: (log: any) => void } = {};

  beforeEach(() => {
    (useAccount as jest.Mock).mockReturnValue({
      address: mockAddress,
    });

    // Mock contract event listeners
    (useContractEvent as jest.Mock).mockImplementation(({ eventName, listener }) => {
      contractEventListeners[eventName] = listener;
    });
  });

  it('shows empty state when no trades', () => {
    render(<TradeHistory />);
    expect(screen.getByText('No trades found')).toBeInTheDocument();
  });

  it('displays deposit event correctly', () => {
    render(<TradeHistory />);

    // Simulate a deposit event
    contractEventListeners['Deposit']({
      args: {
        user: mockAddress,
        token: '0xtoken',
        amount: BigInt(1000000000000000000), // 1 ETH
        shares: BigInt(1000000000000000000), // 1 Share
      },
      transactionHash: '0xtx1',
      logIndex: 0,
    });

    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText(/1.0000 ETH/)).toBeInTheDocument();
    expect(screen.getByText(/1.0000/)).toBeInTheDocument(); // Shares
  });

  it('filters trades correctly', () => {
    render(<TradeHistory />);

    // Add multiple types of trades
    contractEventListeners['Deposit']({
      args: {
        user: mockAddress,
        token: '0xtoken',
        amount: BigInt(1000000000000000000),
        shares: BigInt(1000000000000000000),
      },
      transactionHash: '0xtx1',
      logIndex: 0,
    });

    contractEventListeners['WithdrawalRequested']({
      args: {
        user: mockAddress,
        shareAmount: BigInt(500000000000000000),
      },
      transactionHash: '0xtx2',
      logIndex: 0,
    });

    // Initially should see both trades
    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Withdrawal Requested')).toBeInTheDocument();

    // Filter to only deposits
    const filter = screen.getByRole('combobox');
    fireEvent.change(filter, { target: { value: 'deposit' } });

    // Should only see deposit
    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.queryByText('Withdrawal Requested')).not.toBeInTheDocument();
  });

  it('paginates trades correctly', async () => {
    render(<TradeHistory />);

    // Add 11 deposits to trigger pagination
    for (let i = 0; i < 11; i++) {
      contractEventListeners['Deposit']({
        args: {
          user: mockAddress,
          token: '0xtoken',
          amount: BigInt((i + 1) * 1000000000000000000),
          shares: BigInt(1000000000000000000),
        },
        transactionHash: `0xtx${i}`,
        logIndex: 0,
      });
    }

    // Should show pagination controls
    expect(screen.getByText('Showing page 1')).toBeInTheDocument();
    expect(screen.getByText('of 2')).toBeInTheDocument();

    // Should show first 10 trades on first page
    expect(screen.getAllByText(/ETH/).length).toBe(10);

    // Go to next page
    fireEvent.click(screen.getByText('Next'));

    // Should show remaining trade
    expect(screen.getAllByText(/ETH/).length).toBe(1);
  });

  it('resets pagination when filter changes', () => {
    render(<TradeHistory />);

    // Add many trades of different types
    for (let i = 0; i < 11; i++) {
      contractEventListeners['Deposit']({
        args: {
          user: mockAddress,
          token: '0xtoken',
          amount: BigInt((i + 1) * 1000000000000000000),
          shares: BigInt(1000000000000000000),
        },
        transactionHash: `0xtx${i}`,
        logIndex: 0,
      });
    }

    // Go to second page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Showing page 2')).toBeInTheDocument();

    // Change filter
    const filter = screen.getByRole('combobox');
    fireEvent.change(filter, { target: { value: 'withdrawal' } });

    // Should reset to page 1
    expect(screen.getByText('Showing page 1')).toBeInTheDocument();
  });
});
