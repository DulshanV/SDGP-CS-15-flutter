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
      name: /Find Your HS Code in Seconds/i 
    });
    expect(heading).toBeInTheDocument();
  });

  it('should render the subheading', () => {
    render(<Hero />);
    
    const subheading = screen.getByText(/AI-powered search for Sri Lankan customs/i);
    expect(subheading).toBeInTheDocument();
  });

  it('should render the HeroCanvas component', () => {
    render(<Hero />);
    
    const canvas = screen.getByTestId('hero-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render CTA buttons', () => {
    render(<Hero />);
    
    const searchButton = screen.getByRole('link', { name: /Start Searching/i });
    const learnButton = screen.getByRole('link', { name: /Learn More/i });
    
    expect(searchButton).toBeInTheDocument();
    expect(learnButton).toBeInTheDocument();
  });

  it('should have correct href for search button', () => {
    render(<Hero />);
    
    const searchButton = screen.getByRole('link', { name: /Start Searching/i });
    expect(searchButton).toHaveAttribute('href', '/search');
  });
});
