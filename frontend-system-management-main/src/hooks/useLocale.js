import { useSelector } from 'react-redux';
import { fr, enUS, es } from 'date-fns/locale';
import { formatDate as originalFormatDate, formatPrice as originalFormatPrice } from '../services/api';

// Hook pour utiliser la locale courante
export const useLocale = () => {
  const { locale } = useSelector((state) => state.ui);
  const dateFnsLocale = ({ 'fr-FR': fr, 'en-US': enUS, 'es-ES': es }[locale] || fr);
  
  // Debug
  console.log('useLocale - locale:', locale);
  
  // Versions automatiques avec locale
  const formatDate = (dateString) => {
    console.log('useLocale formatDate - locale:', locale, 'dateString:', dateString);
    return originalFormatDate(dateString, locale);
  };
  const formatPrice = (price) => {
    console.log('useLocale formatPrice - locale:', locale, 'price:', price);
    return originalFormatPrice(price, locale);
  };
  
  return {
    locale,
    dateFnsLocale,
    formatDate,
    formatPrice
  };
};
