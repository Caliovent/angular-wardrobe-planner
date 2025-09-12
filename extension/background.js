chrome.action.onClicked.addListener((tab) => {
  const apiUrl = 'http://localhost:3000/api/items/from-url';
  const frontendUrl = 'http://localhost:4200';
  const cookieName = 'auth_token';

  chrome.cookies.get({ url: frontendUrl, name: cookieName }, (cookie) => {
    if (!cookie) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'User Not Logged In',
        message: 'Please log in to the Wardrobe Planner application first.'
      });
      return;
    }

    const token = cookie.value;
    const itemData = {
      url: tab.url,
      name: tab.title
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itemData),
    })
    .then(response => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    })
    .then(data => {
      console.log('Article ajouté avec succès:', data);
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
      if (error && error.status) {
          errorMessage = `Échec de l'ajout. Le serveur a répondu avec le code: ${error.status}.`;
      }
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Erreur de sauvegarde',
        message: errorMessage
      });
    });
  });
});
