export function initLightbox() {
    // Create lightbox elements
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-image';
    overlay.appendChild(lightboxImg);
    document.body.appendChild(overlay);
  
    // Add click event to lightbox images
    document.addEventListener('click', function(event) {
      if (event.target.closest('.lightbox-image')) {
        const imgSrc = event.target.closest('.lightbox-image').href;
        lightboxImg.src = imgSrc;
        overlay.style.display = 'flex';
        event.preventDefault();
      }
    });
  
    // Close lightbox when clicking outside the image
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }