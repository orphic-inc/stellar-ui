import { render, screen, fireEvent } from '@testing-library/react';
import QuickSearch from '../../components/layout/QuickSearch';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('QuickSearch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders an input per entity', () => {
    render(<QuickSearch />);
    expect(screen.getByPlaceholderText('Releases')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Artists')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Users')).toBeInTheDocument();
  });

  it('navigates with the query on Enter', () => {
    render(<QuickSearch />);
    const input = screen.getByPlaceholderText('Releases');
    fireEvent.change(input, { target: { value: 'miles davis' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/releases?q=miles%20davis');
  });

  it('navigates to the bare path when the query is empty', () => {
    render(<QuickSearch />);
    const input = screen.getByPlaceholderText('Artists');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/artists');
  });

  it('paints inputs from the field role (data-st contract)', () => {
    render(<QuickSearch />);
    expect(screen.getByPlaceholderText('Releases')).toHaveAttribute(
      'data-st',
      'field'
    );
  });
});
