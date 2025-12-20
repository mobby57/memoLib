// 🎨 OpenAI Images API Service - IAPosteManager
// Comprehensive image generation, editing, and variations

const OPENAI_API_BASE = 'https://api.openai.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Image-specific request handler
const imageRequest = async (endpoint, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI manquante');
  }
  
  const url = `${OPENAI_API_BASE}${endpoint}`;
  const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const fetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'X-Client-Request-Id': requestId,
      ...options.headers
    }
  };
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Images API Error: ${errorData.error?.message || response.statusText}`);
  }
  
  return response.json();
};

// Service Images OpenAI complet
export const openaiImageService = {
  // Génération d'images
  generate: async (prompt, options = {}) => {
    const {
      model = 'gpt-image-1.5',
      n = 1,
      size = 'auto',
      quality = 'auto',
      style = 'vivid',
      background = 'auto',
      output_format = 'png',
      output_compression = 100,
      moderation = 'auto',
      stream = false,
      partial_images = 0
    } = options;
    
    return imageRequest('/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
        quality,
        style,
        background,
        output_format,
        output_compression,
        moderation,
        stream,
        partial_images
      })
    });
  },
  
  // Édition d'images
  edit: async (images, prompt, options = {}) => {
    const {
      model = 'gpt-image-1',
      mask = null,
      background = 'auto',
      input_fidelity = 'low',
      n = 1,
      size = 'auto',
      quality = 'auto',
      output_format = 'png'
    } = options;
    
    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', prompt);
    
    if (Array.isArray(images)) {
      images.forEach(image => formData.append('image[]', image));
    } else {
      formData.append('image', images);
    }
    
    if (mask) formData.append('mask', mask);
    formData.append('background', background);
    formData.append('input_fidelity', input_fidelity);
    formData.append('n', n.toString());
    formData.append('size', size);
    formData.append('quality', quality);
    formData.append('output_format', output_format);
    
    return imageRequest('/images/edits', {
      method: 'POST',
      body: formData
    });
  },
  
  // Variations d'images (DALL-E 2)
  createVariation: async (image, options = {}) => {
    const {
      model = 'dall-e-2',
      n = 1,
      size = '1024x1024',
      response_format = 'b64_json'
    } = options;
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('model', model);
    formData.append('n', n.toString());
    formData.append('size', size);
    formData.append('response_format', response_format);
    
    return imageRequest('/images/variations', {
      method: 'POST',
      body: formData
    });
  }
};

// Helpers pour IAPosteManager
export const imageHelpers = {
  // Générer image pour email
  generateForEmail: async (description, style = 'professional') => {
    const prompt = `Create a ${style} image for email content: ${description}. Clean, modern design suitable for business communication.`;
    
    const response = await openaiImageService.generate(prompt, {
      model: 'gpt-image-1.5',
      size: '1024x1024',
      quality: 'high',
      style: style === 'professional' ? 'natural' : 'vivid',
      background: 'transparent',
      output_format: 'png'
    });
    
    return {
      imageData: response.data[0].b64_json,
      imageUrl: `data:image/png;base64,${response.data[0].b64_json}`,
      usage: response.usage
    };
  },
  
  // Créer un logo
  generateLogo: async (companyName, description = '') => {
    const prompt = `Create a professional logo for "${companyName}". ${description}. Modern, clean design, transparent background, suitable for business use.`;
    
    const response = await openaiImageService.generate(prompt, {
      model: 'gpt-image-1.5',
      size: '1024x1024',
      quality: 'high',
      style: 'natural',
      background: 'transparent',
      output_format: 'png'
    });
    
    return {
      logoData: response.data[0].b64_json,
      logoUrl: `data:image/png;base64,${response.data[0].b64_json}`,
      usage: response.usage
    };
  },
  
  // Éditer une image
  editImage: async (imageFile, editPrompt, maskFile = null) => {
    const response = await openaiImageService.edit(
      [imageFile],
      editPrompt,
      {
        model: 'gpt-image-1',
        mask: maskFile,
        input_fidelity: 'high',
        quality: 'high',
        output_format: 'png'
      }
    );
    
    return {
      editedImageData: response.data[0].b64_json,
      editedImageUrl: `data:image/png;base64,${response.data[0].b64_json}`,
      usage: response.usage
    };
  },
  
  // Créer des variations
  createVariations: async (imageFile, count = 2) => {
    const response = await openaiImageService.createVariation(imageFile, {
      n: count,
      size: '1024x1024',
      response_format: 'b64_json'
    });
    
    return response.data.map(img => ({
      imageData: img.b64_json,
      imageUrl: `data:image/png;base64,${img.b64_json}`
    }));
  },
  
  // Convertir image en blob
  base64ToBlob: (base64Data, mimeType = 'image/png') => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },
  
  // Télécharger image
  downloadImage: (imageUrl, filename = 'generated-image.png') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default openaiImageService;