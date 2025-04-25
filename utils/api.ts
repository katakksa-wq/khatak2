// Compatibility layer for existing code
// This file provides backward compatibility with the old API utility functions
// New code should use the apiClient from apiClient.ts directly

import { apiClient, ApiResponse } from './apiClient';

// Legacy GET request function
export const getData = async <T>(endpoint: string, token?: string): Promise<ApiResponse<T>> => {
  console.warn('Using deprecated getData function, consider switching to apiClient');
  return apiClient.get<T>(endpoint);
};

// Legacy POST request function
export const postData = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
  console.warn('Using deprecated postData function, consider switching to apiClient');
  return apiClient.post<T>(endpoint, data);
};

// Legacy PUT request function
export const putData = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
  console.warn('Using deprecated putData function, consider switching to apiClient');
  return apiClient.put<T>(endpoint, data);
};

// Legacy PATCH request function
export const patchData = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
  console.warn('Using deprecated patchData function, consider switching to apiClient');
  return apiClient.patch<T>(endpoint, data);
};

// Legacy DELETE request function
export const deleteData = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  console.warn('Using deprecated deleteData function, consider switching to apiClient');
  return apiClient.delete<T>(endpoint);
}; 