// Retour visuel commun pour les boutons qui n'ont pas déjà un chargement asynchrone.
(function () {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button || button.disabled || button.dataset.loaderIgnore === 'true') return;

        // Attend la fin des autres gestionnaires de clic : un bouton qui démarre
        // une requête conserve alors son indicateur spécifique, plus durable.
        setTimeout(() => {
            if (button.disabled || button.dataset.loading === 'true') return;

            const originalHtml = button.innerHTML;
            const width = button.getBoundingClientRect().width;
            button.dataset.loading = 'true';
            button.setAttribute('aria-busy', 'true');
            button.style.minWidth = `${Math.ceil(width)}px`;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';

            setTimeout(() => {
                if (button.dataset.loading !== 'true') return;
                button.innerHTML = originalHtml;
                button.removeAttribute('aria-busy');
                button.style.minWidth = '';
                delete button.dataset.loading;
            }, 450);
        }, 0);
    });
})();