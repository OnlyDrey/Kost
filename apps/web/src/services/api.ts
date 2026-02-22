import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Handle FormData
api.interceptors.request.use(
  (config) => {
    // For FormData, let the browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  username: string;
  name: string;
  avatarUrl?: string | null;
  role: 'ADMIN' | 'ADULT' | 'JUNIOR';
  familyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  familyId: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  settlementData?: unknown;
  _count?: { invoices: number; incomes: number };
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  amountCents: number;
}

export interface InvoiceShare {
  id: string;
  invoiceId: string;
  userId: string;
  shareCents: number;
  explanation: string;
  user?: { id: string; name: string; username: string };
}

export interface Payment {
  id: string;
  invoiceId: string;
  paidById: string;
  amountCents: number;
  paidAt: string;
  note?: string;
  paidBy?: { id: string; name: string; username: string };
}

export interface Invoice {
  id: string;
  familyId: string;
  periodId: string;
  category: string;
  vendor: string;
  description?: string;
  dueDate?: string;
  totalCents: number;
  distributionMethod: 'BY_PERCENT' | 'BY_INCOME' | 'FIXED';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  lines?: InvoiceLine[];
  distribution?: unknown;
  shares?: InvoiceShare[];
  payments?: Payment[];
  period?: Period;
}

export interface UserIncome {
  id: string;
  userId: string;
  periodId: string;
  inputType: string;
  inputCents: number;
  normalizedMonthlyGrossCents: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; username: string; role: string };
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

export interface Vendor {
  id: string;
  familyId: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  familyId: string;
  name: string;
  vendor: string;
  category?: string;
  amountCents: number;
  frequency: string;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  distributionMethod: 'BY_PERCENT' | 'BY_INCOME' | 'FIXED';
  distributionRules: any;
  active: boolean;
  lastGenerated?: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const authApi = {
  loginWithPassword: (username: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/login/password', { username, password }),

  registerWithPassword: (name: string, username: string, password: string) =>
    api.post<{ message: string; user: User }>('/auth/register', { name, username, password }),

  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
};

export const userApi = {
  getAll: () =>
    api.get<User[]>('/users'),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  create: (data: { username: string; name: string; role: 'ADMIN' | 'ADULT' | 'JUNIOR'; password?: string }) =>
    api.post<User>('/users', data),

  update: (id: string, data: { username?: string; name?: string; role?: 'ADMIN' | 'ADULT' | 'JUNIOR'; password?: string; avatarUrl?: string | null }) =>
    api.patch<User>(`/users/${id}`, data),

  uploadAvatar: (id: string, formData: FormData) =>
    api.post<User>(`/users/${id}/avatar`, formData),

  removeAvatar: (id: string) =>
    api.delete<User>(`/users/${id}/avatar`),

  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

export const invoiceApi = {
  getAll: (params?: { periodId?: string; status?: string }) =>
    api.get<Invoice[]>('/invoices', { params }),

  getById: (id: string) =>
    api.get<Invoice>(`/invoices/${id}`),

  create: (data: {
    periodId: string;
    category: string;
    vendor: string;
    description?: string;
    dueDate?: string;
    totalCents: number;
    distributionMethod: 'BY_PERCENT' | 'BY_INCOME' | 'FIXED';
    lines?: Array<{ description: string; amountCents: number }>;
    distributionRules?: {
      percentRules?: Array<{ userId: string; percentBasisPoints: number }>;
      fixedRules?: Array<{ userId: string; fixedCents: number }>;
      remainderMethod?: 'EQUAL' | 'BY_INCOME';
      userIds?: string[];
    };
  }) =>
    api.post<Invoice>('/invoices', data),

  update: (id: string, data: Partial<Invoice> & { distributionRules?: any }) =>
    api.patch<Invoice>(`/invoices/${id}`, data),

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

  create: (data: { id: string }) =>
    api.post<Period>('/periods', data),

  close: (id: string) =>
    api.post<Period>(`/periods/${id}/close`),

  getStats: (id: string) =>
    api.get<PeriodStats>(`/periods/${id}/stats`),
};

export const userIncomeApi = {
  getByPeriod: (periodId: string) =>
    api.get<UserIncome[]>('/incomes', { params: { periodId } }),

  upsert: (data: { userId: string; periodId: string; inputType: string; inputCents: number }) =>
    api.post<UserIncome>('/incomes', data),
};

export const paymentApi = {
  create: (invoiceId: string, data: { paidById: string; amountCents: number; note?: string; paidAt?: string }) =>
    api.post<Payment>(`/invoices/${invoiceId}/payments`, data),
};

export const familyApi = {
  getCategories: () =>
    api.get<string[]>('/family/categories'),

  addCategory: (name: string) =>
    api.post<string[]>('/family/categories', { name }),

  removeCategory: (name: string) =>
    api.delete<string[]>(`/family/categories/${encodeURIComponent(name)}`),

  getPaymentMethods: () =>
    api.get<string[]>('/family/payment-methods'),

  addPaymentMethod: (name: string) =>
    api.post<string[]>('/family/payment-methods', { name }),

  removePaymentMethod: (name: string) =>
    api.delete<string[]>(`/family/payment-methods/${encodeURIComponent(name)}`),

  getCurrency: () =>
    api.get<string>('/family/currency'),

  updateCurrency: (currency: string) =>
    api.patch<string>('/family/currency', { currency }),

  getVendors: () =>
    api.get<Vendor[]>('/family/vendors'),

  addVendor: (name: string, logoUrl?: string) =>
    api.post<Vendor>('/family/vendors', { name, logoUrl }),

  updateVendor: (id: string, data: { name?: string; logoUrl?: string | null }) =>
    api.patch<Vendor>(`/family/vendors/${id}`, data),

  removeVendor: (id: string) =>
    api.delete(`/family/vendors/${id}`),

  uploadVendorLogo: (id: string, formData: FormData) =>
    api.post<Vendor>(`/family/vendors/${id}/logo`, formData),
};

export const subscriptionApi = {
  getAll: (activeOnly?: boolean) =>
    api.get<Subscription[]>('/subscriptions', { params: activeOnly !== undefined ? { active: activeOnly } : {} }),

  getById: (id: string) =>
    api.get<Subscription>(`/subscriptions/${id}`),

  create: (data: {
    name: string;
    vendor: string;
    category?: string;
    amountCents: number;
    frequency: string;
    dayOfMonth?: number;
    startDate: string;
    endDate?: string;
    distributionMethod: 'BY_PERCENT' | 'BY_INCOME' | 'FIXED';
    distributionRules?: any;
    active?: boolean;
  }) =>
    api.post<Subscription>('/subscriptions', data),

  update: (id: string, data: Partial<Subscription>) =>
    api.patch<Subscription>(`/subscriptions/${id}`, data),

  toggleActive: (id: string) =>
    api.patch<Subscription>(`/subscriptions/${id}/toggle`),

  delete: (id: string) =>
    api.delete(`/subscriptions/${id}`),

  generateForPeriod: (periodId: string) =>
    api.post<{ message: string; invoices: any[] }>(`/subscriptions/generate/${periodId}`),
};

export default api;
