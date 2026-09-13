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
            title: "📊 Compteurs et dosage",
            fields: [
                { id: "cpt_osmosee", type: "number", label: "Compteur Eau Osmosée" },
                { id: "cpt_adoucie", type: "number", label: "Compteur Eau Adoucie" },
                { id: "qt_mf788", type: "number", label: "Quantité MF788 versée (confirmation)", hint: "Calcul auto : 0,6 L par m³ consommé" },
                { id: "qt_adg5150", type: "number", label: "Quantité ADG5150 versée (confirmation)", hint: "Calcul auto : 0,5 L par m³ consommé" },
                { id: "dosage_info", type: "text", label: "💡 Dosage suggéré (automatique)" }
            ]
        },

        {
            title: "🌡️ Circuits",
            fields: [
                { id: "pression_R2", type: "number", label: "Pression R2 (bar)" },
                { id: "pression_surchauffee", type: "number", label: "Pression Circuit Eau Surchauffée (bar)", min: 4.8, max: 5 },
                { id: "temp_surchauffee", type: "number", label: "Température Circuit Eau Surchauffée (°C)", min: 131, max: 134 },
                { id: "pression_chaude", type: "number", label: "Pression Circuit Eau Chaude (bar)", min: 2.5, max: 3 },
                { id: "temp_chaude", type: "number", label: "Température Circuit Eau Chaude (°C)", min: 80, max: 90 }
            ]
        },

        {
            title: "🏭 Chaudière Mingazzini",
            fields: [
                { id: "ming_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "ming_temp", type: "number", label: "Température (°C) si active", min: 131, max: 134 },
                { id: "ming_pression", type: "number", label: "Pression (bar) si active", min: 2.5, max: 3 }
            ]
        },

        {
            title: "🏭 Chaudière ICI",
            fields: [
                { id: "ici_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "ici_temp", type: "number", label: "Température (°C) si active", min: 131, max: 134 },
                { id: "ici_pression", type: "number", label: "Pression (bar) si active", min: 2.5, max: 3 }
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


/* ---------- ♨️ CHAUDIÈRE VAPEUR ---------- */

registerChecklist("vapeur", {
    icon: "♨️",
    title: "Chaudière à Vapeur",
    sections: [

        {
            title: "📊 Compteurs et dosage (nuit)",
            night: true,
            fields: [
                { id: "cpt_osmosee", type: "number", label: "Compteur Eau Osmosée" },
                { id: "cpt_adoucie", type: "number", label: "Compteur Eau Adoucie" },
                { id: "niveau_reservoir", type: "number", label: "Niveau du réservoir de dosage" },
                { id: "qt_produit", type: "number", label: "Quantité de produit versée", hint: "Calcul auto : (150 − Niveau) × 0,047" },
                { id: "dosage_info", type: "text", label: "💡 Quantité suggérée (automatique)" }
            ]
        },

        {
            title: "💧 Niveau Eau Bâche",
            fields: [
                { id: "niveau_bache", type: "radio", label: "Niveau Eau Bâche", options: ["= 3/4", "< 3/4", "> 3/4"] }
            ]
        },

        {
            title: "🏭 Chaudière Mingazzini",
            fields: [
                { id: "ming_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "ming_pression", type: "number", label: "Pression (bar) si active", min: 4, max: 7 },
                { id: "ming_purge_temps", type: "number", label: "Temps de purge (s)" },
                { id: "ming_purge_intervalle", type: "number", label: "Intervalle de purge (min)" }
            ]
        },

        {
            title: "🏭 Chaudière Alsthom",
            fields: [
                { id: "alsthom_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "alsthom_pression", type: "number", label: "Pression (bar) si active", min: 4, max: 7 },
                { id: "alsthom_purge_temps", type: "number", label: "Temps de purge (s)" },
                { id: "alsthom_purge_intervalle", type: "number", label: "Intervalle de purge (min)" }
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


/* ---------- 🔧 POMPE À VIDE ---------- */

registerChecklist("vide", {
    icon: "🔧",
    title: "Pompe à Vide",
    sections: [

        {
            title: "🔧 Généralités",
            fields: [
                { id: "purge_circuit", type: "checkbox", label: "Purge du circuit (nuit)", label2: "Fait" },
                { id: "pression_globale", type: "number", label: "Pression globale (mbar)" },
                { id: "pression_reservoir", type: "number", label: "Pression réservoir (mbar)" }
            ]
        },

        {
            title: "📊 Fonctionnement des pompes",
            fields: [
                { id: "p1_pourcent", type: "number", label: "% fonctionnement Pompe 1" },
                { id: "p1_heures", type: "number", label: "Compteur entretien Pompe 1 (h)" },
                { id: "p2_pourcent", type: "number", label: "% fonctionnement Pompe 2" },
                { id: "p2_heures", type: "number", label: "Compteur entretien Pompe 2 (h)" },
                { id: "p3_pourcent", type: "number", label: "% fonctionnement Pompe 3" },
                { id: "p3_heures", type: "number", label: "Compteur entretien Pompe 3 (h)" },
                { id: "p4_pourcent", type: "number", label: "% fonctionnement Pompe 4" },
                { id: "p4_heures", type: "number", label: "Compteur entretien Pompe 4 (h)" }
            ]
        },

        {
            title: "🔍 Inspection fuites",
            fields: [
                { id: "fuites", type: "radio", label: "Inspection fuites (Huile ou Air)", options: ["Pas de fuite", "Fuite détectée"] },
                { id: "zone_fuite", type: "text", label: "Zone de la fuite (si détectée)" }
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


/* ---------- 💨 COMPRESSEURS ---------- */

registerChecklist("compresseurs", {
    icon: "💨",
    title: "Compresseur d'Air",
    sections: [

        {
            title: "💨 Purge",
            fields: [
                { id: "purge_circuit", type: "checkbox", label: "Purge du circuit (nuit)", label2: "Fait" }
            ]
        },

        {
            title: "🌡️ Compresseurs",
            fields: [
                { id: "c2_temp", type: "number", label: "Température Compresseur 2 (°C)" },
                { id: "c2_heures", type: "number", label: "Compteur entretien Compresseur 2 (h)" },
                { id: "c3_temp", type: "number", label: "Température Compresseur 3 (°C)" },
                { id: "c3_heures", type: "number", label: "Compteur entretien Compresseur 3 (h)" },
                { id: "c4_temp", type: "number", label: "Température Compresseur 4 (°C)" },
                { id: "c4_heures", type: "number", label: "Compteur entretien Compresseur 4 (h)" },
                { id: "c5_temp", type: "number", label: "Température Compresseur 5 (°C)" },
                { id: "c5_heures", type: "number", label: "Compteur entretien Compresseur 5 (h)" },
                { id: "c6_temp", type: "number", label: "Température Compresseur 6 (°C)" },
                { id: "c6_heures", type: "number", label: "Compteur entretien Compresseur 6 (h)" },
                { id: "c7_temp", type: "number", label: "Température Compresseur 7 (°C)" },
                { id: "c7_heures", type: "number", label: "Compteur entretien Compresseur 7 (h)" }
            ]
        },

        {
            title: "🌡️ Sécheurs",
            fields: [
                { id: "s1_temp", type: "number", label: "Température Sécheur 1 (°C)" },
                { id: "s2_temp", type: "number", label: "Température Sécheur 2 (°C)" },
                { id: "s3_temp", type: "number", label: "Température Sécheur 3 (°C)" },
                { id: "s4_temp", type: "number", label: "Température Sécheur 4 (°C)" },
                { id: "s5_temp", type: "number", label: "Température Sécheur 5 (°C)" }
            ]
        },

        {
            title: "🔍 Inspections",
            fields: [
                { id: "niveau_huile", type: "radio", label: "Inspection niveau d'huile", options: ["OK", "NOK"] },
                { id: "detail_huile", type: "text", label: "Détail si NOK (niveau bas)" },
                { id: "fuites", type: "radio", label: "Inspection fuites (Huile ou Air)", options: ["Pas de fuite", "Fuite détectée"] },
                { id: "zone_fuite", type: "text", label: "Zone de la fuite (si détectée)" }
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


/* ---------- ❄️ EAU GLACÉE ---------- */

registerChecklist("glacee", {
    icon: "❄️",
    title: "Eau Glacée",
    sections: [

        {
            title: "❄️ Trane",
            fields: [
                { id: "trane_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "trane_pression_res", type: "number", label: "Pression Réservoir (bar)" },
                { id: "trane_purge", type: "checkbox", label: "Purge de l'air (matin et nuit)", label2: "Fait" },
                { id: "trane_hp1", type: "number", label: "Pression HP Compresseur 1 (bar)", hint: "Réf : 12 bar" },
                { id: "trane_bp1", type: "number", label: "Pression BP Compresseur 1 (bar)", hint: "Réf : 6 bar" },
                { id: "trane_hp2", type: "number", label: "Pression HP Compresseur 2 (bar)", hint: "Réf : 12 bar" },
                { id: "trane_bp2", type: "number", label: "Pression BP Compresseur 2 (bar)", hint: "Réf : 6 bar" },
                { id: "trane_compresseur", type: "radio", label: "Compresseur en fonctionnement", options: ["Compresseur 1", "Compresseur 2"] },
                { id: "trane_consigne", type: "number", label: "Consigne", hint: "Réf : 12" },
                { id: "trane_amont", type: "number", label: "Température en amont (°C)" },
                { id: "trane_aval", type: "number", label: "Température en aval (°C)" }
            ]
        },

        {
            title: "❄️ Chiller (absorption)",
            fields: [
                { id: "chiller_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "chiller_niveau_tour", type: "select", label: "Niveau d'eau tour de refroidissement", options: ["OK", "Bas", "Haut"] },
                { id: "chiller_eg_entree", type: "number", label: "Température entrée eau glacée (°C)" },
                { id: "chiller_eg_sortie", type: "number", label: "Température sortie eau glacée (°C)", max: 15, hint: "Max 15 °C" },
                { id: "chiller_tour_entree", type: "number", label: "Température entrée tour de refroidissement (°C)" },
                { id: "chiller_tour_sortie", type: "number", label: "Température sortie tour de refroidissement (°C)", max: 37, hint: "Max 37 °C" },
                { id: "chiller_ec_entree", type: "number", label: "Température entrée eau chaude (°C)" },
                { id: "chiller_ec_sortie", type: "number", label: "Température sortie eau chaude (°C)" },
                { id: "chiller_vide", type: "number", label: "Pression vide (mmHg)", max: 16, hint: "< 16 mmHg" },
                { id: "chiller_cv", type: "number", label: "CV (%)" },
                { id: "chiller_bromure", type: "select", label: "Niveau voyant bromure de lithium", options: ["OK", "Bas", "Haut"] }
            ]
        },

        {
            title: "❄️ York",
            fields: [
                { id: "york_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "york_pression_res", type: "number", label: "Pression Réservoir (bar)" },
                { id: "york_purge", type: "checkbox", label: "Purge de l'air (matin et nuit)", label2: "Fait" },
                { id: "york_hp1", type: "number", label: "Pression HP Compresseur 1 (bar)", hint: "Réf : 12 bar" },
                { id: "york_bp1", type: "number", label: "Pression BP Compresseur 1 (bar)", hint: "Réf : 6 bar" },
                { id: "york_hp2", type: "number", label: "Pression HP Compresseur 2 (bar)", hint: "Réf : 12 bar" },
                { id: "york_bp2", type: "number", label: "Pression BP Compresseur 2 (bar)", hint: "Réf : 6 bar" },
                { id: "york_compresseur", type: "radio", label: "Compresseur en fonctionnement", options: ["Compresseur 1", "Compresseur 2"] },
                { id: "york_consigne", type: "number", label: "Consigne", hint: "Réf : 12" },
                { id: "york_amont", type: "number", label: "Température en amont (°C)" },
                { id: "york_aval", type: "number", label: "Température en aval (°C)" }
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


/* ---------- 🌡️ THERMOVENTILATION ---------- */

registerChecklist("thermo", {
    icon: "🌡️",
    title: "Thermoventilation",
    sections: [

        {
            title: "🌡️ Filtres",
            fields: [
                { id: "filtre1", type: "text", label: "État filtre thermo 1" },
                { id: "filtre2", type: "text", label: "État filtre thermo 2" },
                { id: "filtre3", type: "text", label: "État filtre thermo 3" }
            ]
        },

        {
            title: "🌀 Turbines",
            fields: [
                { id: "turbine1", type: "text", label: "Inspection turbine thermo 1" },
                { id: "turbine2", type: "text", label: "Inspection turbine thermo 2" },
                { id: "turbine3", type: "text", label: "Inspection turbine thermo 3" }
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


/* ---------- ⚡ GROUPES ÉLECTROGÈNES ---------- */

registerChecklist("groupes", {
    icon: "⚡",
    title: "Groupes Électrogènes",
    sections: [

        {
            title: "⚡ Groupe 1",
            fields: [
                { id: "g1_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "g1_charge", type: "number", label: "Charge moteur (%)", min: 75, hint: "Min 75 %" },
                { id: "g1_huile", type: "select", label: "Niveau d'huile", options: ["ADD", "FULL", "CENTRE"] },
                { id: "g1_cyl_min", type: "number", label: "Température cylindre minimale (°C)" },
                { id: "g1_cyl_min_num", type: "number", label: "N° Cylindre (min)" },
                { id: "g1_cyl_max", type: "number", label: "Température cylindre maximale (°C)" },
                { id: "g1_cyl_max_num", type: "number", label: "N° Cylindre (max)" },
                { id: "g1_eau_entree", type: "number", label: "Température entrée eau refroidissement (°C)" },
                { id: "g1_eau_sortie", type: "number", label: "Température sortie eau refroidissement (°C)" },
                { id: "g1_echappement", type: "number", label: "Température échappement (°C)" },
                { id: "g1_retour_surchauffee", type: "number", label: "Température retour eau surchauffée (°C)" }
            ]
        },

        {
            title: "⚡ Groupe 2",
            fields: [
                { id: "g2_etat", type: "radio", label: "État", options: ["Active", "Inactive"] },
                { id: "g2_charge", type: "number", label: "Charge moteur (%)", min: 75, hint: "Min 75 %" },
                { id: "g2_huile", type: "select", label: "Niveau d'huile", options: ["ADD", "FULL", "CENTRE"] },
                { id: "g2_cyl_min", type: "number", label: "Température cylindre minimale (°C)" },
                { id: "g2_cyl_min_num", type: "number", label: "N° Cylindre (min)" },
                { id: "g2_cyl_max", type: "number", label: "Température cylindre maximale (°C)" },
                { id: "g2_cyl_max_num", type: "number", label: "N° Cylindre (max)" },
                { id: "g2_eau_entree", type: "number", label: "Température entrée eau refroidissement (°C)" },
                { id: "g2_eau_sortie", type: "number", label: "Température sortie eau refroidissement (°C)" },
                { id: "g2_echappement", type: "number", label: "Température échappement (°C)" },
                { id: "g2_retour_surchauffee", type: "number", label: "Température retour eau surchauffée (°C)" }
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


/* ---------- 💧 STATION D'OSMOSE ---------- */

registerChecklist("osmose", {
    icon: "💧",
    title: "Station d'Osmose",
    sections: [

        {
            title: "📊 Compteurs (nuit)",
            night: true,
            fields: [
                { id: "cpt_production", type: "number", label: "Compteur Production" },
                { id: "cpt_rejet", type: "number", label: "Compteur Rejet" }
            ]
        },

        {
            title: "🧪 Dosage",
            fields: [
                { id: "niveau_res1", type: "number", label: "Niveau réservoir de dosage 1" },
                { id: "niveau_res2", type: "number", label: "Niveau réservoir de dosage 2" },
                { id: "qt_produit1", type: "number", label: "Quantité de produit 1" },
                { id: "qt_produit2", type: "number", label: "Quantité de produit 2" }
            ]
        },

        {
            title: "🌡️ Pressions",
            fields: [
                { id: "pression_primaire", type: "number", label: "Pression Primaire (bar)" },
                { id: "pression_avant_charbon", type: "number", label: "Pression avant filtre à charbon (bar)" },
                { id: "pression_apres_charbon", type: "number", label: "Pression après filtre à charbon (bar)" },
                { id: "pression_apres_filtres", type: "number", label: "Pression après les filtres (bar)" }
            ]
        },

        {
            title: "💨 Débits",
            fields: [
                { id: "debit_production", type: "number", label: "Débit production (LPM)" },
                { id: "debit_rejet", type: "number", label: "Débit rejet (LPM)" }
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


/* ============================================
   CALCULS AUTOMATIQUES
   ============================================ */

// Emballer openChecklist pour brancher les calculs après affichage
const _openChecklistBase = openChecklist;
openChecklist = function(id) {
    _openChecklistBase(id);
    attachCalculs(id);
};


/* 🔥 Eau Surchauffée : dosage MF788 / ADG5150
   = (compteur actuel − dernier compteur enregistré) × 0,6 / 0,5 */

async function attachCalculs(id) {
    if (id === "surchauffee") {
        const osm = document.getElementById("cpt_osmosee");
        const adou = document.getElementById("cpt_adoucie");
        if (!osm || !adou) return;

        // Récupérer le dernier relevé enregistré
        let last = null;
        try {
            const { data } = await db.from("measurements")
                .select("data")
                .eq("utility_name", "surchauffee")
                .order("recorded_at", { ascending: false })
                .limit(1);
            if (data && data.length) last = data[0].data;
        } catch (e) { /* pas grave si vide */ }

        function calcDosage() {
            const osmVal = parseFloat(osm.value);
            const adouVal = parseFloat(adou.value);
            const info = document.getElementById("dosage_info");
            if (!info) return;

            if (isNaN(osmVal) || isNaN(adouVal)) { info.value = ""; return; }

            // Consommation m³ = osmosée actuelle − dernière osmosée
            let conso = osmVal;
            if (last && last.cpt_osmosee !== undefined) {
                conso = osmVal - parseFloat(last.cpt_osmosee);
            }
            if (conso < 0) conso = 0;

            const mf = (conso * 0.6).toFixed(2);
            const adg = (conso * 0.5).toFixed(2);
            info.value = "Pour " + conso.toFixed(1) + " m³ → MF788 : " + mf + " L | ADG5150 : " + adg + " L";
        }

         osm.addEventListener("input", calcDosage);
        adou.addEventListener("input", calcDosage);
        calcDosage();
    }

    /* ♨️ Vapeur : quantité = (150 − Niveau) × 0,047 */
    if (id === "vapeur") {
        const niveau = document.getElementById("niveau_reservoir");
        if (!niveau) return;

        niveau.addEventListener("input", function() {
            const info = document.getElementById("dosage_info");
            const n = parseFloat(niveau.value);
            if (!info) return;
            if (isNaN(n)) { info.value = ""; return; }
            const qte = ((150 - n) * 0.047).toFixed(2);
            info.value = "Quantité suggérée : " + qte + " L";
        });
    }
}
