/* ============================================
   TOUTES LES CHECK-LISTS (un seul fichier)
   ============================================ */

/* ---------- 💧 TRAITEMENT D'EAU ---------- */

registerChecklist("water", {
    icon: "💧",
    title: "Salle de traitement d'eau",
    sections: [

        {
            title: "📊 Relevé des compteurs (nuit)",
            night: true,
            fields: [
                { id: "cpt_R1", type: "number", label: "Compteur R1" },
                { id: "cpt_R2", type: "number", label: "Compteur R2" },
                { id: "cpt_general", type: "number", label: "Compteur Général" },
                { id: "cpt_vestiaires", type: "number", label: "Compteur Vestiaires" },
                { id: "cpt_process", type: "number", label: "Compteur Process" },
                { id: "cpt_adoucisseur", type: "number", label: "Compteur Adoucisseur" },
                { id: "cpt_lavemoule", type: "number", label: "Compteur Lave-moule" },
                { id: "cpt_bvm_tf", type: "number", label: "Compteur BVM + TF" },
                { id: "cpt_smt", type: "number", label: "Compteur SMT" }
            ]
        },

        {
            title: "🔧 Pompes",
            fields: [
                { id: "pompe_master", type: "radio", label: "Pompe master active", options: ["Pompe 1", "Pompe 2"] },
                { id: "pressionP1", type: "number", label: "Pression Pompe 1 (bar)", min: 5, max: 6 },
                { id: "pressionP2", type: "number", label: "Pression Pompe 2 (bar)", min: 5, max: 6 }
            ]
        },

        {
            title: "🔵 Filtres et Collecteurs",
            fields: [
                { id: "filtre_quartz1", type: "number", label: "Pression Filtre à quartz 1 (bar)", min: 5, max: 6 },
                { id: "filtre_quartz2", type: "number", label: "Pression Filtre à quartz 2 (bar)", min: 5, max: 6 },
                { id: "filtre_pvc1", type: "number", label: "Pression Filtre PVC 1 (bar)", min: 4, max: 5 },
                { id: "collect_filtree", type: "number", label: "Pression Collecteur Eau Filtrée (bar)", min: 4, max: 5 },
                { id: "collect_adoucie", type: "number", label: "Pression Collecteur Eau Adoucie (bar)", min: 4, max: 5 },
                { id: "filtre_inox", type: "number", label: "Pression Filtre Inox (bar)", min: 4, max: 5 },
                { id: "filtre_pvc2", type: "number", label: "Pression Filtre PVC 2 (bar)", min: 4, max: 5 }
            ]
        },

        {
            title: "💡 Système UV",
            fields: [
                { id: "uv1_lampes", type: "select", label: "Nombre de lampes actives UV1", options: ["0", "1", "2"] },
                { id: "uv2", type: "number", label: "Pourcentage UV2 (%)", min: 95, max: 100 },
                { id: "uv2_heures", type: "number", label: "Nombre d'heures UV2" },
                { id: "uv3", type: "number", label: "Pourcentage UV3 (%)", min: 95, max: 100 },
                { id: "uv3_heures", type: "number", label: "Nombre d'heures UV3" }
            ]
        },

        {
            title: "🧪 Adoucisseur",
            fields: [
                { id: "adoucisseur_actif", type: "select", label: "Adoucisseur actif", options: ["Adoucisseur 1", "Adoucisseur 2"] },
                { id: "adoucisseur_regen", type: "number", label: "Compteur de régénération" }
            ]
        },

        {
            title: "📝 Commentaire",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire / anomalie" }
            ]
        }

    ]
});


/* ---------- 🔥 EAU SURCHAUFFÉE ---------- */

registerChecklist("surchauffee", {
    icon: "🔥",
    title: "Chaudière Eau Surchauffée",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- ♨️ CHAUDIÈRE VAPEUR ---------- */

registerChecklist("vapeur", {
    icon: "♨️",
    title: "Chaudière à Vapeur",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- 🔧 POMPE À VIDE ---------- */

registerChecklist("vide", {
    icon: "🔧",
    title: "Pompe à Vide",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- 💨 COMPRESSEURS ---------- */

registerChecklist("compresseurs", {
    icon: "💨",
    title: "Compresseur d'Air",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- ❄️ EAU GLACÉE ---------- */

registerChecklist("glacee", {
    icon: "❄️",
    title: "Eau Glacée",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- 🌡️ THERMOVENTILATION ---------- */

registerChecklist("thermo", {
    icon: "🌡️",
    title: "Thermoventilation",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- ⚡ GROUPES ÉLECTROGÈNES ---------- */

registerChecklist("groupes", {
    icon: "⚡",
    title: "Groupes Électrogènes",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});


/* ---------- 💧 STATION D'OSMOSE ---------- */

registerChecklist("osmose", {
    icon: "💧",
    title: "Station d'Osmose",
    sections: [
        {
            title: "En cours de construction",
            fields: [
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
    ]
});
