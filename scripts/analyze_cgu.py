import sys
import PyPDF2
import re

def analyze_pdf(file_path):
    print(f"\n📄 Analyse de: {file_path}\n")
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            print(f"📊 Total pages: {num_pages}\n")
            
            # Extraire tout le texte
            full_text = ""
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                full_text += page.extract_text()
            
            print(f"📝 Caractères extraits: {len(full_text)}\n")
            
            # Rechercher des mots-clés
            keywords = {
                'souscription': r'souscri(ption|re|t)',
                'activation': r'activ(er|ation|é)',
                'conditions': r'condition',
                'accès': r'accès|acces',
                'OAuth': r'oauth',
                'authentification': r'authentification',
                'API': r'\bAPI\b',
                'délai': r'délai|delai',
                'validation': r'validat(ion|e)',
                'acceptation': r'acceptat(ion|e)',
                'CGU': r'\bCGU\b',
                'droit': r'droit',
                'quota': r'quota',
                'limite': r'limite'
            }
            
            print("🔍 Recherche de mots-clés:\n")
            
            for label, pattern in keywords.items():
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    print(f"   ✅ \"{label}\": {len(matches)} occurrence(s)")
            
            # Sections importantes
            print("\n📋 Sections pertinentes:\n")
            
            # Chercher autour de "accès" ou "activation"
            access_sections = re.findall(r'.{0,200}(?:accès|activation|souscription).{0,200}', full_text, re.IGNORECASE)
            if access_sections:
                print("--- Sections sur l'accès (5 premières) ---")
                for i, section in enumerate(access_sections[:5], 1):
                    clean_section = ' '.join(section.split())
                    print(f"{i}. {clean_section}\n")
            
            # Chercher les délais
            delay_sections = re.findall(r'.{0,150}(?:délai|jour|heure|temps).{0,150}', full_text, re.IGNORECASE)
            if delay_sections:
                print("\n--- Délais mentionnés (5 premiers) ---")
                for i, section in enumerate(delay_sections[:5], 1):
                    clean_section = ' '.join(section.split())
                    print(f"{i}. {clean_section}\n")
            
            # Sauvegarder le texte complet
            output_file = file_path.replace('.pdf', '.txt')
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print(f"\n💾 Texte complet sauvegardé dans: {output_file}")
            
            return full_text
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

if __name__ == "__main__":
    files = [
        r"c:\Users\moros\Downloads\CGU_Legifrance_API_VF_15-12-2022 (1).pdf",
        r"c:\Users\moros\Downloads\CGU_Legifrance_API_VF_15-12-2022 (2).pdf"
    ]
    
    for file_path in files:
        import os
        if os.path.exists(file_path):
            analyze_pdf(file_path)
        else:
            print(f"⚠️  Fichier non trouvé: {file_path}")
