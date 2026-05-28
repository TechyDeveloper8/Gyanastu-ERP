
import { api } from './api';
import { User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<any> => {
    // Call the real backend endpoint
    const response: any = await api.login({ email, password });
    
    if (response.requirePasswordChange) {
      return response;
    }

    // Store the JWT token
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response.user;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    localStorage.removeItem('gyanastu_user');
  },

  changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<User> => {
    const response: any = await api.changePassword({ userId, oldPassword, newPassword });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response.user;
  },

  getUserProfile: async (): Promise<User> => {
    const response: any = await api.getProfile();
    return response.user;
  }
};
