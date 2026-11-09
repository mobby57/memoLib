const fs = require('fs');
const file = "src/components/NotificationCenter.tsx";

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. S'assurer que les notifications ont toujours une structure par défaut
    // On cherche la fonction getFilteredNotifications
    const oldFunc = `const getFilteredNotifications = () => {`;
    const newFunc = `const getFilteredNotifications = () => {
      // Sécurité : si notifications n'est pas défini ou mal formé, on renvoie un tableau vide
      if (!notifications) return [];
      const safeNotifs = {
        emails: notifications.emails || [],
        dossiers: notifications.dossiers || [],
        deadlines: notifications.deadlines || [],
        system: notifications.system || [],
      };`;
    
    if (content.includes(oldFunc) && !content.includes("safeNotifs")) {
        content = content.replace(oldFunc, newFunc);
        
        // Remplacer les notifications.X par safeNotifs.X dans le switch
        content = content.replace(/notifications\.emails/g, "safeNotifs.emails");
        content = content.replace(/notifications\.dossiers/g, "safeNotifs.dossiers");
        content = content.replace(/notifications\.deadlines/g, "safeNotifs.deadlines");
        content = content.replace(/notifications\.system/g, "safeNotifs.system");
        
        // Mais il ne faut pas remplacer dans safeNotifs lui-même !
        content = content.replace(/safeNotifs\.emails: notifications\.emails/g, "emails: notifications.emails");
        
        console.log("✅ NotificationCenter.tsx sécurisé.");
    } else {
        console.log("ℹ️ Déjà sécurisé ou pattern non trouvé.");
    }

    fs.writeFileSync(file, content, 'utf8');
} else {
    console.log("❌ Fichier introuvable.");
}
