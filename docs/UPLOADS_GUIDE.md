# 📤 OpenAI Uploads API - Guide d'Intégration

## Vue d'ensemble

L'API Uploads permet de télécharger des fichiers volumineux (jusqu'à 8 GB) en plusieurs parties pour une utilisation avec les assistants, fine-tuning, et autres services OpenAI.

## Caractéristiques

- **Taille maximale**: 8 GB par upload
- **Taille de chunk**: Jusqu'à 64 MB par partie
- **Expiration**: 1 heure par défaut (configurable)
- **Upload parallèle**: Plusieurs parties simultanément
- **Reprise**: Gestion des échecs avec retry

## API Service

### 1. Créer un Upload

```javascript
import { uploadsAPI } from '@/services/api';

const upload = await uploadsAPI.createUpload(
  'training_data.jsonl',  // filename
  2147483648,             // bytes (2GB)
  'text/jsonl',           // mime_type
  'fine-tune',            // purpose
  {                       // expires_after (optional)
    anchor: 'created_at',
    seconds: 3600
  }
);

console.log(upload.id); // upload_abc123
```

### 2. Ajouter des Parties

```javascript
// Diviser le fichier en chunks
const chunkSize = 64 * 1024 * 1024; // 64MB
const chunk = file.slice(0, chunkSize);

const part = await uploadsAPI.addPart(upload.id, chunk);
console.log(part.id); // part_def456
```

### 3. Compléter l'Upload

```javascript
const partIds = ['part_def456', 'part_ghi789'];

const completed = await uploadsAPI.completeUpload(
  upload.id,
  partIds,
  'optional-md5-checksum'
);

console.log(completed.file.id); // file-xyz321
```

### 4. Annuler un Upload

```javascript
await uploadsAPI.cancelUpload(upload.id);
```

## Fonctions Utilitaires

### Upload Automatique avec Progression

```javascript
const file = document.getElementById('fileInput').files[0];

const result = await uploadsAPI.uploadLargeFile(
  file,
  'assistants',           // purpose
  64 * 1024 * 1024,      // chunkSize (64MB)
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
    console.log(`Chunk ${progress.chunk}/${progress.totalChunks}`);
    console.log(`Loaded: ${progress.loaded}/${progress.total} bytes`);
  }
);

console.log('Upload completed:', result.file.id);
```

### Upload Multiple Attachments

```javascript
const files = document.getElementById('attachments').files;

const results = await uploadsAPI.uploadEmailAttachments(
  Array.from(files),
  (progress) => {
    console.log(`File ${progress.fileIndex + 1}: ${progress.fileName}`);
    console.log(`File progress: ${progress.percentage}%`);
    console.log(`Overall: ${progress.overallProgress}%`);
  }
);

results.forEach(result => {
  console.log('Uploaded:', result.file.id);
});
```

## Exemples d'Utilisation

### 1. Upload de Fichier Training pour Fine-Tuning

```javascript
async function uploadTrainingData(file) {
  try {
    const result = await uploadsAPI.uploadLargeFile(
      file,
      'fine-tune',
      64 * 1024 * 1024,
      (progress) => {
        updateProgressBar(progress.percentage);
      }
    );
    
    console.log('Training file uploaded:', result.file.id);
    return result.file.id;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

### 2. Upload avec Gestion d'Erreurs

```javascript
async function uploadWithRetry(file, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const upload = await uploadsAPI.createUpload(
        file.name,
        file.size,
        file.type,
        'assistants'
      );
      
      const partIds = [];
      const chunkSize = 64 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        try {
          const part = await uploadsAPI.addPart(upload.id, chunk);
          partIds.push(part.id);
        } catch (partError) {
          console.error(`Chunk ${i} failed:`, partError);
          await uploadsAPI.cancelUpload(upload.id);
          throw partError;
        }
      }
      
      return await uploadsAPI.completeUpload(upload.id, partIds);
      
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      console.log(`Retry ${attempt}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}
```

### 3. Upload Parallèle de Plusieurs Fichiers

```javascript
async function uploadMultipleFiles(files) {
  const uploadPromises = files.map(file => 
    uploadsAPI.uploadLargeFile(file, 'assistants')
  );
  
  const results = await Promise.allSettled(uploadPromises);
  
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.file.id);
    
  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);
  
  return { successful, failed };
}
```

## Composant React Complet

```jsx
import React, { useState } from 'react';
import { uploadsAPI } from '@/services/api';

function FileUploader() {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    setFiles(Array.from(e.target.files));
    setError(null);
  };

  const handleUpload = async () => {
    setError(null);
    
    try {
      const results = await uploadsAPI.uploadEmailAttachments(
        files,
        (prog) => {
          setProgress(prev => ({
            ...prev,
            [prog.fileName]: prog.percentage
          }));
        }
      );
      
      setUploadedFiles(results.map(r => ({
        id: r.file.id,
        name: r.file.filename,
        size: r.file.bytes
      })));
      
      setFiles([]);
      setProgress({});
    } catch (err) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-uploader">
      <h2>📤 Upload Large Files</h2>
      
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        accept=".jsonl,.txt,.pdf,.docx"
      />
      
      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files ({files.length})</h3>
          {files.map((file, idx) => (
            <div key={idx} className="file-item">
              <span>{file.name}</span>
              <span>{formatBytes(file.size)}</span>
              {progress[file.name] && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress[file.name]}%` }}
                  />
                  <span>{progress[file.name]}%</span>
                </div>
              )}
            </div>
          ))}
          
          <button onClick={handleUpload} disabled={Object.keys(progress).length > 0}>
            Upload All
          </button>
        </div>
      )}
      
      {error && (
        <div className="error">
          ❌ Error: {error}
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="uploaded-list">
          <h3>✅ Uploaded Files</h3>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="uploaded-item">
              <span>{file.name}</span>
              <span>{formatBytes(file.size)}</span>
              <code>{file.id}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUploader;
```

## MIME Types Supportés

### Assistants & Vision
- `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `text/plain`, `text/markdown`, `text/csv`
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Fine-Tuning
- `text/jsonl` (JSON Lines)
- `application/jsonl`

### Batch Processing
- `application/jsonl`

## Bonnes Pratiques

### 1. Taille de Chunk Optimale
```javascript
// Pour connexions rapides
const chunkSize = 64 * 1024 * 1024; // 64MB

// Pour connexions lentes
const chunkSize = 32 * 1024 * 1024; // 32MB

// Pour mobile
const chunkSize = 16 * 1024 * 1024; // 16MB
```

### 2. Validation Avant Upload
```javascript
function validateFile(file) {
  const maxSize = 8 * 1024 * 1024 * 1024; // 8GB
  const allowedTypes = ['text/jsonl', 'application/pdf', 'text/plain'];
  
  if (file.size > maxSize) {
    throw new Error('File too large (max 8GB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }
  
  return true;
}
```

### 3. Calcul MD5 pour Vérification
```javascript
async function calculateMD5(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('MD5', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Utilisation
const md5 = await calculateMD5(file);
await uploadsAPI.completeUpload(uploadId, partIds, md5);
```

### 4. Monitoring et Logging
```javascript
async function uploadWithMonitoring(file) {
  const startTime = Date.now();
  let bytesUploaded = 0;
  
  const result = await uploadsAPI.uploadLargeFile(
    file,
    'assistants',
    64 * 1024 * 1024,
    (progress) => {
      bytesUploaded = progress.loaded;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = bytesUploaded / elapsed;
      const remaining = (file.size - bytesUploaded) / speed;
      
      console.log({
        progress: progress.percentage,
        speed: `${(speed / 1024 / 1024).toFixed(2)} MB/s`,
        remaining: `${remaining.toFixed(0)}s`,
        elapsed: `${elapsed.toFixed(0)}s`
      });
    }
  );
  
  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`Upload completed in ${totalTime.toFixed(2)}s`);
  
  return result;
}
```

## Gestion des Erreurs

```javascript
try {
  const result = await uploadsAPI.uploadLargeFile(file);
} catch (error) {
  if (error.message.includes('expired')) {
    console.error('Upload session expired (>1h)');
  } else if (error.message.includes('429')) {
    console.error('Rate limit exceeded');
  } else if (error.message.includes('413')) {
    console.error('File too large');
  } else {
    console.error('Upload failed:', error);
  }
}
```

## Intégration avec IAPosteManager

### Upload d'Attachments Email
```javascript
async function attachFilesToEmail(emailId, files) {
  const uploadResults = await uploadsAPI.uploadEmailAttachments(files);
  
  const attachments = uploadResults.map(result => ({
    fileId: result.file.id,
    filename: result.file.filename,
    size: result.file.bytes
  }));
  
  // Attacher à l'email
  await emailAPI.addAttachments(emailId, attachments);
  
  return attachments;
}
```

---

**🎉 Uploads API intégré avec succès!**

*Support pour fichiers jusqu'à 8GB avec upload progressif et reprise*
