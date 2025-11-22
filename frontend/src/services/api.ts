import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const response = await this.api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Products
  async getProducts(params?: { categoryId?: string; search?: string; lowStock?: boolean }) {
    const response = await this.api.get('/products', { params });
    return response.data;
  }

  async getProduct(id: string) {
    const response = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: any) {
    const response = await this.api.post('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: any) {
    const response = await this.api.put(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await this.api.delete(`/products/${id}`);
    return response.data;
  }

  async getProductStock(id: string) {
    const response = await this.api.get(`/products/${id}/stock`);
    return response.data;
  }

  // Categories
  async getCategories() {
    const response = await this.api.get('/products/categories/all');
    return response.data;
  }

  async createCategory(data: { name: string; description?: string }) {
    const response = await this.api.post('/products/categories', data);
    return response.data;
  }

  // Warehouses
  async getWarehouses() {
    const response = await this.api.get('/warehouses');
    return response.data;
  }

  async createWarehouse(data: { name: string; code: string; address?: string }) {
    const response = await this.api.post('/warehouses', data);
    return response.data;
  }

  async getLocations(warehouseId?: string) {
    const response = await this.api.get('/warehouses/locations', {
      params: { warehouseId },
    });
    return response.data;
  }

  async createLocation(data: { warehouseId: string; name: string; code: string; type?: string }) {
    const response = await this.api.post('/warehouses/locations', data);
    return response.data;
  }

  // Receipts
  async getReceipts(params?: { status?: string; locationId?: string }) {
    const response = await this.api.get('/receipts', { params });
    return response.data;
  }

  async getReceipt(id: string) {
    const response = await this.api.get(`/receipts/${id}`);
    return response.data;
  }

  async createReceipt(data: any) {
    const response = await this.api.post('/receipts', data);
    return response.data;
  }

  async validateReceipt(id: string) {
    const response = await this.api.put(`/receipts/${id}/validate`);
    return response.data;
  }

  async cancelReceipt(id: string) {
    const response = await this.api.put(`/receipts/${id}/cancel`);
    return response.data;
  }

  // Deliveries
  async getDeliveries(params?: { status?: string; locationId?: string }) {
    const response = await this.api.get('/deliveries', { params });
    return response.data;
  }

  async getDelivery(id: string) {
    const response = await this.api.get(`/deliveries/${id}`);
    return response.data;
  }

  async createDelivery(data: any) {
    const response = await this.api.post('/deliveries', data);
    return response.data;
  }

  async validateDelivery(id: string) {
    const response = await this.api.put(`/deliveries/${id}/validate`);
    return response.data;
  }

  async cancelDelivery(id: string) {
    const response = await this.api.put(`/deliveries/${id}/cancel`);
    return response.data;
  }

  // Transfers
  async getTransfers(params?: { status?: string; fromLocationId?: string; toLocationId?: string }) {
    const response = await this.api.get('/transfers', { params });
    return response.data;
  }

  async getTransfer(id: string) {
    const response = await this.api.get(`/transfers/${id}`);
    return response.data;
  }

  async createTransfer(data: any) {
    const response = await this.api.post('/transfers', data);
    return response.data;
  }

  async validateTransfer(id: string) {
    const response = await this.api.put(`/transfers/${id}/validate`);
    return response.data;
  }

  async cancelTransfer(id: string) {
    const response = await this.api.put(`/transfers/${id}/cancel`);
    return response.data;
  }

  // Adjustments
  async getAdjustments(params?: { status?: string; locationId?: string }) {
    const response = await this.api.get('/adjustments', { params });
    return response.data;
  }

  async getAdjustment(id: string) {
    const response = await this.api.get(`/adjustments/${id}`);
    return response.data;
  }

  async createAdjustment(data: any) {
    const response = await this.api.post('/adjustments', data);
    return response.data;
  }

  async validateAdjustment(id: string) {
    const response = await this.api.put(`/adjustments/${id}/validate`);
    return response.data;
  }

  async cancelAdjustment(id: string) {
    const response = await this.api.put(`/adjustments/${id}/cancel`);
    return response.data;
  }

  // Stock Moves
  async getStockMoves(params?: any) {
    const response = await this.api.get('/adjustments/moves/history', { params });
    return response.data;
  }

  // Dashboard
  async getDashboardKPIs() {
    const response = await this.api.get('/dashboard/kpis');
    return response.data;
  }

  async getDashboardStats(days?: number) {
    const response = await this.api.get('/dashboard/stats', { params: { days } });
    return response.data;
  }
}

export default new ApiService();

