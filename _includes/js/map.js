/* --- Liste des lieux pré-géocodés --- */
const lieuxPro = [
    { id: "moirans", adresse: "90 Rue des Fleurs, 38430, Moirans, France", coords: { lat: 45.328523, lon: 5.559947 }, popup: "Maison de la Petite Enfance", zoom: 17 },
    { id: "st-jean-de-moirans", adresse: "112 rue Soffrey de Calignon, Saint-Jean-de-Moirans, France", coords: { lat: 45.3410203, lon: 5.5816306 }, zoom: 17 },
    { id: "rives", adresse: "438 rue Bayard, Rives, France", coords: { lat: 45.3546397, lon: 5.4951711 }, zoom: 17 },
    { id: "charnecles", adresse: "212-260 Chemin de l Eglise, Charnècles, France", coords: { lat: 45.3456787, lon: 5.5288323 }, popup: "Salle Pont Romain", zoom: 17 },
    { id: "la-murette", adresse: "Chemin du clapier, La Murette, France", coords: { lat: 45.3785076, lon: 5.5394852 }, popup: "Petite salle polyvalente", zoom: 17 }
];

const lieuxParent = [
    { id: "charnecles", adresse: "212-260 Chemin de l Eglise, Charnècles, France", coords: { lat: 45.3456787, lon: 5.5288323 }, popup: "Salle Pont Romain", zoom: 17 },
    { id: "la-murette", adresse: "Chemin du clapier, La Murette, France", coords: { lat: 45.3785076, lon: 5.5394852 }, popup: "Relais Petite Enfance", zoom: 17 },
    { id: "moirans", adresse: "90 Rue des Fleurs, 38430, Moirans, France", coords: { lat: 45.328523, lon: 5.559947 }, popup: "Maison de la Petite Enfance", zoom: 17 },
    { id: "reaumont", adresse: "10 place de la mairie, Réaumont, France", coords: { lat: 45.3667163, lon: 5.5264494 }, popup: "Mairie de Réaumont", zoom: 17 },
    { id: "rives", adresse: "96 rue Sadi Carnot, Rives, France", coords: { lat: 45.3496838, lon: 5.5004409 }, popup: "Centre Social de l'Orgère - CSMO", zoom: 17 },
    { id: "rives2", adresse: "438 rue Bayard, Rives, France", coords: { lat: 45.3546397, lon: 5.4951711 }, popup: "Pôle Petite Enfance", zoom: 17 },
    { id: "st-blaise-du-buis", adresse: "305 rue de la Mairie, Saint-Blaise-du-Buis, France", coords: { lat: 45.3785131, lon: 5.517977 }, popup: "Mairie de Saint-Blaise-du-Buis", zoom: 17 },
    { id: "saint-cassien", adresse: "9 route de Chartreuse, Saint-Cassien, France", coords: { lat: 45.360092, lon: 5.55197 }, popup: "Mairie de Saint-Cassien", zoom: 17 },
    { id: "st-jean-de-moirans", adresse: "112 rue Soffrey de Calignon, Saint-Jean-de-Moirans, France", coords: { lat: 45.3410203, lon: 5.5816306 }, popup: "Relais Petite Enfance", zoom: 17 }
];

/* --- Fonction générique d'initialisation d'une carte --- */
async function initCarte(containerId, lieux, prefix = containerId) {
    const map = L.map(containerId);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marqueurs = [];
    let defaultView = null;

    function getPopupContent(lieu) {
        const custom = lieu.popup ? `<div style="margin-bottom:4px">${lieu.popup}</div>` : "";
        const adresse = `<b>${lieu.adresse}</b>`;
        return `${custom}${adresse}`;
    }

    // --- Ajouter les marqueurs ---
    lieux.forEach(lieu => {
        if (!lieu.coords) return;

        const marker = L.marker([lieu.coords.lat, lieu.coords.lon]).addTo(map);
        marker.bindPopup(getPopupContent(lieu));
        lieu.marker = marker;

        marker.on('click', () => {
            const zoom = lieu.zoom ?? 15;
            map.setView([lieu.coords.lat, lieu.coords.lon], zoom, { animate: true });
            marker.openPopup();
        });

        marqueurs.push(marker);
    });

    // --- Ajuster la vue globale et stocker la vue par défaut ---
    if (marqueurs.length > 0) {
        const group = new L.featureGroup(marqueurs);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
        defaultView = {
            center: map.getCenter(),
            zoom: map.getZoom()
        };
        setTimeout(() => map.invalidateSize(), 250);
    } else {
        map.setView([0, 0], 1);
        console.warn("Aucun marqueur ajouté pour", containerId);
    }

    // --- Bouton reset ---
    const resetId = `btn-reset-${prefix}`;
    document.getElementById(resetId)?.addEventListener('click', () => {
        if (defaultView) {
            map.setView(defaultView.center, defaultView.zoom, { animate: true });
        }
    });

    // --- Boutons pour chaque lieu ---
    lieux.forEach(lieu => {
        const btnId = `btn-${prefix}-${lieu.id}`;
        document.getElementById(btnId)?.addEventListener('click', function () {
            if (lieu.coords) {
                const zoom = lieu.zoom ?? 15;
                map.setView([lieu.coords.lat, lieu.coords.lon], zoom, { animate: true });
                if (lieu.marker) {
                    map.once('moveend', () => lieu.marker.openPopup());
                }
            } else {
                alert(`Impossible de localiser : ${lieu.adresse}`);
            }
        });
    });

    window.addEventListener('resize', () => {
        map.invalidateSize();
    });

    return { map, lieux, marqueurs };
}

/* --- Initialisation des deux cartes --- */
initCarte('map-pro', lieuxPro, 'mappro');
initCarte('map-parent', lieuxParent, 'mapparent');
