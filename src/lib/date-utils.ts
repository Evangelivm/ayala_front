import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extender dayjs con plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formatea una fecha SIN conversión de timezone
 * Útil para campos DATE de la base de datos que no tienen hora
 * @param date - Fecha ISO string o Date object del backend
 * @returns Fecha en formato local (dd/mm/yyyy)
 */
export const formatDatePeru = (date: string | Date | null): string => {
  if (!date) return "-";

  try {
    // Parsear la fecha sin conversión de timezone
    // Si viene como "2025-12-12" o "2025-12-12T00:00:00Z", extraer solo la fecha
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    const datePart = dateStr.split('T')[0]; // Obtener solo la parte de la fecha YYYY-MM-DD

    // Parsear sin timezone
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "-";
  }
};

/**
 * Formatea una hora a timezone de Perú (America/Lima)
 * @param dateTime - DateTime ISO string del backend
 * @returns Hora en formato HH:mm
 */
export const formatTimePeru = (dateTime: string | Date | null): string => {
  if (!dateTime) return "-";

  try {
    // Convertir a timezone de Perú
    const peruTime = dayjs(dateTime).tz('America/Lima');
    return peruTime.format('HH:mm');
  } catch (error) {
    return "-";
  }
};

/**
 * Formatea una fecha y hora a timezone de Perú (America/Lima)
 * @param dateTime - DateTime ISO string del backend
 * @returns Fecha y hora en formato dd/mm/yyyy HH:mm
 */
export const formatDateTimePeru = (dateTime: string | Date | null): string => {
  if (!dateTime) return "-";

  try {
    // Convertir a timezone de Perú
    const peruDateTime = dayjs(dateTime).tz('America/Lima');
    return peruDateTime.format('DD/MM/YYYY HH:mm');
  } catch (error) {
    return "-";
  }
};

/**
 * Obtiene la fecha local actual en formato YYYY-MM-DD para inputs
 * @returns Fecha local en formato YYYY-MM-DD
 */
export const getTodayPeru = (): string => {
  const peruNow = dayjs().tz('America/Lima');
  return peruNow.format('YYYY-MM-DD');
};
