import Dexie, { Table } from 'dexie';
import { api } from '../services/api';

export interface QueuedRequest {
  id?: number;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retries: number;
}

class OfflineQueueDB extends Dexie {
  queue!: Table<QueuedRequest>;

  constructor() {
    super('OfflineQueueDB');
    this.version(1).stores({
      queue: '++id, timestamp',
    });
  }
}

const queueDB = new OfflineQueueDB();

/**
 * Add a request to the offline queue
 */
export async function addToOfflineQueue(request: Omit<QueuedRequest, 'timestamp' | 'retries'>): Promise<void> {
  await queueDB.queue.add({
    ...request,
    timestamp: Date.now(),
    retries: 0,
  });
  console.log('Request added to offline queue:', request);
}

/**
 * Process the offline queue
 */
export async function processOfflineQueue(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Still offline, skipping queue processing');
    return;
  }

  const requests = await queueDB.queue.orderBy('timestamp').toArray();

  if (requests.length === 0) {
    console.log('Offline queue is empty');
    return;
  }

  console.log(`Processing ${requests.length} queued requests`);

  for (const request of requests) {
    try {
      // Execute the request
      switch (request.method) {
        case 'POST':
          await api.post(request.url, request.data);
          break;
        case 'PUT':
          await api.put(request.url, request.data);
          break;
        case 'DELETE':
          await api.delete(request.url);
          break;
      }

      // Remove from queue on success
      await queueDB.queue.delete(request.id!);
      console.log('Successfully processed queued request:', request);
    } catch (error) {
      console.error('Failed to process queued request:', error);

      // Increment retry count
      if (request.retries < 3) {
        await queueDB.queue.update(request.id!, {
          retries: request.retries + 1,
        });
      } else {
        // Remove after 3 failed retries
        console.error('Request failed after 3 retries, removing from queue');
        await queueDB.queue.delete(request.id!);
      }
    }
  }
}

/**
 * Get the number of pending requests
 */
export async function getPendingRequestCount(): Promise<number> {
  return queueDB.queue.count();
}

/**
 * Clear the offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  await queueDB.queue.clear();
}

// Listen for online event to process queue
window.addEventListener('online', () => {
  console.log('Connection restored, processing offline queue');
  processOfflineQueue();
});

// Listen for service worker sync event
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_QUEUE') {
      processOfflineQueue();
    }
  });
}

export default queueDB;
