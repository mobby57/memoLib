"""Service IA simple"""
import openai

def generate_email(api_key, context, tone="professionnel"):
    """Génère un email avec OpenAI"""
    try:
        openai.api_key = api_key
        
        prompt = f"Génère un email {tone} pour: {context}"
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"Tu es un assistant qui génère des emails {tone}."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return True, response.choices[0].message.content
    except Exception as e:
        return False, str(e)
