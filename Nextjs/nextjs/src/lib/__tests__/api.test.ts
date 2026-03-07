import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { searchHSCodes, fetchHSCodeDetail } from '../api';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API - searchHSCodes', () => {
  it('should call axios with correct URL and return data', async () => {
    const mockData = {
      query: 'tea',
      results: [
        { hscode: '0902.10', description: 'Green tea' },
        { hscode: '0902.20', description: 'Black tea' },
      ],
      total_results: 2,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await searchHSCodes('tea');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/search'),
      expect.objectContaining({
        params: expect.objectContaining({ q: 'tea' }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it('should handle search errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(searchHSCodes('tea')).rejects.toThrow('Network error');
  });

  it('should pass limit parameter correctly', async () => {
    const mockData = {
      query: 'coffee',
      results: [],
      total_results: 0,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    await searchHSCodes('coffee', 10);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          q: 'coffee',
          limit: 10,
        }),
      })
    );
  });
});

describe('API - fetchHSCodeDetail', () => {
  it('should fetch HS code details', async () => {
    const mockDetail = {
      hscode: '0902.10',
      description: 'Green tea',
      chapter: '09',
      section: 'Section II',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockDetail });

    const result = await fetchHSCodeDetail('0902.10');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/hs/0902.10')
    );
    expect(result).toEqual(mockDetail);
  });

  it('should handle 404 errors for non-existent codes', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    await expect(fetchHSCodeDetail('9999.99')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
