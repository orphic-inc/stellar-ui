import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, createTestStore } from '../testUtils';
import { setCredentials } from '../../store/slices/authSlice';
import StylesheetEditorPage from '../../components/stylesheets/StylesheetEditorPage';

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../store/services/stylesheetApi', () => ({
  useCreateAuthorStylesheetMutation: () => [mockCreate, { isLoading: false }],
  useUpdateAuthorStylesheetMutation: () => [mockUpdate, { isLoading: false }],
  useGetAuthorStylesheetQuery: (...args: unknown[]) => mockGet(...args)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderAt = (path: string) => {
  const store = createTestStore();
  store.dispatch(
    setCredentials({
      id: 7,
      username: 'kai',
      userRank: { name: 'User', level: 100, permissions: {} }
    } as never)
  );
  renderWithProviders(
    <Routes>
      <Route path="/stylesheets/new" element={<StylesheetEditorPage />} />
      <Route path="/stylesheets/:id/edit" element={<StylesheetEditorPage />} />
    </Routes>,
    { store, initialEntries: [path] }
  );
};

const fill = async (name: string, source: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^name/i), name);
  // `{` starts a userEvent key descriptor; paste the CSS instead.
  await user.click(screen.getByLabelText('CSS'));
  await user.paste(source);
  return user;
};

describe('StylesheetEditorPage (#450)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    mockUpdate.mockReturnValue({ unwrap: () => Promise.resolve({ id: 3 }) });
  });

  describe('a new sheet', () => {
    it('creates it and returns to My stylesheets', async () => {
      renderAt('/stylesheets/new');
      const user = await fill('Dusk', 'body { color: red; }');
      await user.click(
        screen.getByRole('button', { name: /save stylesheet/i })
      );
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Dusk',
        source: 'body { color: red; }'
      });
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/stylesheets')
      );
    });

    it('counts the CSS against the 100,000-character cap', async () => {
      renderAt('/stylesheets/new');
      await fill('Dusk', 'a{}');
      expect(screen.getByText('3 / 100,000')).toBeInTheDocument();
      expect(screen.getByLabelText('CSS')).toHaveAttribute(
        'maxLength',
        '100000'
      );
    });

    it('reads a chosen .css file into the field, uploading nothing', async () => {
      const user = userEvent.setup();
      renderAt('/stylesheets/new');
      const file = new File(['p { margin: 0; }'], 'theme.css', {
        type: 'text/css'
      });
      await user.upload(screen.getByLabelText(/load a \.css file/i), file);
      await waitFor(() =>
        expect(screen.getByLabelText('CSS')).toHaveValue('p { margin: 0; }')
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lists every violation the api found, unmerged', async () => {
      mockCreate.mockReturnValue({
        unwrap: () =>
          Promise.reject({
            data: {
              errors: {
                source: [
                  'url(): only /api/asset/<sha256> or a relative path (line 1)',
                  '@import is not allowed (line 2)'
                ]
              }
            }
          })
      });
      renderAt('/stylesheets/new');
      const user = await fill('Dusk', 'body { color: red; }');
      await user.click(
        screen.getByRole('button', { name: /save stylesheet/i })
      );
      const items = await screen.findAllByRole('listitem');
      expect(items.map((li) => li.textContent)).toEqual([
        'url(): only /api/asset/<sha256> or a relative path (line 1)',
        '@import is not allowed (line 2)'
      ]);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows the api's message for a refusal that isn't about a field", async () => {
      mockCreate.mockReturnValue({
        unwrap: () =>
          Promise.reject({
            data: { msg: 'Author stylesheet limit reached (1)' }
          })
      });
      renderAt('/stylesheets/new');
      const user = await fill('Dusk', 'body { color: red; }');
      await user.click(
        screen.getByRole('button', { name: /save stylesheet/i })
      );
      expect(
        await screen.findByText('Author stylesheet limit reached (1)')
      ).toBeInTheDocument();
    });

    it("doesn't warn about adopters for a sheet nobody has yet", () => {
      renderAt('/stylesheets/new');
      expect(screen.queryByText(/everyone who has adopted it/i)).toBeNull();
    });
  });

  describe('an existing sheet', () => {
    const own = {
      id: 3,
      authorId: 7,
      name: 'Dusk',
      source: 'a { color: blue; }'
    };

    it('loads its source, warns about adopters, and saves in place', async () => {
      const user = userEvent.setup();
      mockGet.mockReturnValue({ data: own, isLoading: false, isError: false });
      renderAt('/stylesheets/3/edit');
      expect(mockGet).toHaveBeenCalledWith(3);
      expect(screen.getByLabelText('CSS')).toHaveValue('a { color: blue; }');
      expect(
        screen.getByText(
          'Saving updates this sheet for everyone who has adopted it.'
        )
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', { name: /save stylesheet/i })
      );
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 3,
        name: 'Dusk',
        source: 'a { color: blue; }'
      });
    });

    it("refuses to edit someone else's sheet", () => {
      mockGet.mockReturnValue({
        data: { ...own, authorId: 99 },
        isLoading: false,
        isError: false
      });
      renderAt('/stylesheets/3/edit');
      expect(
        screen.getByText('You can only edit your own stylesheets.')
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('CSS')).toBeNull();
    });

    it('says a missing or deleted sheet is not available', () => {
      mockGet.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true
      });
      renderAt('/stylesheets/3/edit');
      expect(
        screen.getByText("This stylesheet isn't available.")
      ).toBeInTheDocument();
    });
  });
});
