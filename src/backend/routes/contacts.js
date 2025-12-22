// 👥 ROUTES CONTACTS - IAPosteManager v3.0
import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Mock data pour développement
let contacts = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    organization: "Entreprise ABC",
    category: "client",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Marie Martin",
    email: "marie.martin@company.fr",
    organization: "Company XYZ",
    category: "fournisseur",
    created_at: new Date().toISOString()
  }
];

// GET /api/contacts - Liste des contacts
router.get('/', auth, (req, res) => {
  const { category, search } = req.query;
  
  let filteredContacts = contacts;
  
  if (category) {
    filteredContacts = filteredContacts.filter(c => c.category === category);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredContacts = filteredContacts.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.organization.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({
    success: true,
    contacts: filteredContacts
  });
});

// POST /api/contacts - Créer un contact
router.post('/', auth, (req, res) => {
  const { name, email, organization, category = 'general' } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Nom et email requis'
    });
  }
  
  // Vérifier si l'email existe déjà
  const existingContact = contacts.find(c => c.email === email);
  if (existingContact) {
    return res.status(400).json({
      success: false,
      error: 'Un contact avec cet email existe déjà'
    });
  }
  
  const newContact = {
    id: contacts.length + 1,
    name,
    email,
    organization: organization || '',
    category,
    created_at: new Date().toISOString()
  };
  
  contacts.push(newContact);
  
  res.json({
    success: true,
    contact_id: newContact.id,
    message: 'Contact créé avec succès'
  });
});

// PUT /api/contacts/:id - Modifier un contact
router.put('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const contactIndex = contacts.findIndex(c => c.id === id);
  
  if (contactIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Contact non trouvé'
    });
  }
  
  const { name, email, organization, category } = req.body;
  
  // Vérifier si le nouvel email existe déjà (sauf pour ce contact)
  if (email && email !== contacts[contactIndex].email) {
    const existingContact = contacts.find(c => c.email === email && c.id !== id);
    if (existingContact) {
      return res.status(400).json({
        success: false,
        error: 'Un contact avec cet email existe déjà'
      });
    }
  }
  
  contacts[contactIndex] = {
    ...contacts[contactIndex],
    ...(name && { name }),
    ...(email && { email }),
    ...(organization !== undefined && { organization }),
    ...(category && { category }),
    updated_at: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Contact mis à jour'
  });
});

// DELETE /api/contacts/:id - Supprimer un contact
router.delete('/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const contactIndex = contacts.findIndex(c => c.id === id);
  
  if (contactIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Contact non trouvé'
    });
  }
  
  contacts.splice(contactIndex, 1);
  
  res.json({
    success: true,
    message: 'Contact supprimé avec succès'
  });
});

// GET /api/contacts/categories - Liste des catégories
router.get('/categories', auth, (req, res) => {
  const categories = [...new Set(contacts.map(c => c.category))];
  
  res.json({
    success: true,
    categories: categories
  });
});

export default router;