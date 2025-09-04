import { PackingInstruction } from '../types/PackingInstructions';

class PackingInstructionService {
  private dbName = 'OrderPickPackingInstructions';
  private dbVersion = 1;
  private storeName = 'instructions';
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Initializing PackingInstructions database...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ Failed to open PackingInstructions database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ PackingInstructions database initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Upgrading PackingInstructions database schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the instructions store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'sku'
          });
          
          // Create indexes for efficient searching
          store.createIndex('sku', 'sku', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log('✅ Created packing instructions store with indexes');
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
      throw new Error('Failed to initialize PackingInstructions database');
    }
    return this.db;
  }

  // Save packing instructions (replaces all existing instructions)
  async saveInstructions(instructions: PackingInstruction[]): Promise<number> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`📦 Saving ${instructions.length} packing instructions...`);
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let savedCount = 0;
      
      transaction.oncomplete = () => {
        console.log(`✅ Successfully saved ${savedCount} packing instructions`);
        resolve(savedCount);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to save packing instructions:', transaction.error);
        reject(transaction.error);
      };
      
      // Clear existing instructions first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        console.log('🗑️ Cleared existing packing instructions');
        
        // Add new instructions
        instructions.forEach(instruction => {
          const addRequest = store.add(instruction);
          
          addRequest.onsuccess = () => {
            savedCount++;
          };
          
          addRequest.onerror = () => {
            console.warn('⚠️ Failed to save instruction for SKU:', instruction.sku, addRequest.error);
          };
        });
      };
      
      clearRequest.onerror = () => {
        console.error('❌ Failed to clear existing instructions:', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  // Get instruction for a specific SKU
  async getInstruction(sku: string): Promise<PackingInstruction | null> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🔍 Looking for packing instruction for SKU: ${sku}`);
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      transaction.onerror = () => {
        console.error('❌ Failed to get packing instruction:', transaction.error);
        reject(transaction.error);
      };
      
      const request = store.get(sku);
      
      request.onsuccess = () => {
        const result = request.result as PackingInstruction | undefined;
        
        if (result) {
          console.log(`✅ Found packing instruction for SKU ${sku}:`, result.instruction);
          resolve(result);
        } else {
          console.log(`⚠️ No packing instruction found for SKU: ${sku}`);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Error retrieving packing instruction:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all instructions
  async getAllInstructions(): Promise<PackingInstruction[]> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('📋 Getting all packing instructions...');
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results: PackingInstruction[] = [];
      
      transaction.oncomplete = () => {
        console.log(`✅ Retrieved ${results.length} packing instructions`);
        resolve(results);
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to get all packing instructions:', transaction.error);
        reject(transaction.error);
      };
      
      const cursorRequest = store.openCursor();
      
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          results.push(cursor.value as PackingInstruction);
          cursor.continue();
        }
      };
      
      cursorRequest.onerror = () => {
        console.error('❌ Cursor error during instruction retrieval:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  }

  // Clear all instructions
  async clearInstructions(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('🗑️ Clearing all packing instructions...');
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      transaction.oncomplete = () => {
        console.log('✅ All packing instructions cleared');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to clear packing instructions:', transaction.error);
        reject(transaction.error);
      };
      
      store.clear();
    });
  }

  // Get statistics about stored instructions
  async getStats(): Promise<{ totalInstructions: number; lastUpdated: string }> {
    const instructions = await this.getAllInstructions();
    
    let lastUpdated = '';
    if (instructions.length > 0) {
      const sortedByUpdate = instructions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      lastUpdated = sortedByUpdate[0].updatedAt;
    }
    
    return {
      totalInstructions: instructions.length,
      lastUpdated
    };
  }
}

export const packingInstructionService = new PackingInstructionService();