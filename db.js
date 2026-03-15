const DB_NAME = "PolaroifyA3DB";
const DB_VERSION = 1;

class A3Database {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("sheets")) {
          db.createObjectStore("sheets", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("slots")) {
          const slotStore = db.createObjectStore("slots", { keyPath: ["sheetId", "slotIndex"] });
          slotStore.createIndex("by_sheet", "sheetId", { unique: false });
        }
      };
    });
  }

  async getDb() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // Sheets
  async getAllSheets() {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sheets"], "readonly");
      const store = transaction.objectStore("sheets");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getSheet(id) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sheets"], "readonly");
      const store = transaction.objectStore("sheets");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSheet(sheet) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sheets"], "readwrite");
      const store = transaction.objectStore("sheets");
      const request = store.put(sheet);

      request.onsuccess = () => resolve(sheet);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSheet(id) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sheets", "slots"], "readwrite");
      const sheetsStore = transaction.objectStore("sheets");
      const slotsStore = transaction.objectStore("slots");
      
      sheetsStore.delete(id);

      // Delete all slots for this sheet
      const index = slotsStore.index("by_sheet");
      const keyRange = IDBKeyRange.only(id);
      const cursorRequest = index.openCursor(keyRange);

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Slots
  async getSlotsForSheet(sheetId) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["slots"], "readonly");
      const store = transaction.objectStore("slots");
      const index = store.index("by_sheet");
      const keyRange = IDBKeyRange.only(sheetId);
      const request = index.getAll(keyRange);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getSlot(sheetId, slotIndex) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["slots"], "readonly");
      const store = transaction.objectStore("slots");
      const request = store.get([sheetId, slotIndex]);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSlot(sheetId, slotIndex, dataUrl, snapshot = null) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["slots"], "readwrite");
      const store = transaction.objectStore("slots");
      const request = store.put({ sheetId, slotIndex, dataUrl, snapshot });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSlot(sheetId, slotIndex) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["slots"], "readwrite");
      const store = transaction.objectStore("slots");
      const request = store.delete([sheetId, slotIndex]);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new A3Database();
