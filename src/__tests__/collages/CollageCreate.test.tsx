import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../testUtils';
import CollageCreate from '../../components/collages/CollageCreate';

const mockCreateCollage = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/collageApi', () => ({
  useCreateCollageMutation: () => [mockCreateCollage, { isLoading: false }]
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('CollageCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCollage.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 88 })
    });
  });

  it('submits trimmed tags and navigates to the new collage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CollageCreate />);

    await user.type(screen.getByLabelText(/^name$/i), 'Road Trip');
    await user.selectOptions(screen.getByLabelText(/category/i), '2');
    await user.type(
      screen.getByLabelText(/description/i),
      'A long enough description for the collage form.'
    );
    await user.type(
      screen.getByLabelText(/tags/i),
      ' jazz,  synth , , ambient '
    );
    await user.click(screen.getByRole('button', { name: /create collage/i }));

    await waitFor(() => {
      expect(mockCreateCollage).toHaveBeenCalledWith({
        name: 'Road Trip',
        description: 'A long enough description for the collage form.',
        categoryId: 2,
        tags: ['jazz', 'synth', 'ambient']
      });
      expect(mockNavigate).toHaveBeenCalledWith('/private/collages/88');
    });
  });

  it('shows the backend error when creation fails', async () => {
    const user = userEvent.setup();
    mockCreateCollage.mockReturnValue({
      unwrap: () => Promise.reject({ data: { msg: 'Name already exists' } })
    });

    renderWithProviders(<CollageCreate />);

    await user.type(screen.getByLabelText(/^name$/i), 'Duplicate');
    await user.type(
      screen.getByLabelText(/description/i),
      'A long enough description for the collage form.'
    );
    await user.click(screen.getByRole('button', { name: /create collage/i }));

    await waitFor(() => {
      expect(screen.getByText('Name already exists')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
