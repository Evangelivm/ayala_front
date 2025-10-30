// Helper para manejar IndexedDB para almacenamiento de datos de programación manual

const DB_NAME = "ProgramacionDB";
const DB_VERSION = 4; // Incrementado para incluir campo peso
const STORE_NAME = "manualRows";

// Interfaz para las filas de entrada manual
export interface ManualRow {
  id: string;
  fecha: string;
  unidad: string; // Placa (para visualización)
  unidad_id: number; // ID del camión (para enviar al backend)
  proveedor: string; // Razón social (para visualización)
  proveedor_id: string; // Código de empresa (para enviar al backend)
  apellidos_nombres: string; // Solo para visualización, no se envía al backend
  programacion: string;
  hora_partida: string;
  estado_programacion: string;
  comentarios: string;
  punto_partida_ubigeo: string;
  punto_partida_direccion: string;
  punto_llegada_ubigeo: string;
  punto_llegada_direccion: string;
  peso: string; // Capacidad del tanque del camión
}

// Abrir o crear la base de datos
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear el object store si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

// Guardar todas las filas (sobrescribe los datos existentes)
export const saveManualRows = async (rows: ManualRow[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    // Primero limpiar todos los datos existentes
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      // Luego agregar todas las nuevas filas
      rows.forEach((row) => {
        store.add(row);
      });
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

// Obtener todas las filas
export const getManualRows = async (): Promise<ManualRow[]> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Agregar una nueva fila
export const addManualRow = async (row: ManualRow): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.add(row);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Actualizar una fila existente
export const updateManualRow = async (row: ManualRow): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(row);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Eliminar una fila
export const deleteManualRow = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Limpiar todos los datos
export const clearManualRows = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Migrar datos de localStorage a IndexedDB (usar solo una vez)
export const migrateFromLocalStorage = async (localStorageKey: string): Promise<number> => {
  const savedData = localStorage.getItem(localStorageKey);

  if (!savedData) {
    return 0;
  }

  try {
    const parsed: ManualRow[] = JSON.parse(savedData);
    await saveManualRows(parsed);

    // Limpiar localStorage después de la migración exitosa
    localStorage.removeItem(localStorageKey);

    return parsed.length;
  } catch (error) {
    console.error("Error al migrar datos de localStorage:", error);
    throw error;
  }
};
