"""
Email service module
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email_validator import validate_email, EmailNotValidError
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email sending service"""
    
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.default_from = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@iapostemanager.com')
        
    def validate_email_address(self, email: str) -> bool:
        """Validate email address format"""
        try:
            # validate_email returns EmailInfo object on success, raises on failure
            validate_email(email, check_deliverability=False)
            return True
        except EmailNotValidError as e:
            logger.error(f"Invalid email address {email}: {str(e)}")
            return False
    
    def send_email(self, to: str, subject: str, body: str, from_email: str = None) -> dict:
        """
        Send an email
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body (HTML or plain text)
            from_email: Sender email address (optional)
            
        Returns:
            Dict with send status
        """
        # Validate recipient email
        if not self.validate_email_address(to):
            raise ValueError(f"Invalid recipient email address: {to}")
        
        from_addr = from_email or self.default_from
        
        # Validate sender email
        if not self.validate_email_address(from_addr):
            raise ValueError(f"Invalid sender email address: {from_addr}")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_addr
        msg['To'] = to
        
        # Attach body
        if '<html>' in body.lower() or '<body>' in body.lower():
            part = MIMEText(body, 'html')
        else:
            part = MIMEText(body, 'plain')
        msg.attach(part)
        
        # Send email (mock for development if no SMTP configured)
        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP not configured - email would be sent in production")
            return {
                'to': to,
                'subject': subject,
                'status': 'mock_sent',
                'message': 'Email mock sent (configure SMTP for production)'
            }
        
        try:
            # Connect and send
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to}")
            return {
                'to': to,
                'subject': subject,
                'status': 'sent',
                'message': 'Email sent successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            raise Exception(f"Failed to send email: {str(e)}")
