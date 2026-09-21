// Shared Theme System - loaded in <head> to prevent flashing
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
    }
})();

// Global toggle function attached to window
window.toggleTheme = function() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let targetDark = false;
    
    if (isDark || (!document.documentElement.classList.contains('light-mode') && prefersDark)) {
        // Switch to light
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        targetDark = false;
    } else {
        // Switch to dark
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        targetDark = true;
    }
    const btn = document.getElementById('globalThemeToggle');
    if (btn) {
        const isDarkNow = document.documentElement.classList.contains('dark-mode') || 
                          (!document.documentElement.classList.contains('light-mode') && prefersDark);
        
        btn.title = isDarkNow ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        btn.innerHTML = `
            <span class="icon icon-sun">☀️</span>
            <span class="icon icon-moon">🌙</span>
            <div class="toggle-thumb"></div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('globalThemeToggle')) return;
    const isDark = document.documentElement.classList.contains('dark-mode') || 
                   (!document.documentElement.classList.contains('light-mode') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                   
    const btn = document.createElement('button');
    btn.id = 'globalThemeToggle';
    btn.className = 'pill-theme-toggle print-hide';
    btn.onclick = window.toggleTheme;
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    btn.innerHTML = `
        <span class="icon icon-sun">☀️</span>
        <span class="icon icon-moon">🌙</span>
        <div class="toggle-thumb"></div>
    `;
    
    document.body.appendChild(btn);
});
