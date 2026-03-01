import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { search, getHsCodeDetail } from '../api';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API - search', () => {
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

    const result = await search('tea');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/search'),
      expect.objectContaining({
        params: expect.objectContaining({ q: 'tea' }),
      })
    );
    expect(result.query).toEqual(mockData.query);
  });

  it('should handle search errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(search('tea')).rejects.toThrow('Network error');
  });

  it('should pass limit parameter correctly', async () => {
    const mockData = {
      query: 'coffee',
      results: [],
      total_results: 0,
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    await search('coffee', 10);

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

describe('API - getHsCodeDetail', () => {
  it('should fetch HS code details', async () => {
    const mockDetail = {
      hscode: '0902.10',
      description: 'Green tea',
      chapter: '09',
      section: 'Section II',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockDetail });

    const result = await getHsCodeDetail('0902.10');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/hs/0902.10'),
      expect.any(Object)
    );
    expect(result.hscode).toEqual(mockDetail.hscode);
  });

  it('should handle 404 errors for non-existent codes', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    await expect(getHsCodeDetail('9999.99')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
