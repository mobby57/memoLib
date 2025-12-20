# 🎨 OpenAI Images API Integration - IAPosteManager

## 📋 Overview

IAPosteManager now includes comprehensive OpenAI Images API integration with advanced image generation, editing, and variation capabilities using the latest GPT image models.

## 🔧 Features

### 1. Image Generation
- **Models**: `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`, `dall-e-3`, `dall-e-2`
- **Sizes**: Auto, 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait)
- **Quality**: Auto, high, medium, low (GPT models), hd/standard (DALL-E 3)
- **Formats**: PNG, JPEG, WebP with compression control
- **Background**: Transparent, opaque, auto

### 2. Image Editing
- **Multi-image editing**: Up to 16 images with GPT models
- **Mask support**: Precise editing with transparency masks
- **Input fidelity**: Control style matching (high/low)
- **Background control**: Transparent/opaque backgrounds

### 3. Image Variations
- **DALL-E 2 variations**: Create multiple versions of existing images
- **Batch processing**: Generate multiple variations at once

### 4. Streaming Generation
- **Partial images**: Preview generation progress
- **Real-time updates**: See images as they're created

## 🚀 Usage Examples

### Basic Image Generation

```javascript
import { imageHelpers } from './services/images.js';

// Generate professional image for email
const result = await imageHelpers.generateForEmail(
  'Modern office workspace with laptop and coffee',
  'professional'
);

console.log('Image URL:', result.imageUrl);
console.log('Usage:', result.usage);
```

### Advanced Image Generation

```javascript
import { openaiImageService } from './services/images.js';

// Generate with custom options
const response = await openaiImageService.generate(
  'A futuristic email interface with holographic elements',
  {
    model: 'gpt-image-1.5',
    size: '1536x1024',
    quality: 'high',
    style: 'vivid',
    background: 'transparent',
    output_format: 'png',
    n: 2
  }
);

response.data.forEach((image, index) => {
  const imageUrl = `data:image/png;base64,${image.b64_json}`;
  console.log(`Image ${index + 1}:`, imageUrl);
});
```

### Logo Generation

```javascript
// Create company logo
const logo = await imageHelpers.generateLogo(
  'IAPosteManager',
  'Email automation platform with AI integration'
);

// Download logo
imageHelpers.downloadImage(logo.logoUrl, 'iapostemanager-logo.png');
```

### Image Editing

```javascript
// Edit existing image
const editedImage = await imageHelpers.editImage(
  imageFile,
  'Add a professional email signature at the bottom',
  maskFile // Optional mask for precise editing
);

console.log('Edited image:', editedImage.editedImageUrl);
```

### Image Variations

```javascript
// Create variations of an image
const variations = await imageHelpers.createVariations(imageFile, 3);

variations.forEach((variation, index) => {
  console.log(`Variation ${index + 1}:`, variation.imageUrl);
});
```

### Multi-Image Editing

```javascript
// Edit multiple images together (GPT models only)
const images = [logoFile, backgroundFile, textFile];
const editPrompt = 'Combine these elements into a professional email header';

const result = await openaiImageService.edit(images, editPrompt, {
  model: 'gpt-image-1',
  input_fidelity: 'high',
  background: 'transparent',
  quality: 'high'
});
```

## 🎯 Integration with IAPosteManager

### Email Signature Generator

```javascript
async function generateEmailSignature(userInfo) {
  const { name, title, company, email, phone } = userInfo;
  
  const prompt = `Create a professional email signature design for:
Name: ${name}
Title: ${title}
Company: ${company}
Email: ${email}
Phone: ${phone}

Modern, clean layout with company branding elements.`;

  const signature = await imageHelpers.generateForEmail(prompt, 'professional');
  
  return {
    signatureImage: signature.imageUrl,
    htmlSignature: `<img src="${signature.imageUrl}" alt="Email Signature" style="max-width: 400px;">`
  };
}
```

### Newsletter Header Generator

```javascript
async function generateNewsletterHeader(topic, brandColors = []) {
  const colorText = brandColors.length ? `using brand colors: ${brandColors.join(', ')}` : '';
  
  const prompt = `Create a professional newsletter header for topic: "${topic}". 
${colorText}. Modern design, suitable for email marketing.`;

  const header = await openaiImageService.generate(prompt, {
    model: 'gpt-image-1.5',
    size: '1536x1024',
    quality: 'high',
    style: 'natural',
    background: 'opaque',
    output_format: 'jpeg',
    output_compression: 85
  });

  return {
    headerData: header.data[0].b64_json,
    headerUrl: `data:image/jpeg;base64,${header.data[0].b64_json}`,
    usage: header.usage
  };
}
```

### Product Showcase Generator

```javascript
async function generateProductShowcase(productName, description, features = []) {
  const featuresText = features.length ? `Key features: ${features.join(', ')}` : '';
  
  const prompt = `Create a professional product showcase image for "${productName}".
Description: ${description}
${featuresText}
Clean, modern design suitable for email marketing.`;

  const showcase = await imageHelpers.generateForEmail(prompt, 'professional');
  
  // Create variations for A/B testing
  const variations = await imageHelpers.createVariations(
    imageHelpers.base64ToBlob(showcase.imageData),
    2
  );

  return {
    mainImage: showcase,
    variations,
    allImages: [showcase, ...variations]
  };
}
```

### Interactive Image Editor

```javascript
class EmailImageEditor {
  constructor() {
    this.currentImage = null;
    this.editHistory = [];
  }

  async loadImage(imageFile) {
    this.currentImage = imageFile;
    return URL.createObjectURL(imageFile);
  }

  async addText(text, position = 'bottom') {
    const editPrompt = `Add the text "${text}" to the ${position} of the image. Professional font, readable style.`;
    
    const result = await imageHelpers.editImage(this.currentImage, editPrompt);
    
    this.editHistory.push({
      action: 'add_text',
      text,
      position,
      result
    });

    this.currentImage = imageHelpers.base64ToBlob(result.editedImageData);
    return result.editedImageUrl;
  }

  async changeBranding(brandColors, logoDescription) {
    const editPrompt = `Update the branding with colors ${brandColors.join(', ')} and add a ${logoDescription} logo.`;
    
    const result = await imageHelpers.editImage(this.currentImage, editPrompt);
    
    this.editHistory.push({
      action: 'change_branding',
      brandColors,
      logoDescription,
      result
    });

    return result.editedImageUrl;
  }

  async undo() {
    if (this.editHistory.length > 0) {
      this.editHistory.pop();
      // Regenerate from history or reload original
      return this.regenerateFromHistory();
    }
  }

  async regenerateFromHistory() {
    // Implement history replay logic
    console.log('Regenerating from history:', this.editHistory);
  }
}
```

### Batch Image Processing

```javascript
async function processBatchImages(imageRequests) {
  const results = [];
  
  for (const request of imageRequests) {
    try {
      let result;
      
      switch (request.type) {
        case 'generate':
          result = await imageHelpers.generateForEmail(request.prompt, request.style);
          break;
        case 'edit':
          result = await imageHelpers.editImage(request.image, request.prompt);
          break;
        case 'logo':
          result = await imageHelpers.generateLogo(request.company, request.description);
          break;
        case 'variations':
          result = await imageHelpers.createVariations(request.image, request.count);
          break;
      }
      
      results.push({
        id: request.id,
        success: true,
        result
      });
      
    } catch (error) {
      results.push({
        id: request.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

## 🔧 Backend Integration

Add these endpoints to your Flask backend:

```python
@app.route('/api/images/generate', methods=['POST'])
def generate_image():
    data = request.get_json()
    prompt = data.get('prompt', '')
    options = data.get('options', {})
    
    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400
    
    try:
        response = openai.images.generate(
            model=options.get('model', 'gpt-image-1.5'),
            prompt=prompt,
            size=options.get('size', '1024x1024'),
            quality=options.get('quality', 'high'),
            n=options.get('n', 1)
        )
        
        return jsonify({
            'success': True,
            'images': [{'b64_json': img.b64_json} for img in response.data],
            'usage': response.usage
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/images/edit', methods=['POST'])
def edit_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Image file required'}), 400
    
    image_file = request.files['image']
    prompt = request.form.get('prompt', '')
    
    if not prompt:
        return jsonify({'error': 'Edit prompt required'}), 400
    
    try:
        response = openai.images.edit(
            image=image_file,
            prompt=prompt,
            model='gpt-image-1',
            n=1
        )
        
        return jsonify({
            'success': True,
            'edited_image': response.data[0].b64_json,
            'usage': response.usage
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

## 📊 Cost Optimization

### Usage Tracking

```javascript
const imageUsageTracker = {
  generation: { requests: 0, cost: 0 },
  editing: { requests: 0, cost: 0 },
  variations: { requests: 0, cost: 0 },
  
  trackGeneration: (model, size, quality) => {
    imageUsageTracker.generation.requests++;
    // Cost calculation based on model and quality
    const cost = calculateImageCost(model, size, quality);
    imageUsageTracker.generation.cost += cost;
  },
  
  getStats: () => imageUsageTracker
};

function calculateImageCost(model, size, quality) {
  // GPT image models: $0.040-0.080 per image
  // DALL-E 3: $0.040-0.120 per image
  // DALL-E 2: $0.016-0.020 per image
  const baseCosts = {
    'gpt-image-1.5': 0.080,
    'gpt-image-1': 0.060,
    'gpt-image-1-mini': 0.040,
    'dall-e-3': 0.080,
    'dall-e-2': 0.020
  };
  
  return baseCosts[model] || 0.040;
}
```

### Caching Strategy

```javascript
const imageCache = new Map();

async function cachedImageGeneration(prompt, options = {}) {
  const cacheKey = `img_${JSON.stringify({ prompt, ...options })}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }
  
  const result = await openaiImageService.generate(prompt, options);
  imageCache.set(cacheKey, result);
  
  return result;
}
```

## 🛡️ Security & Best Practices

1. **Content Moderation**: Use moderation API for user prompts
2. **File Size Limits**: Max 50MB for GPT models, 4MB for DALL-E
3. **Rate Limiting**: Implement proper request throttling
4. **Image Storage**: Secure storage for generated images
5. **Copyright**: Respect intellectual property in prompts

## 🎉 Ready for Production!

Your IAPosteManager now has enterprise-grade image generation capabilities with OpenAI's latest models!