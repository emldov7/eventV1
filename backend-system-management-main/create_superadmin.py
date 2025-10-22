#!/usr/bin/env python3
"""
Script pour créer un super administrateur
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_management.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.management import call_command

def create_superadmin():
    """Créer un super administrateur"""
    
    # Informations du super admin
    username = 'admin'
    email = 'admin@eventmanagement.com'
    password = 'admin123'
    first_name = 'Super'
    last_name = 'Administrator'
    
    try:
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(username=username).exists():
            print(f"❌ L'utilisateur '{username}' existe déjà!")
            user = User.objects.get(username=username)
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.save()
            print(f"✅ Mot de passe mis à jour pour l'utilisateur '{username}'")
        else:
            # Créer le super utilisateur
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            print(f"✅ Super administrateur créé avec succès!")
        
        print("\n" + "="*50)
        print("🔐 INFORMATIONS DE CONNEXION")
        print("="*50)
        print(f"Nom d'utilisateur: {username}")
        print(f"Mot de passe: {password}")
        print(f"Email: {email}")
        print(f"Prénom: {first_name}")
        print(f"Nom: {last_name}")
        print("="*50)
        print("\n🌐 Vous pouvez maintenant vous connecter à:")
        print("   - Interface d'administration: http://localhost:8000/admin/")
        print("   - API: http://localhost:8000/api/")
        print("   - Frontend: http://localhost:3001")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du super administrateur: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Création du super administrateur...")
    success = create_superadmin()
    
    if success:
        print("\n✅ Super administrateur créé avec succès!")
    else:
        print("\n❌ Échec de la création du super administrateur!")
        sys.exit(1)
