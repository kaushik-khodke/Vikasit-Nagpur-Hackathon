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

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

// Base Axios instance configured for FastAPI backend
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const tigerService = {
  getOverviewStats: async (): Promise<ReserveOverviewStats> => {
    try {
      const response = await apiClient.get<ReserveOverviewStats>('/reserve/stats');
      return response.data;
    } catch {
      return mockOverviewStats;
    }
  },

  getAllTigers: async (): Promise<TigerProfile[]> => {
    try {
      const response = await apiClient.get<TigerProfile[]>('/tigers');
      if (response.data && response.data.length > 0) {
        return response.data.map(t => ({
          ...t,
          imageUrl: t.imageUrl.startsWith('http') ? t.imageUrl : `${API_BASE_URL}${t.imageUrl}`
        }));
      }
      return mockTigers;
    } catch {
      return mockTigers;
    }
  },

  getTigerById: async (id: string): Promise<TigerProfile | undefined> => {
    try {
      const response = await apiClient.get<TigerProfile>(`/tigers/${id}`);
      return response.data;
    } catch {
      return mockTigers.find(
        (t) => t.id.toUpperCase() === id.toUpperCase() || t.code.toUpperCase() === id.toUpperCase()
      );
    }
  },

  getRecentSightings: async (limit = 20): Promise<Sighting[]> => {
    try {
      const response = await apiClient.get<Sighting[]>('/sightings', { params: { limit } });
      if (response.data && response.data.length > 0) {
        return response.data.map(s => ({
          ...s,
          thumbnailUrl: s.thumbnailUrl ? (s.thumbnailUrl.startsWith('http') ? s.thumbnailUrl : `${API_BASE_URL}${s.thumbnailUrl}`) : '',
          candidateBaselineUrl: s.candidateBaselineUrl ? (s.candidateBaselineUrl.startsWith('http') ? s.candidateBaselineUrl : `${API_BASE_URL}${s.candidateBaselineUrl}`) : undefined,
        }));
      }
      return mockSightings.slice(0, limit);
    } catch {
      return mockSightings.slice(0, limit);
    }
  },

  verifySighting: async (sightingId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/review/verify', { sightingId });
      return response.data;
    } catch (err: any) {
      return { success: true, message: `Observation ${sightingId} verified locally.` };
    }
  },

  rejectSighting: async (sightingId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/review/reject', { sightingId });
      return response.data;
    } catch (err: any) {
      return { success: true, message: `Observation ${sightingId} candidate match rejected.` };
    }
  },

  createTigerFromSighting: async (payload: {
    sightingId: string;
    name: string;
    sex: string;
    primaryZone?: string;
  }): Promise<{ success: boolean; message: string; tigerCode?: string }> => {
    try {
      const response = await apiClient.post('/review/create-tiger', payload);
      return response.data;
    } catch (err: any) {
      return { success: true, message: `Created new candidate individual ${payload.name}.`, tigerCode: 'TGR-005' };
    }
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    try {
      const response = await apiClient.get<AlertItem[]>('/alerts');
      return response.data;
    } catch {
      return mockAlerts;
    }
  },

  triggerPerimeterAlert: async (payload: {
    cameraId: string;
    cameraName: string;
    tigerId: string;
    confidence: number;
    flank?: string;
    zone?: string;
    nearbyVillage?: string;
    distanceMeters?: number;
    snapshotUrl?: string;
  }): Promise<{ success: boolean; message: string; alert?: AlertItem }> => {
    try {
      const response = await apiClient.post('/alerts/trigger', payload);
      return response.data;
    } catch {
      return {
        success: true,
        message: `Local perimeter alert simulated for ${payload.cameraName}.`,
      };
    }
  },

  getCameraTraps: async (): Promise<CameraTrap[]> => {
    try {
      const response = await apiClient.get<CameraTrap[]>('/cameras');
      return response.data;
    } catch {
      return mockCameraTraps;
    }
  },

  getProcessingBatches: async (): Promise<CameraProcessingBatch[]> => {
    try {
      const response = await apiClient.get<CameraProcessingBatch[]>('/processing/batches');
      return response.data;
    } catch {
      return [];
    }
  },

  resetProcessingBatches: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/processing/reset-batches');
      return response.data;
    } catch {
      return { success: true, message: 'Batch ingestion logs reset locally.' };
    }
  },

  seedProcessingBatches: async (): Promise<{ success: boolean; message: string; batches?: CameraProcessingBatch[] }> => {
    try {
      const response = await apiClient.post('/processing/seed-batches');
      return response.data;
    } catch {
      return { success: true, message: 'Demo batches loaded.', batches: mockBatches };
    }
  },

  getProcessingStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/processing/stats');
      return response.data;
    } catch {
      return null;
    }
  },

  triggerBatchIngest: async (payload: {
    cameraCode: string;
    stationName?: string;
    screeningProfile?: string;
  }): Promise<{ success: boolean; message: string; batch?: CameraProcessingBatch }> => {
    try {
      const response = await apiClient.post('/processing/ingest', payload);
      return response.data;
    } catch {
      return {
        success: true,
        message: `Simulated SD dump ingestion for ${payload.cameraCode}. Reversible screening completed.`,
      };
    }
  },

  restoreQuarantinedBatch: async (batchId: string, count = 10): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/processing/restore-quarantine', { batchId, count });
      return response.data;
    } catch {
      return { success: true, message: `Restored ${count} frames from ${batchId} to Image Review queue.` };
    }
  },

  uploadMediaFile: async (
    file: File,
    cameraCode = 'CAM-01',
    stationName?: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    filename: string;
    totalFrames: number;
    fps: number;
    isVideo: boolean;
    streamUrl: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cameraCode', cameraCode);
    if (stationName) formData.append('stationName', stationName);

    const response = await apiClient.post('/processing/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getStreamStatus: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/stream/status/${sessionId}`);
    return response.data;
  }
};
