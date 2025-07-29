document.addEventListener('DOMContentLoaded', () => {
    const buttonContainer = document.querySelector('.js--filtre-buttons');
    const buttons = buttonContainer.querySelectorAll('button');
    const partenaires = document.querySelectorAll('.js--filtre-partenaire li');
    const annonce = document.querySelector('.js--filtre-annonce');

    const classActif = buttonContainer.getAttribute('data-filtre-class-actif');
    const classInactif = buttonContainer.getAttribute('data-filtre-class-inactif');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const cible = button.getAttribute('data-filtre-cible');
            if (!cible) return;

            // Gérer les classes actives/inactives sur les boutons
            buttons.forEach(btn => {
                btn.classList.remove(classActif);
                btn.classList.add(classInactif);
                btn.setAttribute('aria-pressed', 'false');
            });

            button.classList.add(classActif);
            button.classList.remove(classInactif);
            button.setAttribute('aria-pressed', 'true');

            // Gérer l’affichage des partenaires
            if (cible === 'js--filtre-tous') {
                partenaires.forEach(item => item.classList.remove('hide'));
                annonce.textContent = "Affichage de tous les partenaires";
            } else {
                partenaires.forEach(item => {
                    if (item.classList.contains(cible)) {
                        item.classList.remove('hide');
                    } else {
                        item.classList.add('hide');
                    }
                });
                const label = button.textContent.trim();
                annonce.textContent = `Affichage des partenaires : ${label}`;
            }
        });
    });
});
