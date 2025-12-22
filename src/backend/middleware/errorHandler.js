// 🛠️ MIDDLEWARE GESTION ERREURS - IAPosteManager v3.0

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);
  
  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }
  
  // Erreur de limite de taille
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Fichier trop volumineux',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur serveur interne',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};