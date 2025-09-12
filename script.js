// Frontend JavaScript for interactivity
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded successfully! Welcome to David\'s first online page.');
    
    // Initialize Bootstrap tooltips and popovers if needed
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Function to show welcome message
function showWelcomeMessage() {
    const messageArea = document.getElementById('message-area');
    const dynamicMessage = document.getElementById('dynamic-message');
    
    const messages = [
        '¡Bienvenido a mi primera página web!',
        '¡Gracias por visitar mi sitio!',
        '¡Espero que disfrutes tu visita!',
        '¡Esta página fue creada con mucho código y café!',
        '¡Hola! ¿Qué tal tu día?'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    dynamicMessage.textContent = randomMessage;
    
    messageArea.classList.remove('d-none');
    messageArea.classList.add('show-animation');
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageArea.classList.add('d-none');
        messageArea.classList.remove('show-animation');
    }, 5000);
}

// Smooth scroll enhancement for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);
        
        // Report Core Web Vitals if available
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        console.log(`${entry.name}: ${entry.value}ms`);
                    }
                });
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (e) {
                console.log('Core Web Vitals monitoring not fully supported');
            }
        }
    }
});