import pyotp
import qrcode
import io
import base64

class TwoFactorAuth:
    def __init__(self):
        pass
    
    def generate_secret(self, user_email):
        return pyotp.random_base32()
    
    def get_qr_code(self, user_email, secret):
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name="SecureVault"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        
        return base64.b64encode(buf.getvalue()).decode()
    
    def verify_token(self, secret, token):
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)