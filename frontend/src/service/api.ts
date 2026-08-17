import axios from 'axios';
import type {
  TigerProfile,
  Sighting,
  CameraTrap,
  AlertItem,
  CameraProcessingBatch,
  ReserveOverviewStats
} from '../types/tiger';
import {
  mockOverviewStats,
  mockTigers,
  mockSightings,
  mockAlerts,
  mockCameraTraps,
  mockBatches
} from '../data/mockData';

// Base Axios instance configured for FastAPI backend
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag to switch to live backend or fallback to rich mock data
const USE_MOCK_FALLBACK = true;

export const tigerService = {
  getOverviewStats: async (): Promise<ReserveOverviewStats> => {
    if (USE_MOCK_FALLBACK) return mockOverviewStats;
    const response = await apiClient.get<ReserveOverviewStats>('/reserve/stats');
    return response.data;
  },

  getAllTigers: async (): Promise<TigerProfile[]> => {
    if (USE_MOCK_FALLBACK) return mockTigers;
    const response = await apiClient.get<TigerProfile[]>('/tigers');
    return response.data;
  },

  getTigerById: async (id: string): Promise<TigerProfile | undefined> => {
    if (USE_MOCK_FALLBACK) {
      return mockTigers.find(
        (t) => t.id.toUpperCase() === id.toUpperCase() || t.code.toUpperCase() === id.toUpperCase()
      );
    }
    const response = await apiClient.get<TigerProfile>(`/tigers/${id}`);
    return response.data;
  },

  getRecentSightings: async (limit = 20): Promise<Sighting[]> => {
    if (USE_MOCK_FALLBACK) return mockSightings.slice(0, limit);
    const response = await apiClient.get<Sighting[]>('/sightings', { params: { limit } });
    return response.data;
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    if (USE_MOCK_FALLBACK) return mockAlerts;
    const response = await apiClient.get<AlertItem[]>('/alerts');
    return response.data;
  },

  getCameraTraps: async (): Promise<CameraTrap[]> => {
    if (USE_MOCK_FALLBACK) return mockCameraTraps;
    const response = await apiClient.get<CameraTrap[]>('/cameras');
    return response.data;
  },

  getProcessingBatches: async (): Promise<CameraProcessingBatch[]> => {
    if (USE_MOCK_FALLBACK) return mockBatches;
    const response = await apiClient.get<CameraProcessingBatch[]>('/processing/batches');
    return response.data;
  }
};
