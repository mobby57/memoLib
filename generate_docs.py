#!/usr/bin/env python3
"""
🔧 Générateur de Documentation Automatique
Génère des docstrings standardisées et documentation HTML
"""

import ast
import os
import json
import inspect
from typing import Dict, List, Any
from datetime import datetime

class DocGenerator:
    """Générateur automatique de documentation pour IA Poste Manager"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = project_root
        self.docs_dir = os.path.join(project_root, "docs", "auto_generated")
        self.ensure_docs_dir()
        
    def ensure_docs_dir(self):
        """Créer le répertoire de documentation"""
        os.makedirs(self.docs_dir, exist_ok=True)
        
    def analyze_python_file(self, file_path: str) -> Dict:
        """Analyser un fichier Python et extraire les fonctions/classes"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            functions = []
            classes = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    func_info = self.extract_function_info(node, content)
                    functions.append(func_info)
                elif isinstance(node, ast.ClassDef):
                    class_info = self.extract_class_info(node, content)
                    classes.append(class_info)
            
            return {
                'file_path': file_path,
                'functions': functions,
                'classes': classes,
                'analyzed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': str(e), 'file_path': file_path}
    
    def extract_function_info(self, node: ast.FunctionDef, content: str) -> Dict:
        """Extraire les informations d'une fonction"""
        docstring = ast.get_docstring(node) or ""
        
        # Extraire les paramètres
        args = []
        for arg in node.args.args:
            args.append({
                'name': arg.arg,
                'annotation': ast.unparse(arg.annotation) if arg.annotation else None
            })
        
        # Extraire le type de retour
        return_type = ast.unparse(node.returns) if node.returns else None
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'docstring': docstring,
            'args': args,
            'return_type': return_type,
            'is_async': isinstance(node, ast.AsyncFunctionDef),
            'has_docstring': bool(docstring),
            'needs_documentation': not bool(docstring) or len(docstring) < 50
        }
    
    def extract_class_info(self, node: ast.ClassDef, content: str) -> Dict:
        """Extraire les informations d'une classe"""
        docstring = ast.get_docstring(node) or ""
        
        methods = []
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                method_info = self.extract_function_info(item, content)
                method_info['is_method'] = True
                methods.append(method_info)
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'docstring': docstring,
            'methods': methods,
            'has_docstring': bool(docstring),
            'needs_documentation': not bool(docstring) or len(docstring) < 50
        }
    
    def generate_docstring_template(self, func_info: Dict) -> str:
        """Générer un template de docstring Google Style"""
        name = func_info['name']
        args = func_info['args']
        return_type = func_info['return_type']
        
        # Template de base
        template = f'"""{name.replace("_", " ").title()}\n        \n        Description détaillée de la fonction.\n        \n'
        
        # Arguments
        if args:
            template += "        Args:\n"
            for arg in args:
                arg_type = arg['annotation'] or 'Any'
                template += f"            {arg['name']} ({arg_type}): Description du paramètre\n"
            template += "        \n"
        
        # Retour
        if return_type:
            template += f"        Returns:\n            {return_type}: Description du retour\n        \n"
        
        # Exemple
        template += "        Example:\n"
        template += f"            >>> {name}()\n"
        template += "            résultat_attendu\n"
        template += '        """'
        
        return template
    
    def scan_project(self) -> Dict:
        """Scanner tout le projet pour analyser les fichiers Python"""
        results = {
            'scanned_at': datetime.now().isoformat(),
            'files': [],
            'summary': {
                'total_files': 0,
                'total_functions': 0,
                'total_classes': 0,
                'undocumented_functions': 0,
                'undocumented_classes': 0
            }
        }
        
        # Fichiers à analyser
        python_files = [
            'app.py',
            'ceseda_expert_ai.py',
            'src/backend/services/legal/deadline_manager.py',
            'src/backend/services/legal/billing_manager.py',
            'src/backend/services/legal/compliance_manager.py',
            'src/backend/services/legal/advanced_templates.py'
        ]
        
        for file_path in python_files:
            full_path = os.path.join(self.project_root, file_path)
            if os.path.exists(full_path):
                analysis = self.analyze_python_file(full_path)
                if 'error' not in analysis:
                    results['files'].append(analysis)
                    
                    # Mettre à jour le résumé
                    results['summary']['total_files'] += 1
                    results['summary']['total_functions'] += len(analysis['functions'])
                    results['summary']['total_classes'] += len(analysis['classes'])
                    
                    # Compter les non-documentés
                    for func in analysis['functions']:
                        if func['needs_documentation']:
                            results['summary']['undocumented_functions'] += 1
                    
                    for cls in analysis['classes']:
                        if cls['needs_documentation']:
                            results['summary']['undocumented_classes'] += 1
        
        return results
    
    def generate_html_documentation(self, analysis: Dict) -> str:
        """Générer la documentation HTML"""
        html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation IA Poste Manager</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; 
                     padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #7f8c8d; }}
        .summary {{ background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .file-section {{ margin: 30px 0; border-left: 4px solid #3498db; padding-left: 20px; }}
        .function {{ background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .class {{ background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .needs-doc {{ border-left: 4px solid #e74c3c; }}
        .has-doc {{ border-left: 4px solid #27ae60; }}
        .code {{ background: #2c3e50; color: #ecf0f1; padding: 10px; border-radius: 3px; 
                 font-family: 'Courier New', monospace; white-space: pre-wrap; }}
        .badge {{ padding: 3px 8px; border-radius: 12px; font-size: 12px; color: white; }}
        .badge-success {{ background: #27ae60; }}
        .badge-warning {{ background: #f39c12; }}
        .badge-danger {{ background: #e74c3c; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Documentation IA Poste Manager v3.1</h1>
        <p><strong>Générée le:</strong> {analysis['scanned_at']}</p>
        
        <div class="summary">
            <h2>📊 Résumé</h2>
            <ul>
                <li><strong>Fichiers analysés:</strong> {analysis['summary']['total_files']}</li>
                <li><strong>Fonctions totales:</strong> {analysis['summary']['total_functions']}</li>
                <li><strong>Classes totales:</strong> {analysis['summary']['total_classes']}</li>
                <li><strong>Fonctions non documentées:</strong> 
                    <span class="badge badge-danger">{analysis['summary']['undocumented_functions']}</span></li>
                <li><strong>Classes non documentées:</strong> 
                    <span class="badge badge-danger">{analysis['summary']['undocumented_classes']}</span></li>
            </ul>
        </div>
"""
        
        # Ajouter chaque fichier
        for file_info in analysis['files']:
            html += f"""
        <div class="file-section">
            <h2>📁 {file_info['file_path']}</h2>
            
            <h3>🔧 Fonctions ({len(file_info['functions'])})</h3>
"""
            
            for func in file_info['functions']:
                doc_class = "needs-doc" if func['needs_documentation'] else "has-doc"
                badge = "badge-danger" if func['needs_documentation'] else "badge-success"
                status = "Non documentée" if func['needs_documentation'] else "Documentée"
                
                html += f"""
            <div class="function {doc_class}">
                <h4>{func['name']}() <span class="badge {badge}">{status}</span></h4>
                <p><strong>Ligne:</strong> {func['line_number']}</p>
                <p><strong>Arguments:</strong> {', '.join([arg['name'] for arg in func['args']]) or 'Aucun'}</p>
                <p><strong>Type de retour:</strong> {func['return_type'] or 'Non spécifié'}</p>
"""
                
                if func['docstring']:
                    html += f'<p><strong>Documentation:</strong></p><div class="code">{func["docstring"]}</div>'
                else:
                    template = self.generate_docstring_template(func)
                    html += f'<p><strong>Template suggéré:</strong></p><div class="code">{template}</div>'
                
                html += "</div>"
            
            # Classes
            if file_info['classes']:
                html += f"<h3>🏗️ Classes ({len(file_info['classes'])})</h3>"
                
                for cls in file_info['classes']:
                    doc_class = "needs-doc" if cls['needs_documentation'] else "has-doc"
                    badge = "badge-danger" if cls['needs_documentation'] else "badge-success"
                    status = "Non documentée" if cls['needs_documentation'] else "Documentée"
                    
                    html += f"""
            <div class="class {doc_class}">
                <h4>{cls['name']} <span class="badge {badge}">{status}</span></h4>
                <p><strong>Ligne:</strong> {cls['line_number']}</p>
                <p><strong>Méthodes:</strong> {len(cls['methods'])}</p>
"""
                    
                    if cls['docstring']:
                        html += f'<div class="code">{cls["docstring"]}</div>'
                    
                    html += "</div>"
            
            html += "</div>"
        
        html += """
    </div>
</body>
</html>"""
        
        return html
    
    def generate_documentation(self):
        """Générer la documentation complète"""
        print("🔍 Analyse du projet en cours...")
        analysis = self.scan_project()
        
        # Sauvegarder l'analyse JSON
        json_path = os.path.join(self.docs_dir, "analysis.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        
        # Générer HTML
        html_content = self.generate_html_documentation(analysis)
        html_path = os.path.join(self.docs_dir, "documentation.html")
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # Générer rapport de suggestions
        self.generate_improvement_report(analysis)
        
        print(f"✅ Documentation générée:")
        print(f"   📊 Analyse JSON: {json_path}")
        print(f"   🌐 Documentation HTML: {html_path}")
        print(f"   📋 Rapport: {os.path.join(self.docs_dir, 'improvement_report.md')}")
        
        return analysis
    
    def generate_improvement_report(self, analysis: Dict):
        """Générer un rapport d'amélioration"""
        report = f"""# 📋 Rapport d'Amélioration Documentation

**Généré le:** {analysis['scanned_at']}

## 🎯 Résumé Exécutif

- **Fichiers analysés:** {analysis['summary']['total_files']}
- **Fonctions totales:** {analysis['summary']['total_functions']}
- **Classes totales:** {analysis['summary']['total_classes']}
- **Fonctions non documentées:** {analysis['summary']['undocumented_functions']}
- **Classes non documentées:** {analysis['summary']['undocumented_classes']}

## 🚨 Actions Prioritaires

### Fonctions à documenter en urgence:

"""
        
        for file_info in analysis['files']:
            undocumented_funcs = [f for f in file_info['functions'] if f['needs_documentation']]
            if undocumented_funcs:
                report += f"\n**{file_info['file_path']}:**\n"
                for func in undocumented_funcs:
                    report += f"- `{func['name']}()` (ligne {func['line_number']})\n"
        
        report += """
## 📝 Templates de Documentation

Utilisez le format Google Style pour toutes les nouvelles docstrings:

```python
def ma_fonction(param1: str, param2: int = 0) -> Dict:
    \"\"\"Description courte de la fonction.
    
    Description détaillée si nécessaire.
    
    Args:
        param1 (str): Description du paramètre
        param2 (int, optional): Description avec valeur par défaut
        
    Returns:
        Dict: Description du retour
        
    Raises:
        ValueError: Quand param1 est vide
        
    Example:
        >>> ma_fonction("test", 5)
        {'result': 'success'}
    \"\"\"
```

## 🎯 Objectifs

- [ ] Documenter toutes les fonctions critiques (deadline_manager, billing_manager)
- [ ] Ajouter des exemples d'utilisation
- [ ] Documenter les APIs REST
- [ ] Créer des guides utilisateur
"""
        
        report_path = os.path.join(self.docs_dir, "improvement_report.md")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)

if __name__ == "__main__":
    generator = DocGenerator()
    analysis = generator.generate_documentation()
    
    print(f"\n📊 Statistiques:")
    print(f"   Fonctions non documentées: {analysis['summary']['undocumented_functions']}")
    print(f"   Classes non documentées: {analysis['summary']['undocumented_classes']}")
    print(f"\n🎯 Ouvrez docs/auto_generated/documentation.html pour voir la documentation complète")