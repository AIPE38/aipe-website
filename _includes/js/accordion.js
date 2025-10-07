(function() {

    let accordionCounter = 0;

    function initAccordion(accordion) {
        const buttons = Array.from(accordion.querySelectorAll('.js_accordion-button'));
        if (buttons.length === 0) return;

        accordionCounter++;
        const prefix = `accordion-${accordionCounter}`;
        const singleMode = accordion.dataset.single === "true";

        // Lire l'option data-open-index
        const openIndexAttr = accordion.dataset.openIndex;
        let openIndices = [];
        if (openIndexAttr) {
            openIndices = openIndexAttr.split(',').map(i => parseInt(i.trim())).filter(i => !isNaN(i));
        }

        buttons.forEach((btn, index) => {
            // Générer ID du bouton
            btn.id = btn.id || `${prefix}-btn-${index + 1}`;

            // Trouver le panneau associé : premier div après le bouton
            let panel = btn.parentElement.nextElementSibling;
            if (!panel || panel.tagName.toLowerCase() !== 'div') return;

            // Générer ID du panneau
            panel.id = panel.id || `${prefix}-panel-${index + 1}`;

            // Ajouter les attributs ARIA et hidden
            btn.setAttribute('aria-controls', panel.id);
            btn.setAttribute('aria-expanded', 'false');
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-labelledby', btn.id);
            panel.hidden = true;

            // Click toggle
            btn.addEventListener('click', () => {
                const isExpanded = btn.getAttribute('aria-expanded') === 'true';
                const newState = !isExpanded;

                if (singleMode && newState) {
                    // fermer les autres panneaux
                    buttons.forEach(b => {
                        if (b !== btn) {
                            b.setAttribute('aria-expanded', 'false');
                            const p = b.parentElement.nextElementSibling;
                            if (p) p.hidden = true;
                        }
                    });
                }

                btn.setAttribute('aria-expanded', newState);
                panel.hidden = !newState;
            });

            // Clavier
            btn.addEventListener('keydown', (e) => {
                const idx = buttons.indexOf(btn);
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    buttons[(idx + 1) % buttons.length].focus();
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    buttons[(idx - 1 + buttons.length) % buttons.length].focus();
                } else if (e.key === "Home") {
                    e.preventDefault();
                    buttons[0].focus();
                } else if (e.key === "End") {
                    e.preventDefault();
                    buttons[buttons.length - 1].focus();
                } else if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    btn.click();
                }
            });
        });

        // **Ouvrir les panneaux par défaut après initialisation**
        openIndices.forEach(i => {
            if (buttons[i]) {
                const btn = buttons[i];
                const panel = btn.parentElement.nextElementSibling;
                btn.setAttribute('aria-expanded', 'true');
                if (panel) panel.hidden = false;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const accordions = document.querySelectorAll('.js_accordion');
        accordions.forEach(initAccordion);
    });

})();
