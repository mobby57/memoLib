// ==UserScript==
// @name         MemoLib - OCR Helper
// @version      1.0.0
// @description  Extraction texte PDF avec Tesseract.js
// @match        http://localhost:5078/*
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    const dropZone = document.createElement('div');
    dropZone.innerHTML = '📄 Glisser PDF ici pour OCR';
    dropZone.style.cssText = 'position:fixed;bottom:140px;right:20px;width:200px;padding:20px;background:#ea4335;color:white;border:2px dashed white;border-radius:8px;text-align:center;cursor:pointer;z-index:9999';
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.style.background = '#c5221f';
    };
    
    dropZone.ondragleave = () => {
        dropZone.style.background = '#ea4335';
    };
    
    dropZone.ondrop = async (e) => {
        e.preventDefault();
        dropZone.style.background = '#ea4335';
        
        const file = e.dataTransfer.files[0];
        if (!file || file.type !== 'application/pdf') {
            return alert('❌ Fichier PDF uniquement');
        }
        
        dropZone.innerHTML = '⏳ Extraction...';
        
        try {
            const { data: { text } } = await Tesseract.recognize(file, 'fra');
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;padding:20px;z-index:10000;border:2px solid #ea4335;border-radius:8px';
            document.body.appendChild(textarea);
            
            dropZone.innerHTML = '✅ Texte extrait';
            setTimeout(() => dropZone.innerHTML = '📄 Glisser PDF ici pour OCR', 2000);
        } catch (e) {
            alert('❌ Erreur OCR: ' + e.message);
            dropZone.innerHTML = '📄 Glisser PDF ici pour OCR';
        }
    };
    
    document.body.appendChild(dropZone);
})();
