# 🖼️ Image Streaming - Génération Progressive

## Génération d'Images en Streaming

### Utilisation Simple

```javascript
import { imageStreamingAPI } from './services/api';

// Génération progressive avec callbacks
await imageStreamingAPI.generateStream(
  "Logo professionnel pour entreprise tech",
  {
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'high',
    background: 'transparent'
  },
  {
    onPartialImage: ({ image, index }) => {
      // Afficher l'image progressive
      const imgElement = document.getElementById('preview');
      imgElement.src = `data:image/png;base64,${image}`;
      console.log(`Image partielle ${index + 1}`);
    },
    
    onComplete: ({ image, usage, partialImages }) => {
      // Image finale
      const finalImg = document.getElementById('final-image');
      finalImg.src = `data:image/png;base64,${image}`;
      console.log('Génération terminée:', usage);
    },
    
    onError: (error) => {
      console.error('Erreur génération:', error);
    }
  }
);
```

### Édition d'Images en Streaming

```javascript
// Éditer une image existante avec streaming
const imageFile = document.getElementById('image-input').files[0];

await imageStreamingAPI.editStream(
  imageFile,
  "Ajouter un arrière-plan de bureau moderne",
  {
    size: '1024x1024',
    quality: 'high'
  },
  {
    onPartialImage: ({ image, index }) => {
      // Prévisualisation progressive de l'édition
      updatePreview(image, index);
    },
    
    onComplete: ({ image, usage }) => {
      // Édition terminée
      displayFinalEdit(image);
      console.log('Tokens utilisés:', usage.total_tokens);
    }
  }
);
```

## Exemple Complet - Générateur d'Images Email

```javascript
// Composant React pour génération d'images progressives
import { useState, useRef } from 'react';
import { imageStreamingAPI } from '../services/api';

function EmailImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [partialImages, setPartialImages] = useState([]);
  const [finalImage, setFinalImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);

  const generateImage = async () => {
    setIsGenerating(true);
    setPartialImages([]);
    setFinalImage(null);
    setProgress(0);

    try {
      await imageStreamingAPI.generateStream(
        prompt,
        {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'high',
          background: 'white'
        },
        {
          onPartialImage: ({ image, index }) => {
            // Ajouter l'image partielle
            setPartialImages(prev => [...prev, image]);
            setProgress(((index + 1) / 4) * 100); // Estimation 4 étapes
            
            // Afficher immédiatement
            displayImageOnCanvas(image);
          },
          
          onComplete: ({ image, usage, partialImages }) => {
            setFinalImage(image);
            setProgress(100);
            setIsGenerating(false);
            
            // Afficher l'image finale
            displayImageOnCanvas(image);
            
            console.log('Génération terminée:', {
              totalTokens: usage.total_tokens,
              partialCount: partialImages.length
            });
          },
          
          onError: (error) => {
            console.error('Erreur:', error);
            setIsGenerating(false);
          }
        }
      );
    } catch (error) {
      console.error('Erreur génération:', error);
      setIsGenerating(false);
    }
  };

  const displayImageOnCanvas = (base64Image) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  };

  const downloadImage = () => {
    if (finalImage) {
      const link = document.createElement('a');
      link.download = 'generated-image.png';
      link.href = `data:image/png;base64,${finalImage}`;
      link.click();
    }
  };

  return (
    <div className="image-generator">
      <h3>🖼️ Générateur d'Images Email</h3>
      
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Décrivez l'image pour votre email..."
          rows={3}
        />
        
        <button 
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? `Génération... ${progress.toFixed(0)}%` : 'Générer Image'}
        </button>
      </div>
      
      {isGenerating && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>Images partielles: {partialImages.length}</p>
        </div>
      )}
      
      <div className="image-section">
        <canvas 
          ref={canvasRef}
          style={{ 
            maxWidth: '100%', 
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        />
        
        {finalImage && (
          <div className="actions">
            <button onClick={downloadImage}>
              📥 Télécharger
            </button>
            <button onClick={() => copyToClipboard(finalImage)}>
              📋 Copier Base64
            </button>
          </div>
        )}
      </div>
      
      {partialImages.length > 0 && (
        <div className="partial-images">
          <h4>Progression:</h4>
          <div className="thumbnails">
            {partialImages.map((img, index) => (
              <img
                key={index}
                src={`data:image/png;base64,${img}`}
                alt={`Étape ${index + 1}`}
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  objectFit: 'cover',
                  margin: '5px',
                  border: '2px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Édition Progressive d'Images

```javascript
// Éditeur d'images avec streaming
function ImageEditor() {
  const [originalImage, setOriginalImage] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editSteps, setEditSteps] = useState([]);

  const editImage = async () => {
    if (!originalImage || !editPrompt) return;
    
    setIsEditing(true);
    setEditSteps([]);

    try {
      await imageStreamingAPI.editStream(
        originalImage,
        editPrompt,
        {
          size: '1024x1024',
          quality: 'high'
        },
        {
          onPartialImage: ({ image, index }) => {
            setEditSteps(prev => [...prev, {
              index,
              image,
              timestamp: Date.now()
            }]);
          },
          
          onComplete: ({ image, usage }) => {
            setEditSteps(prev => [...prev, {
              index: 'final',
              image,
              timestamp: Date.now(),
              usage
            }]);
            setIsEditing(false);
          }
        }
      );
    } catch (error) {
      console.error('Erreur édition:', error);
      setIsEditing(false);
    }
  };

  return (
    <div className="image-editor">
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOriginalImage(e.target.files[0])}
        />
      </div>
      
      <div className="edit-section">
        <input
          type="text"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Décrivez les modifications..."
        />
        
        <button 
          onClick={editImage}
          disabled={isEditing || !originalImage || !editPrompt}
        >
          {isEditing ? 'Édition...' : 'Éditer Image'}
        </button>
      </div>
      
      <div className="edit-progress">
        {editSteps.map((step, index) => (
          <div key={index} className="edit-step">
            <img 
              src={`data:image/png;base64,${step.image}`}
              alt={`Étape ${step.index}`}
              style={{ width: '200px', height: '200px', objectFit: 'cover' }}
            />
            <p>Étape {step.index === 'final' ? 'Finale' : step.index + 1}</p>
            {step.usage && (
              <small>Tokens: {step.usage.total_tokens}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Intégration Email Marketing

```javascript
// Générer des images pour campagnes email
const generateEmailImages = async (campaignData) => {
  const images = [];
  
  // Image principale
  const heroImage = await imageStreamingAPI.generateStream(
    `Professional marketing image for: ${campaignData.subject}`,
    { size: '1200x600', quality: 'high' },
    {
      onPartialImage: ({ image }) => {
        // Prévisualisation en temps réel
        updateEmailPreview('hero', image);
      },
      onComplete: ({ image }) => {
        images.push({ type: 'hero', image });
      }
    }
  );
  
  // Images produits
  for (const product of campaignData.products) {
    await imageStreamingAPI.generateStream(
      `Product showcase: ${product.name} - ${product.description}`,
      { size: '400x400', quality: 'high' },
      {
        onComplete: ({ image }) => {
          images.push({ 
            type: 'product', 
            productId: product.id, 
            image 
          });
        }
      }
    );
  }
  
  return images;
};
```

## Événements Personnalisés

```javascript
// Écouter les événements de génération d'images
window.addEventListener('image-generation-progress', (event) => {
  const { partialImage, index, totalSteps } = event.detail;
  
  // Mettre à jour la barre de progression
  const progress = ((index + 1) / totalSteps) * 100;
  updateProgressBar(progress);
  
  // Afficher l'image partielle
  displayPartialImage(partialImage);
});

window.addEventListener('image-generation-complete', (event) => {
  const { finalImage, usage, duration } = event.detail;
  
  console.log('Image générée:', {
    tokens: usage.total_tokens,
    duration: `${duration}ms`
  });
  
  // Afficher l'image finale
  displayFinalImage(finalImage);
});
```

## Optimisations

```javascript
// Cache des images partielles
const imageCache = new Map();

const getCachedPartialImages = (prompt) => {
  return imageCache.get(prompt) || [];
};

const cachePartialImage = (prompt, image, index) => {
  const cached = imageCache.get(prompt) || [];
  cached[index] = image;
  imageCache.set(prompt, cached);
};

// Compression des images pour email
const compressImageForEmail = (base64Image, quality = 0.8) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.split(',')[1]); // Retourner seulement le base64
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  });
};
```

## Formats et Qualités

### Tailles Recommandées
- **Email Header**: 1200x600
- **Produit**: 400x400 ou 600x600
- **Logo**: 512x512
- **Bannière**: 1200x300

### Qualités
- `standard` - Rapide, économique
- `high` - Meilleure qualité, plus cher

### Formats de Sortie
- `png` - Transparence, logos
- `jpeg` - Photos, plus compact
- `webp` - Moderne, très compact

---

**Version** : 2.2  
**Statut** : ✅ Production Ready avec Streaming