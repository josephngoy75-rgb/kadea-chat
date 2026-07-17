const darkModeBtn = document.getElementById('darkModeBtn');

if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
}
