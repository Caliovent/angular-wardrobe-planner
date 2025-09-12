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
      // On lance la réponse elle-même pour pouvoir récupérer le statut dans le .catch
      throw response;
    }
    return response.json();
  })
  .then(data => {
    console.log('Article ajouté avec succès:', data);
    // Notification de succès
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Article sauvegardé',
      message: `L'article "${itemData.name}" a été ajouté à votre wishlist.`
    });
  })
  .catch(error => {
    console.error("Erreur lors de l'ajout de l'article:", error);

    let errorMessage = "Impossible d'ajouter l'article. Veuillez vérifier votre connexion ou réessayer plus tard.";

    // Amélioration: Vérifier si l'erreur est une réponse HTTP pour donner un feedback plus précis.
    if (error && error.status) {
        errorMessage = `Échec de l'ajout. Le serveur a répondu avec le code: ${error.status}.`;
    }

    // Notification d'échec
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png', // L'icône d'erreur n'est pas disponible, on utilise l'icône par défaut.
      title: 'Erreur de sauvegarde',
      message: errorMessage
    });
  });
});
