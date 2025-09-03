// Liste des lieux avec adresse et future coordonnée
const lieux = [
    {
        id: "moirans",
        adresse: "90 Rue des Fleurs, 38430, Moirans, France",
        coords: null,
        popup: "Maison de la Petite Enfance",
        zoom: 17
    },
    {
        id: "st-jean-de-moirans",
        adresse: "112 rue Soffrey de Calignon, Saint Jean de Moirans, France",
        coords: null,
        zoom: 17
    },
    {
        id: "rives",
        adresse: "438 rue Bayard, Rives, France",
        coords: null,
        zoom: 17
    },
    {
        id: "charnecles",
        adresse: " 212-260 Chemin de l’Eglise, Charnècles, France",
        coords: null,
        popup: "Salle Pont Romain",
        zoom: 17
    },
    {
        id: "la-murette",
        adresse: "Chemin du clapier, La Murette, France",
        coords: null,
        popup: "Petite salle polyvalente",
        zoom: 17
    }
];

// Initialiser la carte
const map = L.map('map-pro');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Stocker les marqueurs et les bounds par défaut
const marqueurs = [];
let defaultBounds = null;

// Fonction utilitaire pour construire le contenu du popup
function getPopupContent(lieu) {
    // Si lieu.popup existe, on l’affiche au-dessus de l’adresse
    const custom = lieu.popup ? `<div style="margin-bottom:4px">${lieu.popup}</div>` : "";
    const adresse = `<b>${lieu.adresse}</b>`;
    return `${custom}${adresse}`;
}

// Fonction de géocodage
async function geocoderAdresse(adresse) {
    try {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
        return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
        };
    } else {
        console.warn(`Adresse non trouvée : ${adresse}`);
        return null;
    }
    } catch (error) {
    console.error("Erreur de géocodage :", error);
    return null;
    }
}

// Charger tous les lieux
async function chargerLieux() {
    const promises = lieux.map(async (lieu) => {
    const coords = await geocoderAdresse(lieu.adresse);
    if (coords) {
        lieu.coords = coords;

        // Créer le marqueur
        const marker = L.marker([coords.lat, coords.lon]).addTo(map);
        
        // Lier le popup (adresse + texte personnalisé si fourni)
        marker.bindPopup(getPopupContent(lieu));
        
        // Ouvrir le popup dès l’ajout (optionnel)
        marker.openPopup();

        // Conserver la référence pour pouvoir ouvrir le popup plus tard
        lieu.marker = marker;

        // Centrer et zoomer sur le marqueur au clic
        marker.on('click', () => {
            if (lieu.coords) {
                map.setView([lieu.coords.lat, lieu.coords.lon], lieu.zoom, {
                animate: true,
                padding: [50, 50]
                });

                // Ouvrir le popup après le zoom
                marker.openPopup();
            }
        });


        // Garder trace pour calculer les bounds
        marqueurs.push(marker);

    }
    });

    await Promise.all(promises);

    // Définir la vue par défaut (tous les points visibles)
    if (marqueurs.length > 0) {
        const group = new L.featureGroup(marqueurs);
        defaultBounds = group.getBounds();
        map.fitBounds(defaultBounds, { padding: [50, 50] });
    } else {
        map.setView([0, 0], 1);
        alert("Aucune adresse trouvée.");
    }
}

// Bouton : revenir à la vue par défaut
document.getElementById('btn-reset')?.addEventListener('click', function () {
    if (defaultBounds) {
        map.fitBounds(defaultBounds, { padding: [50, 50], maxZoom: 10, animate: true });
    }
});

// Boutons de zoom sur chaque lieu
lieux.forEach(lieu => {
    const btnId = `btn-${lieu.id}`;
    document.getElementById(btnId)?.addEventListener('click', function () {
    if (lieu.coords) {
        map.setView([lieu.coords.lat, lieu.coords.lon], lieu.zoom, {
        animate: true,
        padding: [50, 50]
        });
        
        // Ouvrir le popup après le déplacement
        if (lieu.marker) {
            map.once('moveend', () => lieu.marker.openPopup());
        }

    } else {
        alert(`Impossible de localiser : ${lieu.adresse}`);
    }
    });
});

// Lancer le chargement
chargerLieux();