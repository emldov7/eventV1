import logging
import requests
from django.conf import settings
from django.core.files.base import ContentFile
import qrcode
import io

logger = logging.getLogger(__name__)

class SMSService:
    """Service pour l'envoi de SMS avec QR-code"""
    
    def __init__(self):
        # Configuration pour différents fournisseurs SMS
        self.providers = {
            'twilio': {
                'enabled': getattr(settings, 'TWILIO_ENABLED', False),
                'account_sid': getattr(settings, 'TWILIO_ACCOUNT_SID', ''),
                'auth_token': getattr(settings, 'TWILIO_AUTH_TOKEN', ''),
                'from_number': getattr(settings, 'TWILIO_FROM_NUMBER', ''),
            },
            'africastalking': {
                'enabled': getattr(settings, 'AFRICASTALKING_ENABLED', False),
                'api_key': getattr(settings, 'AFRICASTALKING_API_KEY', ''),
                'username': getattr(settings, 'AFRICASTALKING_USERNAME', ''),
                'from_number': getattr(settings, 'AFRICASTALKING_FROM_NUMBER', ''),
            }
        }
    
    def generate_qr_code(self, registration):
        """Génère un QR-code pour l'inscription"""
        try:
            # Créer le contenu du QR-code
            qr_content = f"EVENT:{registration.event.id}|REG:{registration.id}|TOKEN:{registration.qr_token}"
            
            # Générer le QR-code
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_content)
            qr.make(fit=True)
            
            # Créer l'image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convertir en bytes
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Sauvegarder l'image
            filename = f"qr_code_registration_{registration.id}.png"
            registration.qr_code.save(filename, ContentFile(buffer.getvalue()), save=True)
            
            logger.info(f"QR-code généré pour l'inscription {registration.id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du QR-code: {e}")
            return False
    
    def format_phone_number(self, phone, country_code):
        """Formate le numéro de téléphone selon le pays"""
        # Supprimer les espaces et caractères spéciaux
        phone = ''.join(filter(str.isdigit, phone))
        
        # 🎯 NOUVELLE LOGIQUE : Détecter automatiquement le pays du numéro
        if phone.startswith('514') and len(phone) >= 10:
            # Numéro canadien (Montréal) - FORCER le format canadien
            formatted = '+1' + phone
            logger.info(f"🔍 FORMAT DEBUG: Numéro 514 détecté comme canadien: {phone} -> {formatted}")
            return formatted
        elif phone.startswith('438') and len(phone) >= 10:
            # Numéro canadien (Montréal) - FORCER le format canadien
            formatted = '+1' + phone
            logger.info(f"🔍 FORMAT DEBUG: Numéro 438 détecté comme canadien: {phone} -> {formatted}")
            return formatted
        elif phone.startswith('1') and len(phone) >= 10:
            # Numéro américain/canadien
            formatted = '+1' + phone
            logger.info(f"🔍 FORMAT DEBUG: Numéro 1 détecté comme américain/canadien: {phone} -> {formatted}")
            return formatted
        elif phone.startswith('33') and len(phone) >= 10:
            # Numéro français
            return '+33' + phone[2:]
        elif phone.startswith('06') or phone.startswith('07'):
            # Numéro français mobile
            return '+33' + phone[1:]
        else:
            # Utiliser le pays sélectionné par défaut
            country_codes = {
                'FR': '33', 'US': '1', 'CA': '1', 'BE': '32', 'CH': '41',
                'LU': '352', 'DE': '49', 'IT': '39', 'ES': '34', 'GB': '44',
                'NL': '31', 'PT': '351', 'IE': '353', 'AT': '43', 'SE': '46',
                'NO': '47', 'DK': '45', 'FI': '358', 'PL': '48', 'CZ': '420',
                'HU': '36', 'RO': '40', 'BG': '359', 'HR': '385', 'SI': '386',
                'SK': '421', 'LT': '370', 'LV': '371', 'EE': '372', 'CY': '357',
                'MT': '356', 'GR': '30', 'TG': '228', 'CI': '225', 'SN': '221',
                'ML': '223', 'BF': '226', 'NE': '227', 'TD': '235', 'CM': '237',
                'CF': '236', 'CG': '242', 'CD': '243', 'GA': '241', 'GQ': '240',
                'ST': '239', 'AO': '244', 'NA': '264', 'ZA': '27', 'BW': '267',
                'ZW': '263', 'ZM': '260', 'MW': '265', 'MZ': '258', 'MG': '261',
                'MU': '230', 'SC': '248', 'KM': '269', 'DJ': '253', 'SO': '252',
                'ET': '251', 'ER': '291', 'SD': '249', 'SS': '211', 'EG': '20',
                'LY': '218', 'TN': '216', 'DZ': '213', 'MA': '212', 'EH': '212',
                'MR': '222', 'GM': '220', 'GN': '224', 'GW': '245', 'SL': '232',
                'LR': '231', 'GH': '233', 'BJ': '229', 'NG': '234', 'RW': '250',
                'KE': '254', 'TZ': '255', 'UG': '256', 'BI': '257', 'RE': '262',
                'LS': '266', 'SZ': '268', 'YT': '262'
            }
            
            if country_code in country_codes:
                country_prefix = country_codes[country_code]
                if not phone.startswith(country_prefix):
                    phone = country_prefix + phone
                return '+' + phone
        
        return phone
    
    def send_sms_twilio(self, to_number, message):
        """Envoie un SMS via Twilio"""
        try:
            if not self.providers['twilio']['enabled']:
                logger.warning("Twilio n'est pas configuré")
                return False
            
            # 🎯 NOUVEAU : Logs détaillés pour le débogage
            logger.info(f"🔍 TWILIO DEBUG: Tentative envoi SMS")
            logger.info(f"🔍 TWILIO DEBUG: Account SID: {self.providers['twilio']['account_sid']}")
            logger.info(f"🔍 TWILIO DEBUG: Auth Token: {self.providers['twilio']['auth_token'][:10]}...")
            logger.info(f"🔍 TWILIO DEBUG: From Number: {self.providers['twilio']['from_number']}")
            logger.info(f"🔍 TWILIO DEBUG: To Number: {to_number}")
            logger.info(f"🔍 TWILIO DEBUG: Message length: {len(message)}")
            
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.providers['twilio']['account_sid']}/Messages.json"
            
            data = {
                'From': self.providers['twilio']['from_number'],
                'To': to_number,
                'Body': message,
                'StatusCallback': None  # 🎯 NOUVEAU : Désactiver les webhooks
            }
            
            logger.info(f"🔍 TWILIO DEBUG: URL: {url}")
            logger.info(f"🔍 TWILIO DEBUG: Data: {data}")
            
            response = requests.post(
                url,
                data=data,
                auth=(self.providers['twilio']['account_sid'], self.providers['twilio']['auth_token'])
            )
            
            logger.info(f"🔍 TWILIO DEBUG: Response Status: {response.status_code}")
            logger.info(f"🔍 TWILIO DEBUG: Response Headers: {dict(response.headers)}")
            logger.info(f"🔍 TWILIO DEBUG: Response Text: {response.text}")
            
            if response.status_code == 201:
                logger.info(f"✅ SMS envoyé via Twilio à {to_number}")
                logger.info(f"🎯 VÉRIFICATION: Vérifie ton téléphone pour le SMS!")
                logger.info(f"🎯 VÉRIFICATION: Numéro de destination: {to_number}")
                logger.info(f"🎯 VÉRIFICATION: Message envoyé avec succès (Status: 201)")
                
                # 🎯 NOUVEAU : Extraire le SID du message pour vérification
                try:
                    import json
                    response_data = json.loads(response.text)
                    message_sid = response_data.get('sid', 'N/A')
                    logger.info(f"🎯 MESSAGE SID: {message_sid}")
                    logger.info(f"🎯 VÉRIFIE DANS TWILIO: https://console.twilio.com/us1/monitor/logs/sms")
                    logger.info(f"🎯 CLIQUE SUR 'TROUBLESHOOT' POUR VOIR L'ERREUR EXACTE!")
                except:
                    logger.info(f"🎯 VÉRIFIE DANS TWILIO: https://console.twilio.com/us1/monitor/logs/sms")
                    logger.info(f"🎯 CLIQUE SUR 'TROUBLESHOOT' POUR VOIR L'ERREUR EXACTE!")
                
                return True
            else:
                logger.error(f"❌ Erreur Twilio: {response.status_code} - {response.text}")
                
                # 🎯 NOUVEAU : Logs spécifiques pour les erreurs courantes
                if "30044" in response.text:
                    logger.error(f"🚨 ERREUR 30044: Numéro de téléphone invalide ou non supporté!")
                    logger.error(f"🚨 SOLUTION: Vérifie que le numéro est actif et dans le bon format")
                    logger.error(f"🚨 SOLUTION: Essaie avec un autre numéro de téléphone")
                elif "unverified" in response.text.lower():
                    logger.error(f"🚨 PROBLÈME: Compte Twilio Trial - Numéro non vérifié!")
                    logger.error(f"🚨 SOLUTION: Vérifie ton numéro dans Twilio ou achète un compte payant")
                elif "trial" in response.text.lower():
                    logger.error(f"🚨 PROBLÈME: Compte Twilio Trial - Limitation détectée!")
                    logger.error(f"🚨 SOLUTION: Passe en mode payant pour envoyer à tous les numéros")
                
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi SMS Twilio: {e}")
            return False
    
    def send_sms_africastalking(self, to_number, message):
        """Envoie un SMS via Africa's Talking"""
        try:
            if not self.providers['africastalking']['enabled']:
                logger.warning("Africa's Talking n'est pas configuré")
                return False
            
            url = "https://api.africastalking.com/version1/messaging"
            
            headers = {
                'ApiKey': self.providers['africastalking']['api_key'],
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'username': self.providers['africastalking']['username'],
                'to': to_number,
                'message': message,
                'from': self.providers['africastalking']['from_number']
            }
            
            response = requests.post(url, headers=headers, data=data)
            
            if response.status_code == 201:
                logger.info(f"SMS envoyé via Africa's Talking à {to_number}")
                return True
            else:
                logger.error(f"Erreur Africa's Talking: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi SMS Africa's Talking: {e}")
            return False
    
    def send_confirmation_sms(self, registration):
        """Envoie un SMS de confirmation avec QR-code texte"""
        try:
            # 🎯 NOUVEAU : Déterminer le numéro de téléphone (utilisateur ou invité)
            phone_number = None
            country_code = 'FR'
            
            if registration.user and registration.user.profile.phone:
                # Utilisateur connecté
                phone_number = registration.user.profile.phone
                country_code = registration.user.profile.country or 'FR'
                logger.info(f"🔍 SMS DEBUG: Utilisateur connecté - Phone: {phone_number}, Country: {country_code}")
            elif registration.guest_phone:
                # Invité
                phone_number = registration.guest_phone
                country_code = registration.guest_country or 'FR'
                logger.info(f"🔍 SMS DEBUG: Invité - Phone: {phone_number}, Country: {country_code}")
            else:
                logger.warning(f"Pas de numéro de téléphone pour l'inscription {registration.id}")
                return False
            
            # 🎯 NOUVEAU : Logs détaillés pour le débogage SMS
            logger.info(f"🔍 SMS DEBUG: Début envoi SMS pour inscription {registration.id}")
            logger.info(f"🔍 SMS DEBUG: Numéro original: {phone_number}")
            logger.info(f"🔍 SMS DEBUG: Pays sélectionné: {country_code}")
            
            # Formater le numéro de téléphone
            formatted_phone = self.format_phone_number(phone_number, country_code)
            
            logger.info(f"🔍 SMS DEBUG: Numéro formaté: {formatted_phone}")
            logger.info(f"🔍 SMS DEBUG: Numéro d'envoi Twilio: {self.providers['twilio']['from_number']}")
            logger.info(f"🔍 SMS DEBUG: Twilio activé: {self.providers['twilio']['enabled']}")
            logger.info(f"🔍 SMS DEBUG: Account SID: {self.providers['twilio']['account_sid']}")
            logger.info(f"🔍 SMS DEBUG: Auth Token: {self.providers['twilio']['auth_token'][:10]}...")
            
            # 🎯 NOUVEAU : Vérifier que le numéro n'est pas le même que le numéro d'envoi
            logger.info(f"🔍 SMS DEBUG: Comparaison numéros")
            logger.info(f"🔍 SMS DEBUG: Numéro formaté: {formatted_phone}")
            logger.info(f"🔍 SMS DEBUG: Numéro Twilio: {self.providers['twilio']['from_number']}")
            logger.info(f"🔍 SMS DEBUG: Sont-ils identiques? {formatted_phone == self.providers['twilio']['from_number']}")
            
            if formatted_phone == self.providers['twilio']['from_number']:
                logger.warning(f"🚨 BLOCAGE: Numéro de téléphone identique au numéro d'envoi: {formatted_phone}")
                return False
            
            # Générer le QR-code si pas déjà fait
            if not registration.qr_code:
                self.generate_qr_code(registration)
            
            # Créer le message
            event = registration.event
            
            # 🎯 NOUVEAU : Message avec QR-code texte intégré
            qr_content = f"EVENT:{event.id}|REG:{registration.id}|TOKEN:{registration.qr_token}"
            short_message = f"🎉 Confirmation: {event.title} - {event.start_date.strftime('%d/%m')} - ID:{registration.id}\n\n📱 SCANNEZ CE CODE:\n{qr_content}"
            
            logger.info(f"🔍 SMS DEBUG: Message préparé: {short_message}")
            logger.info(f"🎯 LONGUEUR MESSAGE: {len(short_message)} caractères")
            
            # Essayer d'envoyer via différents fournisseurs
            success = False
            
            if self.providers['twilio']['enabled']:
                logger.info(f"🔍 SMS DEBUG: Tentative envoi via Twilio...")
                # 🎯 NOUVEAU : Envoyer SMS avec QR-code texte
                success = self.send_sms_twilio(formatted_phone, short_message)
                logger.info(f"🔍 SMS DEBUG: Résultat Twilio: {success}")
            
            if not success and self.providers['africastalking']['enabled']:
                logger.info(f"🔍 SMS DEBUG: Tentative envoi via Africa's Talking...")
                success = self.send_sms_africastalking(formatted_phone, short_message)
                logger.info(f"🔍 SMS DEBUG: Résultat Africa's Talking: {success}")
            
            if success:
                logger.info(f"SMS de confirmation envoyé à {formatted_phone} pour l'inscription {registration.id}")
            else:
                logger.warning(f"Impossible d'envoyer le SMS de confirmation pour l'inscription {registration.id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du SMS de confirmation: {e}")
            return False

# Instance globale du service SMS
sms_service = SMSService()
