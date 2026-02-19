import Dexie, { Table } from 'dexie';
import { Invoice, Period, User } from '../services/api';

export interface CachedInvoice extends Invoice {
  cachedAt: number;
}

export interface CachedPeriod extends Period {
  cachedAt: number;
}

export interface CachedUser extends User {
  cachedAt: number;
}

export class KostDB extends Dexie {
  invoices!: Table<CachedInvoice>;
  periods!: Table<CachedPeriod>;
  users!: Table<CachedUser>;

  constructor() {
    super('KostDB');

    this.version(1).stores({
      invoices: 'id, periodId, uploadedBy, status, cachedAt',
      periods: 'id, familyId, status, cachedAt',
      users: 'id, familyId, email, cachedAt',
    });
  }

  /**
   * Cache invoice data
   */
  async cacheInvoice(invoice: Invoice): Promise<void> {
    await this.invoices.put({
      ...invoice,
      cachedAt: Date.now(),
    });
  }

  /**
   * Cache multiple invoices
   */
  async cacheInvoices(invoices: Invoice[]): Promise<void> {
    const cachedInvoices = invoices.map((invoice) => ({
      ...invoice,
      cachedAt: Date.now(),
    }));
    await this.invoices.bulkPut(cachedInvoices);
  }

  /**
   * Get cached invoices by period
   */
  async getCachedInvoices(periodId: string): Promise<CachedInvoice[]> {
    return this.invoices.where('periodId').equals(periodId).toArray();
  }

  /**
   * Cache period data
   */
  async cachePeriod(period: Period): Promise<void> {
    await this.periods.put({
      ...period,
      cachedAt: Date.now(),
    });
  }

  /**
   * Cache multiple periods
   */
  async cachePeriods(periods: Period[]): Promise<void> {
    const cachedPeriods = periods.map((period) => ({
      ...period,
      cachedAt: Date.now(),
    }));
    await this.periods.bulkPut(cachedPeriods);
  }

  /**
   * Get current period from cache
   */
  async getCurrentPeriod(): Promise<CachedPeriod | undefined> {
    return this.periods.where('status').equals('OPEN').first();
  }

  /**
   * Clear old cache entries (older than 7 days)
   */
  async clearOldCache(): Promise<void> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    await this.invoices.where('cachedAt').below(sevenDaysAgo).delete();
    await this.periods.where('cachedAt').below(sevenDaysAgo).delete();
    await this.users.where('cachedAt').below(sevenDaysAgo).delete();
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.invoices.clear();
    await this.periods.clear();
    await this.users.clear();
  }
}

// Create and export database instance
export const db = new KostDB();

// Clear old cache on initialization
db.clearOldCache();
