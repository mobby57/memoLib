// 📋 ROUTES TEMPLATES - IAPosteManager v3.0
import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Mock data pour développement
let templates = [
  {
    id: 1,
    name: "Demande congé",
    subject: "Demande de congé",
    body: "Bonjour,\n\nJe souhaiterais poser des congés du {date_debut} au {date_fin}.\n\nCordialement",
    category: "rh",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Relance client",
    subject: "Relance - Facture {numero}",
    body: "Bonjour,\n\nNous n'avons pas encore reçu le règlement de la facture {numero}.\n\nMerci de régulariser.",
    category: "commercial",
    created_at: new Date().toISOString()
  }
];

// GET /api/templates - Liste des templates
router.get('/', (req, res) => {
  res.json({
    success: true,
    templates: templates
  });
});

// POST /api/templates - Créer un template
router.post('/', auth, (req, res) => {
  const { name, subject, body, category = 'general' } = req.body;
  
  if (!name || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: 'Nom, sujet et corps requis'
    });
  }
  
  const newTemplate = {
    id: templates.length + 1,
    name,
    subject,
    body,
    category,
    created_at: new Date().toISOString()
  };
  
  templates.push(newTemplate);
  
  res.json({
    success: true,
    template_id: newTemplate.id,
    message: 'Template créé avec succès'
  });
});

// PUT /api/templates/:id - Modifier un template
router.put('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const templateIndex = templates.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Template non trouvé'
    });
  }
  
  const { name, subject, body, category } = req.body;
  
  templates[templateIndex] = {
    ...templates[templateIndex],
    ...(name && { name }),
    ...(subject && { subject }),
    ...(body && { body }),
    ...(category && { category }),
    updated_at: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Template mis à jour'
  });
});

// DELETE /api/templates/:id - Supprimer un template
router.delete('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const templateIndex = templates.findIndex(t => t.id === id);
  
  if (templateIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Template non trouvé'
    });
  }
  
  templates.splice(templateIndex, 1);
  
  res.json({
    success: true,
    message: 'Template supprimé avec succès'
  });
});

export default router;