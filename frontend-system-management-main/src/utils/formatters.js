/**
 * Formate un prix en euros
 * @param {number} price - Le prix à formater
 * @returns {string} Le prix formaté (ex: "25,99 €")
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'Gratuit';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Formate une date et heure
 * @param {string|Date} dateTime - La date à formater
 * @returns {string} La date formatée (ex: "15/08/2025 à 14:30")
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return 'Non défini';
  
  const date = new Date(dateTime);
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formate une date seulement
 * @param {string|Date} date - La date à formater
 * @returns {string} La date formatée (ex: "15/08/2025")
 */
export const formatDate = (date) => {
  if (!date) return 'Non défini';
  
  const dateObj = new Date(date);
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * Formate une heure seulement
 * @param {string|Date} time - L'heure à formater
 * @returns {string} L'heure formatée (ex: "14:30")
 */
export const formatTime = (time) => {
  if (!time) return 'Non défini';
  
  const timeObj = new Date(time);
  
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timeObj);
};

/**
 * Formate un nombre d'éléments
 * @param {number} count - Le nombre à formater
 * @param {string} singular - Forme singulière (ex: "participant")
 * @param {string} plural - Forme plurielle (ex: "participants")
 * @returns {string} Le texte formaté (ex: "1 participant", "5 participants")
 */
export const formatCount = (count, singular, plural) => {
  if (count === 0) return `Aucun ${singular}`;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural || singular + 's'}`;
};

/**
 * Formate une durée en heures et minutes
 * @param {number} hours - Nombre d'heures
 * @returns {string} La durée formatée (ex: "2h30")
 */
export const formatDuration = (hours) => {
  if (!hours || hours === 0) return '0h';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
};

/**
 * Tronque un texte à une longueur donnée
 * @param {string} text - Le texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Le texte tronqué avec "..." si nécessaire
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export default {
  formatPrice,
  formatDateTime,
  formatDate,
  formatTime,
  formatCount,
  formatDuration,
  truncateText,
};






