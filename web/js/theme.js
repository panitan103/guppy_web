(function () {
  const storageKey = 'guppy.theme';

  function storedTheme() {
    return window.localStorage.getItem(storageKey) || 'dark';
  }

  function setTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    updateButton(nextTheme);
  }

  function updateButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) {
      return;
    }

    button.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  function bindButton() {
    const button = document.getElementById('theme-toggle');
    if (!button) {
      return;
    }

    button.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-bs-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  setTheme(storedTheme());
  window.addEventListener('DOMContentLoaded', () => {
    updateButton(storedTheme());
    bindButton();
  });
}());
