"""
USER AUTHENTICATION COMPONENT
"""

from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt


class UserAuthenticator:
    """
    Encapsulated User Authentication Component
    
    Private attributes and methods protect sensitive data.
    Public methods provide controlled access.
    """
    
    __SECRET_KEY = 'your-secret-key-change-me'
    
    def __init__(self, email, username, user_type, password):
        """Initialize user with private attributes"""
        self.__email = email
        self.__username = username
        self.__user_type = user_type
        self.__password_hash = None
        self.__created_at = datetime.utcnow()
        self.__set_password(password)
    
    def __set_password(self, password):
        """Private method to hash password"""
        self.__password_hash = generate_password_hash(password)
    
    def __generate_token_payload(self, user_id):
        """Private method to create JWT payload"""
        return {
            'user_id': user_id,
            'username': self.__username,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
    
    def verify_password(self, password):
        """Public method to verify password"""
        return check_password_hash(self.__password_hash, password)
    
    def create_auth_token(self, user_id):
        """Public method to generate authentication token"""
        payload = self.__generate_token_payload(user_id)
        return jwt.encode(payload, self.__SECRET_KEY, algorithm='HS256')
    
    @classmethod
    def verify_auth_token(cls, token):
        """Public method to verify token"""
        try:
            return jwt.decode(token, cls.__SECRET_KEY, algorithms=['HS256'])
        except:
            return None
    
    def get_user_info(self):
        """Public method to get user information"""
        return {
            'email': self.__email,
            'username': self.__username,
            'user_type': self.__user_type,
            'created_at': self.__created_at.isoformat()
        }
    
    def update_password(self, old_password, new_password):
        """Public method to change password"""
        if not self.verify_password(old_password):
            return False
        self.__set_password(new_password)
        return True
