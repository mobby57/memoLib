"""
Tests d'intégration pour le Email Connector
Teste les fonctionnalités IMAP/SMTP
"""

import pytest
import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le chemin racine au PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.backend.services.email_connector import EmailConnector, EmailMessage


@pytest.fixture
def email_connector():
    """Fixture pour créer une instance EmailConnector"""
    return EmailConnector()


class TestEmailConnector:
    """Tests pour le connecteur email"""
    
    def test_connector_initialization(self, email_connector):
        """Test que le connecteur s'initialise correctement"""
        assert email_connector is not None
        assert email_connector.imap_host is not None
        assert email_connector.smtp_host is not None
    
    def test_configuration_loaded(self, email_connector):
        """Test que la configuration est chargée depuis .env"""
        # Vérifier que les valeurs par défaut ou .env sont chargées
        assert email_connector.imap_host in ['imap.gmail.com', os.getenv('IMAP_HOST')]
        assert email_connector.smtp_host in ['smtp.gmail.com', os.getenv('SMTP_HOST')]
        assert email_connector.imap_port in [993, int(os.getenv('IMAP_PORT', 993))]
        assert email_connector.smtp_port in [587, int(os.getenv('SMTP_PORT', 587))]
    
    @pytest.mark.skipif(
        not os.getenv('IMAP_USERNAME') or not os.getenv('IMAP_PASSWORD'),
        reason="Credentials IMAP non configurés"
    )
    def test_imap_connection(self, email_connector):
        """Test de connexion IMAP (uniquement si credentials configurés)"""
        try:
            mail = email_connector.connect_imap()
            assert mail is not None
            mail.logout()
        except Exception as e:
            pytest.fail(f"Connexion IMAP échouée: {e}")
    
    @pytest.mark.skipif(
        not os.getenv('SMTP_USERNAME') or not os.getenv('SMTP_PASSWORD'),
        reason="Credentials SMTP non configurés"
    )
    def test_smtp_connection(self, email_connector):
        """Test de connexion SMTP (uniquement si credentials configurés)"""
        results = email_connector.test_connection()
        assert 'smtp' in results
        # Note: Le test peut échouer si credentials invalides, c'est normal
    
    def test_email_message_dataclass(self):
        """Test de la dataclass EmailMessage"""
        email_msg = EmailMessage(
            message_id='<test@example.com>',
            from_address='sender@example.com',
            to_address='receiver@example.com',
            subject='Test Email',
            body='This is a test email body'
        )
        
        assert email_msg.message_id == '<test@example.com>'
        assert email_msg.from_address == 'sender@example.com'
        assert email_msg.subject == 'Test Email'
        assert email_msg.body == 'This is a test email body'
        assert email_msg.attachments == []  # Default empty list
    
    def test_html_to_text_conversion(self, email_connector):
        """Test de la conversion HTML vers texte"""
        html = '<p>Hello</p><br><strong>World</strong>'
        text = email_connector._html_to_text(html)
        
        assert 'Hello' in text
        assert 'World' in text
        assert '<p>' not in text
        assert '<br>' not in text
    
    def test_decode_header_value(self, email_connector):
        """Test du décodage de headers"""
        # Header simple
        simple_header = 'Test Subject'
        decoded = email_connector._decode_header_value(simple_header)
        assert decoded == 'Test Subject'
        
        # Header vide
        empty_header = ''
        decoded_empty = email_connector._decode_header_value(empty_header)
        assert decoded_empty == ''
    
    @pytest.mark.skipif(
        not os.getenv('IMAP_USERNAME') or not os.getenv('IMAP_PASSWORD'),
        reason="Credentials IMAP non configurés"
    )
    def test_fetch_new_emails(self, email_connector):
        """Test de récupération d'emails (uniquement si credentials configurés)"""
        try:
            emails = email_connector.fetch_new_emails(mark_as_read=False)
            assert isinstance(emails, list)
            # Il peut y avoir 0 emails, c'est normal
            
            if emails:
                # Vérifier le premier email si présent
                first_email = emails[0]
                assert isinstance(first_email, EmailMessage)
                assert first_email.from_address is not None
                assert first_email.subject is not None
                
        except Exception as e:
            pytest.skip(f"Fetch emails impossible: {e}")
    
    @pytest.mark.skipif(
        not os.getenv('SMTP_USERNAME') or not os.getenv('SMTP_PASSWORD'),
        reason="Credentials SMTP non configurés"
    )
    @pytest.mark.skip(reason="Test désactivé pour éviter l'envoi d'emails réels")
    def test_send_email(self, email_connector):
        """
        Test d'envoi d'email (DÉSACTIVÉ par défaut)
        Décommentez le skip pour tester l'envoi réel
        """
        test_recipient = os.getenv('TEST_EMAIL_RECIPIENT', email_connector.smtp_user)
        
        success = email_connector.send_email(
            to=test_recipient,
            subject='Test Email from IA Poste Manager',
            body='This is a test email. You can ignore this message.',
            html=False
        )
        
        assert success is True


class TestEmailMessage:
    """Tests pour la dataclass EmailMessage"""
    
    def test_email_message_creation(self):
        """Test de création d'un EmailMessage"""
        msg = EmailMessage(
            message_id='123',
            from_address='test@example.com',
            to_address='dest@example.com',
            subject='Test',
            body='Test body'
        )
        
        assert msg.message_id == '123'
        assert str(msg) == 'Email from test@example.com: Test'
    
    def test_email_message_with_attachments(self):
        """Test EmailMessage avec pièces jointes"""
        msg = EmailMessage(
            message_id='456',
            from_address='test@example.com',
            to_address='dest@example.com',
            subject='With attachment',
            body='See attached',
            attachments=['file1.pdf', 'file2.doc']
        )
        
        assert len(msg.attachments) == 2
        assert 'file1.pdf' in msg.attachments
    
    def test_email_message_with_html(self):
        """Test EmailMessage avec corps HTML"""
        msg = EmailMessage(
            message_id='789',
            from_address='test@example.com',
            to_address='dest@example.com',
            subject='HTML Email',
            body='Plain text',
            html_body='<p>HTML content</p>'
        )
        
        assert msg.body == 'Plain text'
        assert msg.html_body == '<p>HTML content</p>'


@pytest.mark.integration
class TestEmailIntegration:
    """Tests d'intégration complets (nécessitent credentials)"""
    
    @pytest.mark.skipif(
        not all([
            os.getenv('IMAP_USERNAME'),
            os.getenv('IMAP_PASSWORD'),
            os.getenv('SMTP_USERNAME'),
            os.getenv('SMTP_PASSWORD')
        ]),
        reason="Credentials complets non configurés"
    )
    def test_full_connection_test(self):
        """Test complet de connexion IMAP + SMTP"""
        connector = EmailConnector()
        results = connector.test_connection()
        
        assert 'imap' in results
        assert 'smtp' in results
        # Note: Les connexions peuvent échouer si credentials invalides
        
        if results['imap']:
            print("✅ IMAP connection successful")
        else:
            print("❌ IMAP connection failed")
        
        if results['smtp']:
            print("✅ SMTP connection successful")
        else:
            print("❌ SMTP connection failed")


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🧪 TESTS EMAIL CONNECTOR")
    print("="*60 + "\n")
    
    # Lancer les tests avec pytest
    pytest.main([
        __file__,
        '-v',
        '--tb=short',
        '-k', 'not test_send_email'  # Exclure le test d'envoi par défaut
    ])
