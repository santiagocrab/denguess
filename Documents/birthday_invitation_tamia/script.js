// ============================================
// PREMIUM ROMANTIC INVITATION - INTERACTIVE SCRIPT
// For Ada Tamia Misplacido
// ============================================

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initScrollProgress();
        initRevealAnimations();
        initModal();
        initSmoothScroll();
        initParallax();
        initGalleryHover();
        initHeroAnimations();
        initVideoPlayer();
    }

    // ============================================
    // SCROLL PROGRESS INDICATOR
    // ============================================
    function initScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        if (!progressBar) return;

        function updateProgress() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
            progressBar.style.width = Math.min(scrollPercent, 100) + '%';
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ============================================
    // REVEAL ANIMATIONS (Intersection Observer)
    // ============================================
    function initRevealAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Unobserve after animation
                    // observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all elements with reveal classes
        const elementsToObserve = document.querySelectorAll(
            '.letter-card, .section-header, .gallery-item, .statement-item, ' +
            '.invitation-header, .invitation-content, .made-with-love, .birthday-reminder, .location-card'
        );

        elementsToObserve.forEach(element => {
            observer.observe(element);
        });
    }

    // ============================================
    // HERO ANIMATIONS
    // ============================================
    function initHeroAnimations() {
        const revealElements = document.querySelectorAll('.reveal-text');
        
        revealElements.forEach((element, index) => {
            // Set initial state
            if (element.classList.contains('hero-divider')) {
                element.style.transform = 'scaleX(0)';
            } else {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
            }
        });
    }

    // ============================================
    // MODAL FUNCTIONALITY
    // ============================================
    function initModal() {
        const modal = document.getElementById('modal');
        const button = document.getElementById('invitationButton');
        const closeBtn = document.getElementById('modalClose');

        if (!modal || !button) return;

        // Open modal
        button.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            createConfetti();
        });

        // Close modal
        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeModal);
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    }

    // ============================================
    // SMOOTH SCROLL
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================
    // PARALLAX EFFECTS
    // ============================================
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.hero-background, .elegant-bg');
        
        let ticking = false;

        function updateParallax() {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.2 + (index * 0.1);
                const yPos = scrolled * speed;
                element.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    // ============================================
    // GALLERY HOVER EFFECTS
    // ============================================
    function initGalleryHover() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            const imageWrapper = item.querySelector('.gallery-image-wrapper');
            
            if (imageWrapper) {
                item.addEventListener('mouseenter', () => {
                    imageWrapper.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                });
            }
        });
    }

    // ============================================
    // CONFETTI EFFECT
    // ============================================
    function createConfetti() {
        const colors = ['#ec4899', '#f472b6', '#fbcfe8', '#d4af37', '#f5e6d3'];
        const confettiCount = 50;
        const modal = document.getElementById('modal');
        
        if (!modal) return;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.width = Math.random() * 8 + 4 + 'px';
                confetti.style.height = confetti.style.width;
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.opacity = '0';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '2002';
                
                modal.appendChild(confetti);
                
                const animation = confetti.animate([
                    {
                        opacity: 0,
                        transform: 'translateY(0) rotate(0deg)',
                    },
                    {
                        opacity: 1,
                        offset: 0.1,
                    },
                    {
                        opacity: 1,
                        offset: 0.9,
                    },
                    {
                        opacity: 0,
                        transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
                    }
                ], {
                    duration: 2000 + Math.random() * 1000,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                });
                
                animation.onfinish = () => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                };
            }, i * 30);
        }
    }

    // ============================================
    // PERFORMANCE OPTIMIZATION
    // ============================================
    
    // Throttle scroll events
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // CONSOLE MESSAGE
    // ============================================
    console.log('%c💗 For Ada Tamia Misplacido 💗', 
        'color: #ec4899; font-size: 18px; font-weight: bold; font-family: serif;');
    console.log('%cMade with love and care', 
        'color: #f472b6; font-size: 12px; font-style: italic;');

    // ============================================
    // ADDITIONAL ENHANCEMENTS
    // ============================================
    
    // Add subtle cursor effect on interactive elements
    const interactiveElements = document.querySelectorAll('button, .gallery-item, .letter-card');
    interactiveElements.forEach(element => {
        element.style.cursor = 'pointer';
    });

    // Preload images for smoother experience
    function preloadImages() {
        const images = ['ada-photo-1.jpg', 'ada-photo-2.jpg', 'ada-photo-3.jpg'];
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // Preload after page load
    window.addEventListener('load', preloadImages);

    // Simple flowers don't need special initialization - CSS handles it

    // ============================================
    // VIDEO PLAYER FUNCTIONALITY
    // ============================================
    function initVideoPlayer() {
        const video = document.querySelector('.gallery-video-element');

        if (!video) return;

        // Ensure video autoplays and loops
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(err => {
                console.log('Video autoplay prevented:', err);
                // Some browsers may prevent autoplay, try again on user interaction
                document.addEventListener('click', () => {
                    video.play().catch(() => {});
                }, { once: true });
            });
        });

        // Ensure video loops
        video.loop = true;

        // Handle video errors
        video.addEventListener('error', () => {
            console.log('Video failed to load');
        });
    }

})();
