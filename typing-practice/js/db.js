// ===================== DATABASE MODULE (IndexedDB) =====================
const DB_NAME = 'EasyProTypingDB';
const DB_VERSION = 1;
let _db;

const DB = {
  init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('users')) {
          const us = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          us.createIndex('username', 'username', { unique: true });
          us.createIndex('email', 'email', { unique: false });
        }
        if (!db.objectStoreNames.contains('history')) {
          const hs = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          hs.createIndex('userId', 'userId');
          hs.createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('leaderboard')) {
          const ls = db.createObjectStore('leaderboard', { keyPath: 'id', autoIncrement: true });
          ls.createIndex('category', 'category');
          ls.createIndex('wpm', 'wpm');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  },

  add(store, data) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).add(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  get(store, key) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  update(store, data) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  getAll(store) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  getByIndex(store, index, value) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readonly');
      const req = tx.objectStore(store).index(index).get(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  getAllByIndex(store, index, value) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readonly');
      const req = tx.objectStore(store).index(index).getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  delete(store, key) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  count(store) {
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
};
