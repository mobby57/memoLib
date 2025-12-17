"""
AI text generation module
"""
import os
import logging

logger = logging.getLogger(__name__)


class AIGenerator:
    """AI text generation service"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
        
    def generate(self, prompt: str, max_tokens: int = 500, temperature: float = 0.7) -> str:
        """
        Generate text using AI
        
        Args:
            prompt: The prompt to generate from
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            
        Returns:
            Generated text
        """
        # If no API key, return mock response
        if not self.api_key:
            logger.warning("OpenAI API key not configured - returning mock response")
            return f"[AI Generated Response to: {prompt[:50]}...]\n\nThis is a mock AI-generated email. Please configure OPENAI_API_KEY environment variable to enable real AI generation.\n\nBest regards,\nIAPosteManager"
        
        try:
            from openai import OpenAI
            
            client = OpenAI(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates professional email content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            generated_text = response.choices[0].message.content
            logger.info("AI text generated successfully")
            return generated_text
            
        except Exception as e:
            logger.error(f"Error generating AI text: {str(e)}")
            raise Exception(f"Failed to generate AI text: {str(e)}")
