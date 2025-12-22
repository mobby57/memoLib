// 📝 MIDDLEWARE LOGGING - IAPosteManager v3.0

export const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log de la requête
  console.log(`📥 ${req.method} ${req.path}`);
  
  // Intercepter la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    console.log(`${statusEmoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};