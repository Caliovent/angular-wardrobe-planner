chrome.action.onClicked.addListener((tab) => {
  // L'URL de notre API backend déployée sur Render
  const apiUrl = 'https://angular-wardrobe-planner.onrender.com/api/items/from-url';

  const itemData = {
    url: tab.url,
    name: tab.title // On utilise le titre de la page comme nom par défaut
  };

  // Envoyer les données à notre API
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Article ajouté avec succès:', data);
    // On pourrait afficher une notification à l'utilisateur ici
  })
  .catch(error => {
    console.error("Erreur lors de l'ajout de l'article:", error);
  });
});
