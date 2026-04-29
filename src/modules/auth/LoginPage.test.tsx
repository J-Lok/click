import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// Mock auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    isAuthenticated: false,
  })),
}));

// Mock toast
vi.mock('../../shared/components/ToastProvider', () => ({
  useToast: () => vi.fn(),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('shows validation errors for short credentials', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'ab');
    await user.type(screen.getByLabelText(/mot de passe/i), '123');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    expect(screen.getByText(/min\. 3 caractères/i)).toBeInTheDocument();
  });
});
