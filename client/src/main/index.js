const nav = document.getElementById('main-nav'); 
const toggleButton = document.querySelector('.menu-toggle'); 
// ודא ששני האלמנטים נמצאו לפני הוספת מאזין
if (nav && toggleButton) {
    toggleButton.addEventListener('click', () => {
        // 1. הוספת/הסרת הקלאס 'open'
        // זהו הקלאס שמפעיל את ה-CSS (ה-display: flex) ב-Media Query
        nav.classList.toggle('open'); 
        
        // 2. עדכון נגישות (Accessibility - ARIA)
        // חשוב למשתמשים עם קוראי מסך
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', !isExpanded);
    });
}