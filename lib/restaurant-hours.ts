/**
 * Utility functions for calculating restaurant open/closed status based on opening hours
 */

export interface OpeningHours {
  [key: string]: {
    open: boolean
    openTime?: string
    closeTime?: string
  }
}

/**
 * Calculates if a restaurant is currently open based on its opening hours
 * @param openingHours - The restaurant's opening hours configuration
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if the restaurant is open, false otherwise
 */
export function calculateIsOpen(
  openingHours: OpeningHours | null | undefined,
  currentTime: Date = new Date()
): boolean {
  if (!openingHours || typeof openingHours !== 'object') {
    return false
  }

  const currentDay = currentTime.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Mapear día de la semana a clave de openingHours
  const dayMap: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  }

  const todayKey = dayMap[currentDay]
  const todayHours = openingHours[todayKey]

  // Si el día no está configurado o está cerrado, retornar false
  if (!todayHours || !todayHours.open) {
    return false
  }

  // Si no tiene horarios de apertura/cierre, asumir que está abierto si open = true
  if (!todayHours.openTime || !todayHours.closeTime) {
    return todayHours.open
  }

  // Convertir hora actual a minutos desde medianoche
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  // Convertir horarios de apertura y cierre a minutos
  const [openHour, openMin] = todayHours.openTime.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number)
  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  // Verificar si la hora actual está dentro del rango
  if (openMinutes <= closeMinutes) {
    // Horario normal (ej: 09:00 - 22:00)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } else {
    // Horario que cruza medianoche (ej: 22:00 - 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
  }
}

/**
 * Saves restaurant opening hours to sessionStorage
 * @param restaurantId - The restaurant ID
 * @param openingHours - The opening hours to save
 */
export function saveOpeningHoursToStorage(
  restaurantId: string,
  openingHours: OpeningHours
): void {
  try {
    const key = `restaurant_hours_${restaurantId}`
    sessionStorage.setItem(key, JSON.stringify(openingHours))
    console.log(`💾 Saved opening hours to sessionStorage for restaurant ${restaurantId}`)
  } catch (error) {
    console.error('Error saving opening hours to sessionStorage:', error)
  }
}

/**
 * Gets restaurant opening hours from sessionStorage
 * @param restaurantId - The restaurant ID
 * @returns The opening hours or null if not found
 */
export function getOpeningHoursFromStorage(
  restaurantId: string
): OpeningHours | null {
  try {
    const key = `restaurant_hours_${restaurantId}`
    const stored = sessionStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as OpeningHours
    }
    return null
  } catch (error) {
    console.error('Error reading opening hours from sessionStorage:', error)
    return null
  }
}

/**
 * Removes restaurant opening hours from sessionStorage
 * @param restaurantId - The restaurant ID
 */
export function removeOpeningHoursFromStorage(restaurantId: string): void {
  try {
    const key = `restaurant_hours_${restaurantId}`
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing opening hours from sessionStorage:', error)
  }
}
