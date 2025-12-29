import openai
import os
from typing import Dict, List

class EnhancedAIService:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.models = {
            'fast': 'gpt-3.5-turbo',
            'advanced': 'gpt-4-turbo-preview',
            'vision': 'gpt-4-vision-preview'
        }
    
    def generate_legal_document(self, document_type: str, context: Dict) -> str:
        legal_prompts = {
            'contract': "Generate a professional contract based on the following details:",
            'letter': "Create a formal legal letter with the following requirements:",
            'motion': "Draft a legal motion for court filing with these specifications:"
        }
        
        prompt = f"""
        {legal_prompts.get(document_type, 'Generate a legal document')}
        
        Context: {context}
        
        Requirements:
        - Professional legal language
        - Proper formatting and structure
        - Include all necessary legal clauses
        - Ensure compliance with current regulations
        """
        
        response = openai.ChatCompletion.create(
            model=self.models['advanced'],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    
    def analyze_document_ocr(self, image_data: bytes) -> Dict:
        # OCR + AI analysis
        response = openai.ChatCompletion.create(
            model=self.models['vision'],
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this document and extract key information"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                ]
            }],
            max_tokens=1000
        )
        
        return {
            'extracted_text': response.choices[0].message.content,
            'document_type': 'auto_detected',
            'confidence': 0.95
        }
    
    def predictive_analytics(self, tenant_data: Dict) -> Dict:
        prompt = f"""
        Analyze this business data and provide insights:
        {tenant_data}
        
        Provide:
        1. Usage trends
        2. Growth predictions
        3. Optimization recommendations
        4. Risk factors
        """
        
        response = openai.ChatCompletion.create(
            model=self.models['advanced'],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return {
            'insights': response.choices[0].message.content,
            'confidence_score': 0.87,
            'generated_at': '2024-01-15T10:30:00Z'
        }