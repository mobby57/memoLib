import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

export default function TemplateVariableModal({ template, onComplete, onCancel }) {
  const [variables, setVariables] = useState({});
  const [errors, setErrors] = useState({});

  // Extraire les variables du template
  useEffect(() => {
    const regex = /\[([^\]]+)\]/g;
    const foundVars = {};
    let match;
    
    const fullText = `${template.subject} ${template.body}`;
    while ((match = regex.exec(fullText)) !== null) {
      const varName = match[1];
      if (!foundVars[varName]) {
        foundVars[varName] = '';
      }
    }
    
    setVariables(foundVars);
  }, [template]);

  const handleChange = (varName, value) => {
    setVariables(prev => ({
      ...prev,
      [varName]: value
    }));
    // Effacer erreur si l'utilisateur commence à taper
    if (errors[varName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[varName];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    Object.keys(variables).forEach(varName => {
      if (!variables[varName].trim()) {
        newErrors[varName] = 'Ce champ est requis';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Remplacer les variables dans le template
      let filledSubject = template.subject;
      let filledBody = template.body;
      
      Object.entries(variables).forEach(([varName, value]) => {
        const placeholder = `[${varName}]`;
        filledSubject = filledSubject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        filledBody = filledBody.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      });
      
      onComplete({
        ...template,
        subject: filledSubject,
        body: filledBody
      });
    }
  };

  const varNames = Object.keys(variables);
  
  if (varNames.length === 0) {
    // Pas de variables, passer directement
    onComplete(template);
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Personnaliser le template</h2>
              <p className="text-sm text-gray-600 mt-1">
                Remplissez les variables pour personnaliser votre email
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {varNames.map((varName) => (
              <div key={varName}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {varName.replace(/_/g, ' ')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={variables[varName]}
                  onChange={(e) => handleChange(varName, e.target.value)}
                  placeholder={`Entrez ${varName.toLowerCase().replace(/_/g, ' ')}`}
                  className={`input w-full ${errors[varName] ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors[varName] && (
                  <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors[varName]}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Aperçu :</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Sujet :</span>
                  <p className="text-sm text-gray-900">
                    {Object.entries(variables).reduce((text, [varName, value]) => {
                      return text.replace(
                        new RegExp(`\\[${varName}\\]`, 'g'),
                        value || `[${varName}]`
                      );
                    }, template.subject)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Corps (extrait) :</span>
                  <p className="text-sm text-gray-900 line-clamp-3">
                    {Object.entries(variables).reduce((text, [varName, value]) => {
                      return text.replace(
                        new RegExp(`\\[${varName}\\]`, 'g'),
                        value || `[${varName}]`
                      );
                    }, template.body.substring(0, 200))}...
                  </p>
                </div>
              </div>
              
              {/* Highlight unfilled */}
              {varNames.some(v => !variables[v]) && (
                <div className="mt-3 flex items-start space-x-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Les variables non remplies apparaîtront en rouge dans l'aperçu</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Continuer avec ce template
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
