import { render, screen } from '@testing-library/react';
import { useAccount, useContractRead } from 'wagmi';
import { PortfolioCard } from '../PortfolioCard';
import { formatEther } from 'viem';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useContractRead: jest.fn(),
}));

// Mock viem
jest.mock('viem', () => ({
  formatEther: jest.fn(),
}));

describe('PortfolioCard', () => {
  beforeEach(() => {
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x123',
    });
    (formatEther as jest.Mock).mockImplementation((value) => 
      (Number(value) / 1e18).toString()
    );
  });

  it('renders portfolio value correctly', () => {
    // Mock contract read responses
    (useContractRead as jest.Mock)
      .mockReturnValueOnce({
        data: BigInt(2000000000000000000n), // 2 shares
      })
      .mockReturnValueOnce({
        data: BigInt(1500000000000000000n), // NAV of 1.5
      });

    render(<PortfolioCard />);

    // Check if portfolio value is displayed correctly (2 * 1.5 = 3.0)
    expect(screen.getByText('$3.00')).toBeInTheDocument();
    expect(screen.getByText('2 Shares')).toBeInTheDocument();
    expect(screen.getByText('NAV per Share: $1.5')).toBeInTheDocument();
  });

  it('shows zero values when no data is available', () => {
    // Mock contract read responses with null data
    (useContractRead as jest.Mock).mockReturnValue({
      data: null,
    });

    render(<PortfolioCard />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0 Shares')).toBeInTheDocument();
    expect(screen.getByText('NAV per Share: $0')).toBeInTheDocument();
  });

  it('updates when share or NAV values change', () => {
    const { rerender } = render(<PortfolioCard />);

    // Initial values
    (useContractRead as jest.Mock)
      .mockReturnValueOnce({
        data: BigInt(1000000000000000000n), // 1 share
      })
      .mockReturnValueOnce({
        data: BigInt(1000000000000000000n), // NAV of 1
      });

    rerender(<PortfolioCard />);
    expect(screen.getByText('$1.00')).toBeInTheDocument();

    // Updated values
    (useContractRead as jest.Mock)
      .mockReturnValueOnce({
        data: BigInt(2000000000000000000n), // 2 shares
      })
      .mockReturnValueOnce({
        data: BigInt(2000000000000000000n), // NAV of 2
      });

    rerender(<PortfolioCard />);
    expect(screen.getByText('$4.00')).toBeInTheDocument();
  });
});
