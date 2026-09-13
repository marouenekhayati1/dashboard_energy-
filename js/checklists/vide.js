registerChecklist("vide", {
    icon: "🔧",
    title: "Pompe à Vide",
    sections: [
        {
            title: "Généralités",
            fields: [
                { id: "purge_circuit", type: "checkbox", label: "Purge du circuit (nuit)", label2: "Fait" },
                { id: "pression_globale", type: "number", label: "Pression globale (mbar)" },
                { id: "pression_reservoir", type: "number", label: "Pression réservoir (mbar)" },
                { id: "commentaire", type: "textarea", label: "Commentaire" }
            ]
        }
        // On ajoutera les 4 pompes ensuite
    ]
});
