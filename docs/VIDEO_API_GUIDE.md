# 🎬 Video API - Génération Vidéo avec Sora

## Génération Vidéo Simple

### Créer une Vidéo

```javascript
import { videoAPI } from './services/api';

// Génération basique
const video = await videoAPI.create(
  "Un chat calico jouant du piano sur scène",
  {
    model: 'sora-2',
    seconds: '8',
    size: '1280x720'
  }
);

console.log('Video ID:', video.id);
console.log('Status:', video.status);
```

### Attendre la Complétion

```javascript
// Créer et attendre automatiquement
const completedVideo = await videoAPI.createAndWait(
  "Une présentation produit élégante",
  {
    model: 'sora-2-pro',
    seconds: '12',
    size: '1792x1024'
  }
);

// Télécharger le contenu
const videoBlob = await videoAPI.downloadContent(completedVideo.id);
const videoUrl = URL.createObjectURL(videoBlob);
```

## Formats et Options

### Tailles Disponibles

```javascript
const sizes = {
  portrait: '720x1280',      // Mobile vertical
  landscape: '1280x720',     // Desktop horizontal
  vertical: '1024x1792',     // Stories/Reels
  horizontal: '1792x1024'    // Cinématique
};
```

### Durées Supportées

- `'4'` secondes - Rapide et économique
- `'8'` secondes - Standard
- `'12'` secondes - Contenu détaillé

### Modèles

- `sora-2` - Standard, bon rapport qualité/prix
- `sora-2-pro` - Qualité premium, plus cher

## Remix de Vidéos

```javascript
// Remixer une vidéo existante
const originalVideo = await videoAPI.create(
  "Un chien qui court dans un parc"
);

await videoAPI.waitForCompletion(originalVideo.id);

// Créer une variation
const remixedVideo = await videoAPI.remix(
  originalVideo.id,
  "Le même chien qui court mais sous la pluie avec un arc-en-ciel"
);
```

## Service Email Vidéo

### Vidéo Marketing pour Email

```javascript
import { emailVideoAPI } from './services/api';

// Générer une vidéo basée sur le contenu email
const emailContent = "Découvrez notre nouvelle collection printemps...";

const marketingVideo = await emailVideoAPI.generateEmailVideo(
  emailContent,
  {
    style: 'professional',
    duration: '8',
    format: 'landscape'
  }
);

// Attendre et intégrer dans l'email
const completed = await videoAPI.waitForCompletion(marketingVideo.id);
const videoUrl = await videoAPI.downloadContent(completed.id);
```

### Vidéo Produit

```javascript
// Showcase produit automatique
const productVideo = await emailVideoAPI.generateProductVideo(
  "Smartphone dernière génération avec caméra 108MP",
  {
    duration: '12',
    size: videoAPI.utils.sizes.horizontal
  }
);
```

### Vidéo Explicative

```javascript
// Vidéo d'explication de concept
const explainerVideo = await emailVideoAPI.generateExplainerVideo(
  "Comment fonctionne l'intelligence artificielle",
  {
    duration: '12',
    size: videoAPI.utils.sizes.landscape
  }
);
```

## Exemple Complet - Générateur Vidéo Email

```javascript
// Composant React pour génération vidéo
import { useState } from 'react';
import { videoAPI, emailVideoAPI } from '../services/api';

function EmailVideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cost, setCost] = useState(0);

  const generateVideo = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Estimer le coût
      const estimatedCost = videoAPI.utils.estimateCost('8', 'sora-2');
      setCost(estimatedCost);
      
      // Créer la vidéo
      const video = await emailVideoAPI.generateEmailVideo(prompt, {
        duration: '8',
        format: 'landscape'
      });
      
      // Polling pour le progrès
      const pollProgress = setInterval(async () => {
        const status = await videoAPI.get(video.id);
        setProgress(status.progress || 0);
        
        if (status.status === 'completed') {
          clearInterval(pollProgress);
          
          // Télécharger et afficher
          const content = await videoAPI.downloadContent(video.id);
          const url = URL.createObjectURL(content);
          setVideoUrl(url);
          setIsGenerating(false);
        } else if (status.status === 'failed') {
          clearInterval(pollProgress);
          throw new Error('Génération échouée');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Erreur génération vidéo:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="video-generator">
      <h3>🎬 Générateur Vidéo Email</h3>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Décrivez votre vidéo marketing..."
        rows={4}
      />
      
      <div className="controls">
        <button 
          onClick={generateVideo}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? `Génération... ${progress}%` : 'Générer Vidéo'}
        </button>
        
        <span className="cost">
          Coût estimé: ${cost.toFixed(2)}
        </span>
      </div>
      
      {isGenerating && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {videoUrl && (
        <div className="video-result">
          <video 
            src={videoUrl} 
            controls 
            width="100%" 
            height="auto"
          />
          <button onClick={() => copyToClipboard(videoUrl)}>
            📋 Copier URL
          </button>
        </div>
      )}
    </div>
  );
}
```

## Gestion des États

```javascript
// Surveiller le statut d'une vidéo
const monitorVideo = async (videoId) => {
  const video = await videoAPI.get(videoId);
  
  switch (video.status) {
    case 'queued':
      console.log('Vidéo en file d\'attente');
      break;
    case 'processing':
      console.log(`Génération en cours: ${video.progress}%`);
      break;
    case 'completed':
      console.log('Vidéo terminée!');
      const content = await videoAPI.downloadContent(videoId);
      return content;
    case 'failed':
      console.error('Échec:', video.error?.message);
      break;
  }
};
```

## Optimisations et Cache

```javascript
// Cache des vidéos générées
const videoCache = new Map();

const getCachedVideo = async (prompt, options) => {
  const cacheKey = `${prompt}_${JSON.stringify(options)}`;
  
  if (videoCache.has(cacheKey)) {
    const cachedId = videoCache.get(cacheKey);
    try {
      return await videoAPI.get(cachedId);
    } catch {
      videoCache.delete(cacheKey);
    }
  }
  
  const video = await videoAPI.create(prompt, options);
  videoCache.set(cacheKey, video.id);
  
  return video;
};
```

## Intégration Email

```javascript
// Intégrer vidéo dans template email
const createVideoEmail = async (emailContent, recipientEmail) => {
  // 1. Générer la vidéo
  const video = await emailVideoAPI.generateEmailVideo(emailContent);
  const completed = await videoAPI.waitForCompletion(video.id);
  
  // 2. Obtenir l'URL de prévisualisation
  const previewUrl = videoAPI.utils.createPreviewUrl(completed.id);
  
  // 3. Créer le template email avec vidéo
  const emailTemplate = `
    <div style="text-align: center;">
      <h2>Découvrez notre nouveauté !</h2>
      <video width="600" height="400" controls poster="${previewUrl}">
        <source src="${previewUrl}" type="video/mp4">
        Votre navigateur ne supporte pas la vidéo.
      </video>
      <p>${emailContent}</p>
    </div>
  `;
  
  // 4. Envoyer l'email
  return emailAPI.send({
    to: recipientEmail,
    subject: 'Découvrez notre vidéo !',
    html: emailTemplate
  });
};
```

## Webhooks Vidéo

```javascript
// Écouter les événements de complétion vidéo
window.addEventListener('openai-video-completed', (event) => {
  const { videoId } = event.detail;
  console.log('Vidéo terminée:', videoId);
  
  // Télécharger automatiquement
  videoAPI.downloadContent(videoId).then(blob => {
    const url = URL.createObjectURL(blob);
    displayVideo(url);
  });
});
```

## Limites et Considérations

### Coûts
- **Sora-2**: ~$0.05/seconde
- **Sora-2-Pro**: ~$0.08/seconde
- Vidéo 8s en HD ≈ $0.40-0.64

### Temps de Génération
- 4 secondes: ~2-5 minutes
- 8 secondes: ~5-10 minutes  
- 12 secondes: ~10-15 minutes

### Bonnes Pratiques

```javascript
// Prompts efficaces
const goodPrompts = [
  "Professional product showcase in modern studio lighting",
  "Animated logo reveal with smooth transitions",
  "Customer testimonial in bright, welcoming environment"
];

// Éviter les prompts vagues
const badPrompts = [
  "Make a video",
  "Something cool",
  "Random stuff"
];
```

---

**Version** : 2.2  
**Statut** : ✅ Production Ready avec Sora