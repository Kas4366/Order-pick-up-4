class FileHandlePersistenceService {
  private dbName = 'OrderPickFileHandles';
  private dbVersion = 1;
  private storeName = 'fileHandles';
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Initializing FileHandle persistence database...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ Failed to open FileHandle database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ FileHandle persistence database initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('🔄 Upgrading FileHandle database schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the file handles store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'key'
          });
          
          // Create index for efficient searching
          store.createIndex('savedAt', 'savedAt', { unique: false });
          
          console.log('✅ Created file handles store');
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
      throw new Error('Failed to initialize FileHandle database');
    }
    return this.db;
  }

  // Save a file system directory handle
  async saveHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`💾 Saving file handle for key: ${key}`);
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const handleData = {
        key: key,
        handle: handle,
        savedAt: new Date().toISOString(),
        folderName: handle.name
      };
      
      transaction.oncomplete = () => {
        console.log(`✅ Successfully saved file handle for: ${key}`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to save file handle:', transaction.error);
        reject(transaction.error);
      };
      
      store.put(handleData);
    });
  }

  // Retrieve a file system directory handle
  async getHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🔍 Retrieving file handle for key: ${key}`);
      
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      transaction.oncomplete = () => {
        // Transaction completed successfully
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to retrieve file handle:', transaction.error);
        reject(transaction.error);
      };
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (result && result.handle) {
          console.log(`✅ fileHandlePersistenceService: Found saved file handle for: ${key} (folder: ${result.folderName}, savedAt: ${result.savedAt})`);
          resolve(result.handle);
        } else {
          console.log(`⚠️ fileHandlePersistenceService: No saved file handle found in IndexedDB for key: ${key}`);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('❌ Error retrieving file handle:', request.error);
        reject(request.error);
      };
    });
  }

  // Check if a handle is still valid and request permission
  async validateAndRequestPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      console.log(`🔐 fileHandlePersistenceService: Checking permission for folder: ${handle.name}`);
      
      // Check current permission status
      const permission = await handle.queryPermission({ mode: 'read' });
      console.log(`🔐 fileHandlePersistenceService: Current permission status for ${handle.name}: ${permission}`);
      
      if (permission === 'granted') {
        console.log(`✅ fileHandlePersistenceService: Permission already granted for ${handle.name}`);
        return true;
      }
      
      if (permission === 'prompt') {
        console.log(`🔐 fileHandlePersistenceService: Requesting permission from user for ${handle.name}...`);
        const newPermission = await handle.requestPermission({ mode: 'read' });
        console.log(`🔐 fileHandlePersistenceService: User permission response for ${handle.name}: ${newPermission}`);
        
        if (newPermission === 'granted') {
          console.log(`✅ fileHandlePersistenceService: Permission granted by user for ${handle.name}`);
          return true;
        } else {
          console.log(`❌ fileHandlePersistenceService: Permission denied by user for ${handle.name}`);
          return false;
        }
      }
      
      console.log(`❌ fileHandlePersistenceService: Permission denied for ${handle.name}`);
      return false;
    } catch (error) {
      console.error(`❌ fileHandlePersistenceService: Error checking/requesting permission for ${handle.name}:`, error);
      return false;
    }
  }

  // Remove a saved handle
  async removeHandle(key: string): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log(`🗑️ Removing file handle for key: ${key}`);
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      transaction.oncomplete = () => {
        console.log(`✅ Successfully removed file handle for: ${key}`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to remove file handle:', transaction.error);
        reject(transaction.error);
      };
      
      store.delete(key);
    });
  }

  // Clear all saved handles
  async clearAllHandles(): Promise<void> {
    const db = await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      console.log('🗑️ Clearing all file handles...');
      
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      transaction.oncomplete = () => {
        console.log('✅ All file handles cleared');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('❌ Failed to clear file handles:', transaction.error);
        reject(transaction.error);
      };
      
      store.clear();
    });
  }
}

export const fileHandlePersistenceService = new FileHandlePersistenceService();