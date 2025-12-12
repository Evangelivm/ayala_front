import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extender dayjs con plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formatea una fecha a timezone de Perú (America/Lima)
 * @param date - Fecha ISO string o Date object del backend
 * @returns Fecha en formato local (dd/mm/yyyy)
 */
export const formatDatePeru = (date: string | Date | null): string => {
  if (!date) return "-";

  try {
    // Convertir a timezone de Perú
    const peruDate = dayjs(date).tz('America/Lima');
    return peruDate.format('DD/MM/YYYY');
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
