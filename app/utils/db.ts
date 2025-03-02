// utils/db.ts
export interface ProgressData {
    basic: number;
    ipAddress: number;
    routing: number;
    vlan: number;
    wireless: number;
  }
  
  const DB_NAME = 'network-learning-db';
  const STORE_NAME = 'progress-store';
  const DB_VERSION = 1;
  
  // IndexedDBを初期化する関数
  export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        reject('IndexedDBの初期化に失敗しました');
      };
      
      request.onsuccess = (event) => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  };
  
  // 進捗データを保存する関数
  export const saveProgress = async (key: keyof ProgressData, value: number): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // 現在の進捗データを取得
      const getRequest = store.get('progress');
      
      getRequest.onsuccess = () => {
        let progressData: ProgressData = getRequest.result || {
          id: 'progress',
          basic: 0,
          ipAddress: 0,
          routing: 0,
          vlan: 0,
          wireless: 0
        };
        
        // 特定のキーの値を更新
        progressData[key] = value;
        
        // 更新したデータを保存
        const putRequest = store.put(progressData);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = () => {
          reject('進捗データの保存に失敗しました');
        };
      };
      
      getRequest.onerror = () => {
        reject('進捗データの取得に失敗しました');
      };
    });
  };
  
  // 進捗データを取得する関数
  export const getProgress = async (): Promise<ProgressData> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('progress');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // デフォルト値を返す
          resolve({
            id: 'progress',
            basic: 0,
            ipAddress: 0,
            routing: 0,
            vlan: 0,
            wireless: 0
          });
        }
      };
      
      request.onerror = () => {
        reject('進捗データの取得に失敗しました');
      };
    });
  };

  // 既存のコードに以下の関数を追加

// 進捗データをリセットする関数
export const resetProgress = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // デフォルト値で上書き
      const defaultData: ProgressData & { id: string } = {
        id: 'progress',
        basic: 0,
        ipAddress: 0,
        routing: 0,
        vlan: 0,
        wireless: 0
      };
      
      const putRequest = store.put(defaultData);
      
      putRequest.onsuccess = () => {
        resolve();
      };
      
      putRequest.onerror = () => {
        reject('進捗データのリセットに失敗しました');
      };
    });
  };