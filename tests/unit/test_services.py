"""Tests services"""
import pytest
from unittest.mock import Mock, patch
from src.services.email_service_real import EmailService
from src.services.ai_service_real import AIService

def test_email_service():
    service = EmailService()
    
    # Mock SMTP
    with patch('smtplib.SMTP') as mock_smtp:
        mock_server = Mock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        success, message = service.send_email(
            ('test@gmail.com', 'password'),
            'dest@test.com',
            'Test Subject',
            'Test Body'
        )
        
        assert success == True
        mock_server.login.assert_called_once()

def test_ai_service():
    service = AIService('fake-api-key')
    
    # Mock OpenAI
    with patch.object(service, 'client') as mock_client:
        mock_message = Mock()
        mock_message.content = "Objet: Test\n\nCorps du message"
        
        mock_choice = Mock()
        mock_choice.message = mock_message
        
        mock_response = Mock()
        mock_response.choices = [mock_choice]
        
        mock_client.chat.completions.create.return_value = mock_response
        
        success, result = service.generate_email('test context')
        
        assert success == True
        assert 'subject' in result
        assert 'body' in result