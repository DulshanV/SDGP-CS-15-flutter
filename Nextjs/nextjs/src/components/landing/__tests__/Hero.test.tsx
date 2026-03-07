import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '../Hero';

// Mock the HeroCanvas component since it uses Three.js
vi.mock('../HeroCanvas', () => ({
  default: () => <div data-testid="hero-canvas">Canvas Mock</div>,
}));

describe('Hero Component', () => {
  it('should render the main heading', () => {
    render(<Hero />);

    const heading = screen.getByRole('heading', {
      name: /From Product to HS.Code/i
    });
    expect(heading).toBeInTheDocument();
  });

  it('should render the subheading', () => {
    render(<Hero />);

    const subheading = screen.getByText(/hybrid AI search and real‑time brand recognition/i);
    expect(subheading).toBeInTheDocument();
  });

  it('should render the HeroCanvas component', () => {
    render(<Hero />);

    const canvas = screen.getByTestId('hero-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render CTA buttons', () => {
    render(<Hero />);

    const searchButton = screen.getByRole('link', { name: /Start Searching Free/i });
    const learnButton = screen.getByRole('link', { name: /See How It Works/i });

    expect(searchButton).toBeInTheDocument();
    expect(learnButton).toBeInTheDocument();
  });

  it('should have correct href for search button', () => {
    render(<Hero />);

    const searchButton = screen.getByRole('link', { name: /Start Searching Free/i });
    expect(searchButton).toHaveAttribute('href', '/search');
  });
});
