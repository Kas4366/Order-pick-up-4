import { ArchivedOrder, ArchiveStats, ArchiveSearchResult } from '../types/Archive';
import { Order } from '../types/Order';

class ArchiveService {
  private dbName = 'OrderPickArchive';
  private dbVersion = 1;
  private storeName = 'orders';
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Initializing IndexedDB archive...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB archive initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Upgrading IndexedDB schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the orders store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for efficient searching
          store.createIndex('orderNumber', 'orderNumber', { unique: false });
          store.createIndex('customerName', 'customerName', { unique: false });
          store.createIndex('sku', 'sku', { unique: false });
          store.createIndex('buyerPostcode', 'buyerPostcode', { unique: false });
          store.createIndex('fileDate', 'fileDate', { unique: false });
          store.createIndex('fileName', 'fileName', { unique: false });
          store.createIndex('archivedAt', 'archivedAt', { unique: false });
          
          // Compound index for efficient duplicate detection
          store.createIndex('orderSku', ['orderNumber', 'sku', 'customerName'], { unique: false });
          
          console.log('✅ Created orders store with indexes');
        }
      };
    });
  }

  // Ensure database is initialized
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Archive orders from current session
  async archiveOrders(orders: Order[], fileName: string): Promise<number> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🗄️ Archiving ${orders.length} orders from file: ${fileName}`);
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const now = new Date().toISOString();
      
      let archivedCount = 0;
      let processedCount = 0;
      
      transaction.oncomplete = () => {
        console.log(`✅ Successfully archived ${archivedCount} orders from ${fileName}`);
        resolve(archivedCount);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to archive orders:', transaction.error);
        reject(transaction.error);
      };
      
      // Process each order
      orders.forEach(order => {
        // Check if this exact order already exists to avoid duplicates
        const index = store.index('orderSku');
        const checkRequest = index.get([order.orderNumber, order.sku, order.customerName]);
        
        checkRequest.onsuccess = () => {
          const existingOrder = checkRequest.result;
          
          if (!existingOrder) {
            // Order doesn't exist, add it to archive
            const archivedOrder: ArchivedOrder = {
              ...order,
              fileName: fileName,
              archivedAt: now,
              fileDate: order.fileDate || now, // Use order's file date or current time as fallback
            };
            
            const addRequest = store.add(archivedOrder);
            
            addRequest.onsuccess = () => {
              archivedCount++;
              processedCount++;
              
              if (processedCount === orders.length) {
                // All orders processed, transaction will complete
              }
            };
            
            addRequest.onerror = () => {
              console.warn('⚠️ Failed to archive order:', order.orderNumber, addRequest.error);
              processedCount++;
              
              if (processedCount === orders.length) {
                // All orders processed, transaction will complete
              }
            };
          } else {
            console.log(`📋 Order already archived: ${order.orderNumber} - ${order.sku}`);
            processedCount++;
            
            if (processedCount === orders.length) {
              // All orders processed, transaction will complete
            }
          }
        };
        
        checkRequest.onerror = () => {
          console.warn('⚠️ Failed to check for existing order:', order.orderNumber, checkRequest.error);
          processedCount++;
          
          if (processedCount === orders.length) {
            // All orders processed, transaction will complete
          }
        };
      });
    });
  }

  // Search archived orders
  async searchArchive(searchTerm: string): Promise<ArchiveSearchResult> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🔍 Searching archive for: "${searchTerm}"`);
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results: ArchivedOrder[] = [];
      
      // Normalize search term for better matching
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      const normalizedPostcode = searchTerm.replace(/\s/g, '').toUpperCase();
      
      transaction.oncomplete = () => {
        console.log(`✅ Archive search completed: found ${results.length} orders`);
        resolve({
          orders: results,
          foundInArchive: results.length > 0,
          searchTerm: searchTerm,
          matchCount: results.length
        });
      };
      
      transaction.onerror = () => {
        console.error('❌ Archive search failed:', transaction.error);
        reject(transaction.error);
      };
      
      // Search through all orders
      const cursorRequest = store.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const order = cursor.value as ArchivedOrder;
          let isMatch = false;
          
          // Check various fields for matches
          if (order.customerName.toLowerCase().includes(normalizedSearchTerm)) {
            isMatch = true;
          } else if (order.orderNumber.toLowerCase().includes(normalizedSearchTerm)) {
            isMatch = true;
          } else if (order.sku.toLowerCase().includes(normalizedSearchTerm)) {
            isMatch = true;
          } else if (order.buyerPostcode && order.buyerPostcode.replace(/\s/g, '').toUpperCase().includes(normalizedPostcode)) {
            isMatch = true;
          } else if (order.additionalDetails && order.additionalDetails.toLowerCase().includes(normalizedSearchTerm)) {
            isMatch = true;
          }
          
          if (isMatch) {
            results.push(order);
          }
          
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during archive search:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }

  // Get archive statistics
  async getArchiveStats(): Promise<ArchiveStats> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('📊 Getting archive statistics...');
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let totalOrders = 0;
      const fileNames = new Set<string>();
      let oldestFileDate = '';
      let newestFileDate = '';
      
      transaction.oncomplete = () => {
        const stats: ArchiveStats = {
          totalOrders,
          totalFiles: fileNames.size,
          oldestFileDate,
          newestFileDate,
          lastUpdated: new Date().toISOString()
        };
        
        console.log('✅ Archive statistics:', stats);
        resolve(stats);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to get archive statistics:', transaction.error);
        reject(transaction.error);
      };
      
      const cursorRequest = store.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const order = cursor.value as ArchivedOrder;
          totalOrders++;
          
          if (order.fileName) {
            fileNames.add(order.fileName);
          }
          
          if (order.fileDate) {
            if (!oldestFileDate || order.fileDate < oldestFileDate) {
              oldestFileDate = order.fileDate;
            }
            if (!newestFileDate || order.fileDate > newestFileDate) {
              newestFileDate = order.fileDate;
            }
          }
          
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during stats collection:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }

  // Get orders by file date range
  async getOrdersByDateRange(startDate: string, endDate: string): Promise<ArchivedOrder[]> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`📅 Getting orders from ${startDate} to ${endDate}`);
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('fileDate');
      const results: ArchivedOrder[] = [];
      
      transaction.oncomplete = () => {
        console.log(`✅ Found ${results.length} orders in date range`);
        resolve(results);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to get orders by date range:', transaction.error);
        reject(transaction.error);
      };
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const cursorRequest = index.openCursor(range);
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          results.push(cursor.value as ArchivedOrder);
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during date range query:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }

  // Clear all archived data (for maintenance)
  async clearOldArchiveData(daysToKeep: number = 30): Promise<number> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🗑️ Clearing archive data older than ${daysToKeep} days...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateString = cutoffDate.toISOString();
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('fileDate');
      
      let deletedCount = 0;
      
      transaction.oncomplete = () => {
        console.log(`✅ Cleared ${deletedCount} old archive entries`);
        resolve(deletedCount);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to clear old archive data:', transaction.error);
        reject(transaction.error);
      };
      
      // Find and delete orders older than cutoff date
      const range = IDBKeyRange.upperBound(cutoffDateString, true);
      const cursorRequest = index.openCursor(range);
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const deleteRequest = cursor.delete();
          deleteRequest.onsuccess = () => {
            deletedCount++;
          };
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during old data cleanup:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }

  // Initialize auto-cleanup (call this periodically)
  async initAutoCleanup(): Promise<void> {
    try {
      // Check if we should run cleanup (once per day)
      const lastCleanup = localStorage.getItem('lastArchiveCleanup');
      const now = new Date().toISOString().split('T')[0]; // Today's date
      
      if (lastCleanup !== now) {
        console.log('🧹 Running daily archive cleanup...');
        const deletedCount = await this.clearOldArchiveData(30);
        localStorage.setItem('lastArchiveCleanup', now);
        
        if (deletedCount > 0) {
          console.log(`✅ Daily cleanup completed: removed ${deletedCount} old entries`);
        }
      }
    } catch (error) {
      console.error('❌ Auto-cleanup failed:', error);
    }
  }

  async clearArchive(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('🗑️ Clearing archive...');
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      transaction.oncomplete = () => {
        console.log('✅ Archive cleared successfully');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to clear archive:', transaction.error);
        reject(transaction.error);
      };
      
      store.clear();
    });
  }

  // Get unique file names in archive
  async getArchivedFileNames(): Promise<string[]> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('📁 Getting archived file names...');
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('fileName');
      const fileNames = new Set<string>();
      
      transaction.oncomplete = () => {
        const uniqueFileNames = Array.from(fileNames).sort();
        console.log(`✅ Found ${uniqueFileNames.length} unique files in archive`);
        resolve(uniqueFileNames);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to get file names:', transaction.error);
        reject(transaction.error);
      };
      
      const cursorRequest = index.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          const order = cursor.value as ArchivedOrder;
          if (order.fileName) {
            fileNames.add(order.fileName);
          }
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during file name collection:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }
}

export const archiveService = new ArchiveService();