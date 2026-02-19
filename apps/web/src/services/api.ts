import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type definitions for API responses
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  familyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  familyId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  familyId: string;
  periodId: string;
  uploadedBy: string;
  description: string;
  totalAmountCents: number;
  distributionMethod: 'EQUAL' | 'CUSTOM' | 'INCOME_BASED';
  category?: string;
  paidBy?: string;
  invoiceDate: string;
  dueDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  uploader?: User;
  period?: Period;
  shares?: Share[];
}

export interface Share {
  id: string;
  invoiceId: string;
  userId: string;
  shareCents: number;
  percentageShare: number;
  createdAt: string;
  user?: User;
}

export interface UserIncome {
  id: string;
  userId: string;
  periodId: string;
  incomeCents: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PeriodStats {
  totalInvoices: number;
  totalAmountCents: number;
  userShares: Array<{
    userId: string;
    userName: string;
    totalShareCents: number;
  }>;
}

// API functions
export const authApi = {
  loginWithPassword: (email: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/login/password', { email, password }),

  registerWithPassword: (name: string, email: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/register', { name, email, password }),

  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};

export const invoiceApi = {
  getAll: (params?: { periodId?: string; status?: string }) =>
    api.get<Invoice[]>('/invoices', { params }),

  getById: (id: string) =>
    api.get<Invoice>(`/invoices/${id}`),

  create: (data: {
    description: string;
    totalAmountCents: number;
    distributionMethod: 'EQUAL' | 'CUSTOM' | 'INCOME_BASED';
    category?: string;
    paidBy?: string;
    invoiceDate: string;
    dueDate?: string;
    customShares?: Array<{ userId: string; shareCents: number }>;
  }) =>
    api.post<Invoice>('/invoices', data),

  update: (id: string, data: Partial<Invoice>) =>
    api.put<Invoice>(`/invoices/${id}`, data),

  delete: (id: string) =>
    api.delete(`/invoices/${id}`),
};

export const periodApi = {
  getAll: () =>
    api.get<Period[]>('/periods'),

  getById: (id: string) =>
    api.get<Period>(`/periods/${id}`),

  getCurrent: () =>
    api.get<Period>('/periods/current'),

  create: (data: { name: string; startDate: string; endDate: string }) =>
    api.post<Period>('/periods', data),

  close: (id: string) =>
    api.post<Period>(`/periods/${id}/close`),

  getStats: (id: string) =>
    api.get<PeriodStats>(`/periods/${id}/stats`),
};

export const userIncomeApi = {
  getByPeriod: (periodId: string) =>
    api.get<UserIncome[]>(`/user-incomes/period/${periodId}`),

  upsert: (data: { userId: string; periodId: string; incomeCents: number }) =>
    api.post<UserIncome>('/user-incomes', data),
};

export default api;
