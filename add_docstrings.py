#!/usr/bin/env python3
"""
🔧 Auto-Docstring Generator
Ajoute automatiquement des docstrings Google Style aux fonctions
"""

import ast
import os
import re
from typing import Dict, List

class AutoDocstring:
    """Générateur automatique de docstrings pour les fonctions existantes"""
    
    def __init__(self):
        self.templates = {
            'function': '''"""{description}
        
        {detailed_description}
        
        Args:
{args_section}        
        Returns:
            {return_type}: {return_description}
            
        Example:
            >>> {function_name}({example_args})
            {example_result}
        """''',
        
            'method': '''"""{description}
        
        {detailed_description}
        
        Args:
{args_section}        
        Returns:
            {return_type}: {return_description}
        """''',
        
            'class': '''"""{description}
        
        {detailed_description}
        
        Attributes:
{attributes_section}        
        """'''
        }
    
    def analyze_function_purpose(self, func_name: str, args: List[str]) -> Dict:
        """Analyser le but d'une fonction basé sur son nom et arguments"""
        
        # Dictionnaire de patterns pour deviner le but
        purpose_patterns = {
            'calculer': 'Calcule',
            'generer': 'Génère',
            'creer': 'Crée',
            'modifier': 'Modifie',
            'supprimer': 'Supprime',
            'lister': 'Liste',
            'get': 'Récupère',
            'set': 'Définit',
            'load': 'Charge',
            'save': 'Sauvegarde',
            'enregistrer': 'Enregistre',
            'marquer': 'Marque',
            'verifier': 'Vérifie',
            'valider': 'Valide',
            'analyser': 'Analyse',
            'predict': 'Prédit',
            'extract': 'Extrait',
            'find': 'Trouve',
            'search': 'Recherche'
        }
        
        # Analyser le nom de la fonction
        func_lower = func_name.lower()
        description = func_name.replace('_', ' ').title()
        
        for pattern, action in purpose_patterns.items():
            if pattern in func_lower:
                if 'delai' in func_lower:
                    description = f"{action} les délais juridiques"
                elif 'facture' in func_lower:
                    description = f"{action} les factures"
                elif 'temps' in func_lower:
                    description = f"{action} le temps de travail"
                elif 'ceseda' in func_lower:
                    description = f"{action} les dossiers CESEDA"
                elif 'client' in func_lower:
                    description = f"{action} les informations client"
                else:
                    description = f"{action} {func_name.replace('_', ' ')}"
                break
        
        # Deviner le type de retour
        return_type = "Dict"
        return_desc = "Résultat de l'opération"
        
        if 'lister' in func_lower or 'get_all' in func_lower:
            return_type = "List[Dict]"
            return_desc = "Liste des éléments"
        elif 'bool' in func_lower or 'verifier' in func_lower or 'valider' in func_lower:
            return_type = "bool"
            return_desc = "True si succès, False sinon"
        elif 'count' in func_lower or 'nombre' in func_lower:
            return_type = "int"
            return_desc = "Nombre d'éléments"
        elif 'statistiques' in func_lower or 'stats' in func_lower:
            return_type = "Dict"
            return_desc = "Statistiques détaillées"
        
        return {
            'description': description,
            'return_type': return_type,
            'return_description': return_desc
        }
    
    def generate_args_section(self, args: List[Dict]) -> str:
        """Générer la section Args de la docstring"""
        if not args:
            return ""
        
        args_lines = []
        for arg in args:
            arg_name = arg['name']
            arg_type = arg.get('annotation', 'Any')
            
            # Deviner la description basée sur le nom
            descriptions = {
                'case_id': 'ID du dossier juridique',
                'client_id': 'ID du client',
                'user_id': 'ID de l\'utilisateur',
                'data': 'Données à traiter',
                'filters': 'Filtres à appliquer',
                'date': 'Date au format YYYY-MM-DD',
                'start_date': 'Date de début',
                'end_date': 'Date de fin',
                'hours': 'Nombre d\'heures',
                'amount': 'Montant en euros',
                'description': 'Description textuelle',
                'file_path': 'Chemin vers le fichier',
                'deadline_id': 'ID du délai',
                'invoice_id': 'ID de la facture',
                'entry_id': 'ID de l\'entrée'
            }
            
            desc = descriptions.get(arg_name, f"Paramètre {arg_name}")
            args_lines.append(f"            {arg_name} ({arg_type}): {desc}")
        
        return "\n".join(args_lines) + "\n"
    
    def add_docstring_to_function(self, file_path: str, func_name: str, line_number: int):
        """Ajouter une docstring à une fonction spécifique"""
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Trouver la fonction
        func_line_idx = line_number - 1  # ast utilise 1-based indexing
        
        # Analyser la signature de la fonction
        func_line = lines[func_line_idx].strip()
        
        # Extraire les arguments (simple parsing)
        if '(' in func_line and ')' in func_line:
            args_part = func_line[func_line.find('(')+1:func_line.rfind(')')]
            args = []
            if args_part.strip():
                for arg in args_part.split(','):
                    arg = arg.strip()
                    if arg and arg != 'self':
                        arg_name = arg.split(':')[0].split('=')[0].strip()
                        arg_type = 'Any'
                        if ':' in arg:
                            arg_type = arg.split(':')[1].split('=')[0].strip()
                        args.append({'name': arg_name, 'annotation': arg_type})
        else:
            args = []
        
        # Analyser le but de la fonction
        purpose = self.analyze_function_purpose(func_name, [a['name'] for a in args])
        
        # Générer la docstring
        args_section = self.generate_args_section(args)
        
        # Exemple simple
        example_args = ', '.join([f'"{a["name"]}"' if 'str' in a.get('annotation', '') else f'{a["name"]}' for a in args[:2]])
        
        docstring = self.templates['function'].format(
            description=purpose['description'],
            detailed_description="Description détaillée de la fonction.",
            args_section=args_section,
            return_type=purpose['return_type'],
            return_description=purpose['return_description'],
            function_name=func_name,
            example_args=example_args or '',
            example_result='résultat_attendu'
        )
        
        # Trouver où insérer la docstring
        insert_idx = func_line_idx + 1
        
        # Vérifier s'il y a déjà une docstring
        if insert_idx < len(lines):
            next_line = lines[insert_idx].strip()
            if next_line.startswith('"""') or next_line.startswith("'''"):
                print(f"⚠️ Fonction {func_name} a déjà une docstring")
                return False
        
        # Insérer la docstring avec la bonne indentation
        indent = len(lines[func_line_idx]) - len(lines[func_line_idx].lstrip())
        indented_docstring = '\n'.join([' ' * (indent + 4) + line if line.strip() else line 
                                       for line in docstring.split('\n')])
        
        lines.insert(insert_idx, indented_docstring + '\n')
        
        # Sauvegarder le fichier
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        return True
    
    def process_file(self, file_path: str) -> Dict:
        """Traiter un fichier et ajouter des docstrings aux fonctions non documentées"""
        
        if not os.path.exists(file_path):
            return {'error': f'Fichier non trouvé: {file_path}'}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            functions_processed = []
            functions_skipped = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    docstring = ast.get_docstring(node)
                    
                    if not docstring or len(docstring.strip()) < 20:
                        # Fonction sans docstring ou docstring trop courte
                        success = self.add_docstring_to_function(file_path, node.name, node.lineno)
                        if success:
                            functions_processed.append(node.name)
                        else:
                            functions_skipped.append(node.name)
                    else:
                        functions_skipped.append(f"{node.name} (déjà documentée)")
            
            return {
                'file_path': file_path,
                'functions_processed': functions_processed,
                'functions_skipped': functions_skipped,
                'success': True
            }
            
        except Exception as e:
            return {'error': str(e), 'file_path': file_path}
    
    def process_project(self) -> Dict:
        """Traiter tous les fichiers du projet"""
        
        files_to_process = [
            'app.py',
            'ceseda_expert_ai.py',
            'src/backend/services/legal/deadline_manager.py',
            'src/backend/services/legal/billing_manager.py'
        ]
        
        results = {
            'processed_files': [],
            'total_functions_added': 0,
            'errors': []
        }
        
        for file_path in files_to_process:
            if os.path.exists(file_path):
                print(f"🔧 Traitement de {file_path}...")
                result = self.process_file(file_path)
                
                if 'error' in result:
                    results['errors'].append(result)
                    print(f"❌ Erreur: {result['error']}")
                else:
                    results['processed_files'].append(result)
                    results['total_functions_added'] += len(result['functions_processed'])
                    
                    if result['functions_processed']:
                        print(f"✅ Docstrings ajoutées: {', '.join(result['functions_processed'])}")
                    if result['functions_skipped']:
                        print(f"⏭️ Ignorées: {', '.join(result['functions_skipped'])}")
            else:
                print(f"⚠️ Fichier non trouvé: {file_path}")
        
        return results

if __name__ == "__main__":
    print("🚀 Auto-Docstring Generator - IA Poste Manager")
    print("=" * 50)
    
    generator = AutoDocstring()
    results = generator.process_project()
    
    print(f"\n📊 Résumé:")
    print(f"   Fichiers traités: {len(results['processed_files'])}")
    print(f"   Docstrings ajoutées: {results['total_functions_added']}")
    print(f"   Erreurs: {len(results['errors'])}")
    
    if results['errors']:
        print(f"\n❌ Erreurs:")
        for error in results['errors']:
            print(f"   {error['file_path']}: {error['error']}")
    
    print(f"\n✅ Terminé! Vos fonctions sont maintenant documentées.")
    print(f"💡 Lancez 'python generate_docs.py' pour générer la documentation HTML.")