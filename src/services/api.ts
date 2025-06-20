import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../config/env';

// Network error types
interface NetworkError extends Error {
  code?: string;
  response?: {
    status: number;
    data: any;
  };
  config?: {
    url?: string;
    method?: string;
  };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: ENV.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.log('No auth token found, proceeding without authentication');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: NetworkError) => {
        // Log detailed error information for debugging
        console.log('API Error Details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });

        if (error.response?.status === 401) {
          // Token expired or invalid, clear stored token
          await SecureStore.deleteItemAsync('auth_token');
          console.log('Auth token cleared due to 401 error');
        }

        // Add more specific error information
        if (error.code === 'ECONNREFUSED') {
          error.message = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
          error.message = 'Network connection failed. Please check your internet connection.';
        } else if (error.response?.status === 500) {
          error.message = `Server error: ${error.response.data?.message || 'Internal server error'}`;
        } else if (error.response?.status === 404) {
          error.message = 'API endpoint not found';
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
          error.message = error.response.data?.message || 'Client error occurred';
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await SecureStore.setItemAsync('auth_token', response.data.access_token);
    }
    return response.data;
  }

  async register(email: string, password: string, fullName?: string) {
    const response = await this.api.post('/auth/register', {
      email,
      password,
      fullName
    });
    if (response.data.access_token) {
      await SecureStore.setItemAsync('auth_token', response.data.access_token);
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
  }

  // Health check endpoint
  async checkConnection() {
    try {
      console.log(`Testing connection to: ${ENV.API_BASE_URL}`);
      const response = await this.api.get('/');
      console.log('Connection test successful:', response.status);
      return { success: true, status: response.status };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // User endpoints
  async getUsers() {
    try {
      console.log(`Fetching users from: ${ENV.API_BASE_URL}/users`);
      const response = await this.api.get('/users');
      console.log('Users fetched successfully:', response.data?.length || 0, 'users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      // Re-throw the error instead of returning mock data
      throw error;
    }
  }

  async getUser(id: string) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.api.patch(`/users/${id}`, data);
    return response.data;
  }

  // Messages endpoints
  async getMessages(recipientId?: string) {
    try {
      const url = recipientId ? `/messages?recipientId=${recipientId}` : '/messages';
      console.log(`Fetching messages from: ${ENV.API_BASE_URL}${url}`);
      const response = await this.api.get(url);
      console.log('Messages fetched successfully:', response.data?.length || 0, 'messages');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Re-throw the error instead of returning mock data
      // This allows the UI to handle the error appropriately
      throw error;
    }
  }

  async sendMessage(recipientId: string, content: string, type: string = 'TEXT') {
    const response = await this.api.post('/messages', {
      recipientId,
      content,
      type,
    });
    return response.data;
  }

  async markMessageAsRead(messageId: string) {
    const response = await this.api.patch(`/messages/${messageId}/read`);
    return response.data;
  }

  // Photos endpoints
  async getPhotos() {
    const response = await this.api.get('/photos');
    return response.data;
  }

  async uploadPhoto(formData: FormData) {
    const response = await this.api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deletePhoto(photoId: string) {
    const response = await this.api.delete(`/photos/${photoId}`);
    return response.data;
  }

  // Video calls endpoints
  async getVideoCalls() {
    const response = await this.api.get('/video-calls');
    return response.data;
  }

  async initiateCall(calleeId: string) {
    const response = await this.api.post('/video-calls', { calleeId });
    return response.data;
  }

  async endCall(callId: string) {
    const response = await this.api.patch(`/video-calls/${callId}/end`);
    return response.data;
  }

  // Proposals endpoints
  async getProposals() {
    const response = await this.api.get('/proposals');
    return response.data;
  }

  async createProposal(data: any) {
    const response = await this.api.post('/proposals', data);
    return response.data;
  }

  async respondToProposal(proposalId: string, response: 'ACCEPTED' | 'DECLINED') {
    const apiResponse = await this.api.patch(`/proposals/${proposalId}/respond`, {
      response,
    });
    return apiResponse.data;
  }
}

export const apiService = new ApiService();
export default apiService;
