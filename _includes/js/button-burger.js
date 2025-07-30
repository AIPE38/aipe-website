document.addEventListener("DOMContentLoaded", () => {
    const burgerBtn = document.getElementById('burger');
    const burgerNav = document.getElementById('navigation-principal');
    const burgerMain = document.getElementById('contenu');
    const burgerFooter = document.getElementById('footer');
    const burgerHeader = document.getElementById('header');



    function menuBurgerChangelabel() {
        let texteNouveau = burgerBtn.dataset.label;
        let texteActuel = burgerBtn.getAttribute('aria-label');
        burgerBtn.setAttribute('aria-label', texteNouveau);
        burgerBtn.setAttribute('data-label', texteActuel);
    }



    function displayMenuBurger() {
        
        if (burgerNav.classList.contains('hide-for-medium-down')) {

            burgerMain.classList.add('hide-for-medium-down');
            burgerFooter.classList.add('hide-for-medium-down');
            burgerNav.classList.remove('hide-for-medium-down');
            burgerNav.classList.add('v_actif');
            burgerBtn.classList.add('v_actif');
            burgerHeader.classList.add('v_actif');
            menuBurgerChangelabel();
            burgerBtn.setAttribute('aria-expanded', true);


        } else {

            burgerMain.classList.remove('hide-for-medium-down');
            burgerFooter.classList.remove('hide-for-medium-down');
            burgerNav.classList.add('hide-for-medium-down');
            burgerNav.classList.remove('v_actif');
            burgerBtn.classList.remove('v_actif');
            burgerHeader.classList.remove('v_actif');
            menuBurgerChangelabel();
            burgerBtn.setAttribute('aria-expanded', false);

        }

    }

    if (burgerBtn) {
        burgerBtn.addEventListener('click', displayMenuBurger);
    }
});