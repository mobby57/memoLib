import json
import numpy as np
from pathlib import Path
from datetime import datetime
import re

class PredictiveLegalAI:
    """Advanced predictive AI model for legal case outcomes"""
    
    def __init__(self):
        self.decisions_db = Path('data/legal_decisions.json')
        self.model_data = Path('data/prediction_model.json')
        self.success_patterns = {}
        self.feature_weights = {}
        self.load_model()
    
    def train_prediction_model(self):
        """Train predictive model on legal decisions database"""
        if not self.decisions_db.exists():
            print("No legal decisions database found. Run scraper first.")
            return False
        
        print("🧠 Training predictive AI model...")
        
        # Load decisions
        with open(self.decisions_db, 'r', encoding='utf-8') as f:
            decisions = json.load(f)
        
        # Extract features and outcomes
        training_data = []
        for decision in decisions:
            features = self.extract_features(decision)
            outcome = decision.get('success', False)
            training_data.append({
                'features': features,
                'outcome': outcome,
                'procedure_type': decision.get('procedure_type', 'unknown')
            })
        
        # Train model for each procedure type
        procedure_types = set(d['procedure_type'] for d in training_data)
        
        for proc_type in procedure_types:
            proc_data = [d for d in training_data if d['procedure_type'] == proc_type]
            if len(proc_data) < 10:  # Need minimum data
                continue
            
            print(f"Training model for {proc_type} ({len(proc_data)} cases)")
            model = self.train_procedure_model(proc_data)
            self.success_patterns[proc_type] = model
        
        # Save trained model
        self.save_model()
        print("✅ Predictive model trained successfully!")
        return True
    
    def extract_features(self, decision):
        """Extract predictive features from decision"""
        content = decision.get('content', '').lower()
        
        # Positive indicators
        positive_features = {
            'family_ties': len(re.findall(r'famille|enfant|époux|conjoint', content)),
            'integration': len(re.findall(r'intégration|français|travail|emploi', content)),
            'duration': len(re.findall(r'depuis|présence|résidence', content)),
            'health': len(re.findall(r'santé|médical|soins', content)),
            'education': len(re.findall(r'école|étude|formation', content))
        }
        
        # Negative indicators
        negative_features = {
            'criminal': len(re.findall(r'condamnation|délit|trouble|ordre public', content)),
            'fraud': len(re.findall(r'fraude|faux|mensonge', content)),
            'irregular': len(re.findall(r'irrégulier|clandestin|sans papier', content))
        }
        
        # Court type (some courts more favorable)
        court = decision.get('court', '').lower()
        court_favorability = 0.5  # Default
        if 'conseil d\'état' in court:
            court_favorability = 0.7
        elif 'cour administrative' in court:
            court_favorability = 0.6
        
        return {
            **positive_features,
            **negative_features,
            'court_favorability': court_favorability,
            'total_positive': sum(positive_features.values()),
            'total_negative': sum(negative_features.values())
        }
    
    def train_procedure_model(self, training_data):
        """Train model for specific procedure type"""
        # Simple weighted scoring model
        feature_importance = {}
        
        # Calculate feature correlations with success
        all_features = set()
        for data in training_data:
            all_features.update(data['features'].keys())
        
        for feature in all_features:
            successful_cases = [d for d in training_data if d['outcome']]
            failed_cases = [d for d in training_data if not d['outcome']]
            
            if successful_cases and failed_cases:
                success_avg = np.mean([d['features'].get(feature, 0) for d in successful_cases])
                fail_avg = np.mean([d['features'].get(feature, 0) for d in failed_cases])
                
                # Feature importance = difference in averages
                importance = success_avg - fail_avg
                feature_importance[feature] = importance
        
        # Calculate base success rate
        success_count = sum(1 for d in training_data if d['outcome'])
        base_success_rate = success_count / len(training_data)
        
        return {
            'feature_weights': feature_importance,
            'base_success_rate': base_success_rate,
            'training_size': len(training_data)
        }
    
    def predict_case_success(self, case_description, procedure_type='titre_sejour'):
        """Predict success probability for a case"""
        if procedure_type not in self.success_patterns:
            # Fallback to general prediction
            return self.fallback_prediction(case_description, procedure_type)
        
        model = self.success_patterns[procedure_type]
        
        # Create mock decision for feature extraction
        mock_decision = {
            'content': case_description,
            'court': 'Tribunal Administratif de Paris',
            'procedure_type': procedure_type
        }
        
        features = self.extract_features(mock_decision)
        
        # Calculate weighted score
        score = model['base_success_rate']
        for feature, value in features.items():
            weight = model['feature_weights'].get(feature, 0)
            score += weight * value * 0.1  # Scale factor
        
        # Normalize to 0-1 range
        probability = max(0.1, min(0.9, score))
        
        # Generate detailed analysis
        analysis = self.generate_detailed_analysis(features, model, probability)
        
        return {
            'success_probability': round(probability, 3),
            'confidence': min(0.9, model['training_size'] / 100),
            'procedure_type': procedure_type,
            'key_factors': analysis['key_factors'],
            'recommendations': analysis['recommendations'],
            'similar_cases': model['training_size']
        }
    
    def generate_detailed_analysis(self, features, model, probability):
        """Generate detailed case analysis"""
        key_factors = []
        recommendations = []
        
        # Analyze positive factors
        if features['family_ties'] > 0:
            key_factors.append(f"Liens familiaux identifiés (+{features['family_ties']} mentions)")
            recommendations.append("Renforcer la documentation des liens familiaux")
        
        if features['integration'] > 0:
            key_factors.append(f"Éléments d'intégration (+{features['integration']} mentions)")
            recommendations.append("Mettre en avant l'intégration sociale et professionnelle")
        
        # Analyze negative factors
        if features['criminal'] > 0:
            key_factors.append(f"Problèmes judiciaires (-{features['criminal']} mentions)")
            recommendations.append("Préparer justifications pour antécédents")
        
        # Success probability recommendations
        if probability > 0.7:
            recommendations.append("Dossier favorable - Procéder avec confiance")
        elif probability > 0.5:
            recommendations.append("Dossier mitigé - Renforcer les éléments positifs")
        else:
            recommendations.append("Dossier difficile - Stratégie défensive recommandée")
        
        return {
            'key_factors': key_factors,
            'recommendations': recommendations
        }
    
    def fallback_prediction(self, case_description, procedure_type):
        """Fallback prediction when no trained model available"""
        # Basic keyword analysis
        content = case_description.lower()
        
        base_rates = {
            'titre_sejour': 0.78,
            'regroupement_familial': 0.65,
            'naturalisation': 0.82,
            'recours_oqtf': 0.35
        }
        
        base_rate = base_rates.get(procedure_type, 0.5)
        
        # Simple adjustments
        positive_keywords = ['famille', 'enfant', 'travail', 'intégration', 'français']
        negative_keywords = ['condamnation', 'trouble', 'fraude', 'irrégulier']
        
        positive_score = sum(1 for kw in positive_keywords if kw in content)
        negative_score = sum(1 for kw in negative_keywords if kw in content)
        
        adjustment = (positive_score - negative_score) * 0.1
        probability = max(0.1, min(0.9, base_rate + adjustment))
        
        return {
            'success_probability': round(probability, 3),
            'confidence': 0.6,  # Lower confidence for fallback
            'procedure_type': procedure_type,
            'key_factors': [f"Analyse basique - {positive_score} facteurs positifs, {negative_score} négatifs"],
            'recommendations': ["Analyse approfondie recommandée avec plus de données"],
            'similar_cases': 0
        }
    
    def save_model(self):
        """Save trained model to file"""
        model_data = {
            'success_patterns': self.success_patterns,
            'trained_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        with open(self.model_data, 'w') as f:
            json.dump(model_data, f, indent=2)
    
    def load_model(self):
        """Load trained model from file"""
        if self.model_data.exists():
            try:
                with open(self.model_data, 'r') as f:
                    data = json.load(f)
                    self.success_patterns = data.get('success_patterns', {})
                    print(f"Loaded model trained at {data.get('trained_at', 'unknown')}")
            except Exception as e:
                print(f"Error loading model: {e}")
    
    def get_model_stats(self):
        """Get model statistics"""
        stats = {}
        for proc_type, model in self.success_patterns.items():
            stats[proc_type] = {
                'training_cases': model['training_size'],
                'base_success_rate': round(model['base_success_rate'], 3),
                'features_analyzed': len(model['feature_weights'])
            }
        return stats

# Global instance
predictive_ai = PredictiveLegalAI()

def train_ai_model():
    """Train the AI prediction model"""
    return predictive_ai.train_prediction_model()

def predict_case_outcome(description, procedure_type='titre_sejour'):
    """Predict case outcome using trained AI"""
    return predictive_ai.predict_case_success(description, procedure_type)