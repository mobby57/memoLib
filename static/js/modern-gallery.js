/**
 * Interface moderne pour galerie d'images
 * Fonctionnalités: vue grille/liste, recherche, filtres, modal, actions
 */

class ModernGallery {
    constructor(options = {}) {
        this.container = options.container || '.image-gallery';
        this.listContainer = options.listContainer || '.image-list-view';
        this.searchInput = options.searchInput || '#searchInput';
        this.categoryFilter = options.categoryFilter || '#categoryFilter';
        this.viewButtons = options.viewButtons || '.view-btn';
        this.modal = options.modal || '#imageModal';
        
        this.currentView = 'grid';
        this.images = [];
        this.filteredImages = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadImages();
    }

    bindEvents() {
        // Changement de vue
        document.querySelectorAll(this.viewButtons).forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e));
        });

        // Recherche
        const searchInput = document.querySelector(this.searchInput);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }

        // Filtre catégorie
        const categoryFilter = document.querySelector(this.categoryFilter);
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        }

        // Modal
        this.initModal();

        // Actions sur images
        this.bindImageActions();
    }

    changeView(e) {
        const btn = e.target.closest('.view-btn');
        const view = btn.dataset.view;
        
        // Update active button
        document.querySelectorAll(this.viewButtons).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Switch view
        const gallery = document.querySelector(this.container);
        const listView = document.querySelector(this.listContainer);
        
        if (view === 'grid') {
            gallery.style.display = 'grid';
            listView.style.display = 'none';
        } else {
            gallery.style.display = 'none';
            listView.style.display = 'flex';
        }
        
        this.currentView = view;
    }

    search(query) {
        const searchTerm = query.toLowerCase().trim();
        
        document.querySelectorAll('.image-card').forEach(card => {
            const title = card.querySelector('.image-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.image-description')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
            
            const matches = title.includes(searchTerm) || 
                          description.includes(searchTerm) || 
                          tags.some(tag => tag.includes(searchTerm));
            
            card.style.display = matches ? 'block' : 'none';
        });

        // Update list view too
        document.querySelectorAll('.image-list-item').forEach(item => {
            const title = item.querySelector('.image-list-title')?.textContent.toLowerCase() || '';
            const matches = title.includes(searchTerm);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    filterByCategory(category) {
        if (!category) {
            // Show all
            document.querySelectorAll('.image-card, .image-list-item').forEach(item => {
                item.style.display = this.currentView === 'grid' ? 'block' : 'flex';
            });
            return;
        }

        document.querySelectorAll('.image-card').forEach(card => {
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
            const matches = tags.some(tag => tag.includes(category.toLowerCase()));
            card.style.display = matches ? 'block' : 'none';
        });

        document.querySelectorAll('.image-list-item').forEach(item => {
            const meta = item.querySelector('.image-list-meta')?.textContent.toLowerCase() || '';
            const matches = meta.includes(category.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    initModal() {
        const modal = document.querySelector(this.modal);
        const modalImage = modal?.querySelector('.modal-image');
        const modalClose = modal?.querySelector('.modal-close');

        if (!modal) return;

        // Open modal on view button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn.primary')) {
                e.stopPropagation();
                const img = e.target.closest('.image-card, .image-list-item').querySelector('img');
                if (img && modalImage) {
                    modalImage.src = img.src;
                    modalImage.alt = img.alt;
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });

        // Close modal
        modalClose?.addEventListener('click', () => this.closeModal());
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.querySelector(this.modal);
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    bindImageActions() {
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (!actionBtn) return;

            e.stopPropagation();
            
            if (actionBtn.classList.contains('success')) {
                this.downloadImage(actionBtn);
            } else if (actionBtn.classList.contains('warning')) {
                this.shareImage(actionBtn);
            }
        });
    }

    downloadImage(btn) {
        const img = btn.closest('.image-card, .image-list-item').querySelector('img');
        if (!img) return;

        const link = document.createElement('a');
        link.href = img.src;
        link.download = img.alt || 'image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Image téléchargée', 'success');
    }

    async shareImage(btn) {
        const img = btn.closest('.image-card, .image-list-item').querySelector('img');
        const title = btn.closest('.image-card, .image-list-item').querySelector('.image-title, .image-list-title');
        
        if (!img) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title?.textContent || 'Image partagée',
                    url: img.src
                });
                this.showToast('Image partagée', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.copyToClipboard(img.src);
                }
            }
        } else {
            this.copyToClipboard(img.src);
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Lien copié dans le presse-papiers', 'info');
        } catch (err) {
            this.showToast('Impossible de copier le lien', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#2563eb'
        };

        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    loadImages() {
        // Simulate loading images from API
        this.images = Array.from(document.querySelectorAll('.image-card')).map((card, index) => ({
            id: index + 1,
            title: card.querySelector('.image-title')?.textContent || '',
            description: card.querySelector('.image-description')?.textContent || '',
            src: card.querySelector('img')?.src || '',
            tags: Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent),
            views: Math.floor(Math.random() * 5000) + 100,
            likes: Math.floor(Math.random() * 500) + 10
        }));
        
        this.filteredImages = [...this.images];
    }

    addImage(imageData) {
        const imageCard = this.createImageCard(imageData);
        const gallery = document.querySelector(this.container);
        gallery.appendChild(imageCard);
        
        this.images.push(imageData);
        this.filteredImages.push(imageData);
    }

    createImageCard(data) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${data.src}" alt="${data.title}">
                ${data.status ? `<div class="status-badge status-${data.status}">${data.status}</div>` : ''}
                <div class="image-overlay">
                    <div class="image-actions">
                        <button class="action-btn primary" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn success" title="Télécharger">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn warning" title="Partager">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="image-meta">
                <h3 class="image-title">${data.title}</h3>
                <p class="image-description">${data.description}</p>
                <div class="image-tags">
                    ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="image-stats">
                    <span><i class="fas fa-eye"></i> ${data.views} vues</span>
                    <span><i class="fas fa-heart"></i> ${data.likes} likes</span>
                </div>
            </div>
        `;
        
        return card;
    }

    removeImage(imageId) {
        const card = document.querySelector(`[data-image-id="${imageId}"]`);
        if (card) {
            card.remove();
            this.images = this.images.filter(img => img.id !== imageId);
            this.filteredImages = this.filteredImages.filter(img => img.id !== imageId);
        }
    }

    updateImageStats(imageId, stats) {
        const card = document.querySelector(`[data-image-id="${imageId}"]`);
        if (card) {
            const statsElement = card.querySelector('.image-stats');
            if (statsElement) {
                statsElement.innerHTML = `
                    <span><i class="fas fa-eye"></i> ${stats.views} vues</span>
                    <span><i class="fas fa-heart"></i> ${stats.likes} likes</span>
                `;
            }
        }
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modernGallery = new ModernGallery();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernGallery;
}