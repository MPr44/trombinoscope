/**
 * Affiche la modale et l'overlay en manipulant leurs classes CSS.
 */
function showModal() {
  // Sélectionne l'overlay et la modale
  const overlay = document.querySelector('#overlay');
  const modal = document.querySelector('#modal');
  
  // Affiche l'overlay et la modale en manipulant les classes CSS
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
  modal.classList.remove('hidden');
  modal.classList.add('show');
}

/**
 * Masque la modale et l'overlay en manipulant leurs classes CSS.
 */
function hideModal() {
  // Sélectionne l'overlay et la modale
  const overlay = document.querySelector('#overlay');
  const modal = document.querySelector('#modal');
  
  // Masque l'overlay et la modale en manipulant les classes CSS
  overlay.classList.remove('show');
  overlay.classList.add('hidden');
  modal.classList.remove('show');
  modal.classList.add('hidden');
}

/**
 * Affiche un message d'erreur sous un champ de formulaire.
 * Désactive également le bouton de soumission.
 * 
 * @param {HTMLElement} element - L'élément de formulaire où l'erreur est détectée.
 * @param {string} message - Le message d'erreur à afficher.
 */
function afficherErreur(element, message) {
  // Sélectionne l'élément d'erreur adjacent, s'il existe
  const error = element.nextElementSibling;
  
  // Vérifie si l'élément d'erreur n'existe pas ou a été créé par Dashlane (cas à ignorer)
  if (!error || error.hasAttribute('data-dashlanecreated')) {
    // Ajoute une classe CSS pour signaler une erreur sur l'élément
    element.classList.add('error');
    
    // Crée un nouvel élément <span> pour afficher le message d'erreur
    const errorElement = document.createElement('span');
    errorElement.textContent = message; // Ajoute le message d'erreur
    errorElement.classList.add('error-message'); // Applique une classe CSS pour styliser
    
    // Insère l'élément d'erreur immédiatement après le champ
    element.insertAdjacentElement('afterend', errorElement);
    
    // Désactive le bouton de soumission du formulaire
    const submitButton = document.querySelector('#submit-button');
    submitButton.disabled = true;
  }
}

/**
 * Retire le message d'erreur associé à un champ de formulaire.
 * Réactive également le bouton de soumission.
 * 
 * @param {HTMLElement} element - L'élément de formulaire où l'erreur est retirée.
 */
function retirerErreur(element) {
  // Sélectionne l'élément d'erreur adjacent
  const error = element.nextElementSibling;
  
  // Vérifie si l'élément d'erreur existe et n'a pas été créé par Dashlane
  if (error && !error.hasAttribute('data-dashlanecreated')) {
    // Supprime l'élément d'erreur
    error.remove();
    
    // Retire la classe CSS signalant une erreur sur l'élément
    element.classList.remove('error');
    
    // Réactive le bouton de soumission du formulaire
    const submitButton = document.querySelector('#submit-button');
    submitButton.disabled = false;
  }
}

/**
 * Valide tous les champs du formulaire.
 * Affiche un message d'erreur pour chaque champ vide.
 */
function validateForm() {
  // Sélectionne tous les champs de type <input>
  const inputs = document.querySelectorAll("input");
  
  // Parcourt chaque champ pour vérifier sa validité
  inputs.forEach(input => {
    if (input.value.trim() === '') {
      // Si le champ est vide, affiche une erreur
      afficherErreur(input, 'Le champ ne doit pas être vide');
    } else {
      // Sinon, retire l'erreur
      retirerErreur(input);
    }
  });
}

function loadSelect () {
  /**
   * Ajout des options du formulaire pour le niveau hiérarchique
   */
  const select = document.querySelector('#lienHierarchique')
  const items = getAllItems()
  const optionsFragment = document.createDocumentFragment()
  items.forEach(item => {
    const option = document.createElement('option')
    option.textContent = `${item.prenom} ${item.nom} (${item.id})`
    option.value = item.id
    optionsFragment.appendChild(option)
  })

  select.appendChild(optionsFragment)
}

/**
 * Ajoute des événements pour la gestion de la modale, la validation en temps réel
 * et la soumission du formulaire.
 */
document.addEventListener('DOMContentLoaded', () => {
  
  loadSelect()
  const addButton = document.querySelector('#add-button');
  const clearButton = document.querySelector('#clear-button');
  const overlay = document.querySelector('#overlay');
  
  // Ouvre la modale lors du clic sur le bouton "Ajouter"
  addButton.addEventListener('click', showModal);

  clearButton.addEventListener('click', function () {
    window.localStorage.clear()
    init()
    loadSelect()
  })
  
  // Ferme la modale lorsqu'on clique sur l'overlay
  overlay.addEventListener('click', hideModal);

  /**
   * Validation en temps réel des champs du formulaire.
   */
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => {
    input.addEventListener('input', function (event) {
      if (event.target.value.trim() === '') {
        // Si la valeur du champ est vide, affiche une erreur
        afficherErreur(input, 'Le champ ne doit pas être vide');
      } else {
        // Sinon, retire l'erreur
        retirerErreur(input);
      }
    });
  });

  /**
   * Gestion de la soumission du formulaire.
   */
  const form = document.querySelector('#person-form');
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Empêche l'action par défaut (rechargement de la page)
    validateForm(); // Valide tous les champs du formulaire
    
    // On récupère les champs texte du formulaire
    const inputs = document.querySelectorAll('input')
    const personne = {}
    inputs.forEach(input => {
      personne[input.name] = input.value
    })

    // On récupère le lien hiérarchique
    const lienHierarchique = document.querySelector('#lienHierarchique').value
    personne.lienHierarchique = lienHierarchique ? parseInt(lienHierarchique) : null
    
    // On génère un nouvel ID pour la nouvelle personne
    const id = getNewId()
    personne.id = id

     // Gestion de l'image (base64)
    const fileInput = document.querySelector('#profileImage');
    const file = fileInput.files[0]; // Le fichier sélectionné

    if (file) {
      // Si un fichier est sélectionné, on l'encode en base64
      const reader = new FileReader();
      reader.onload = function(e) {
        // e.target.result contient la donnée en base64 (ex: "data:image/png;base64,....")
        personne.photo = e.target.result;

        // On ajoute la personne au stockage
        addItem(personne);

        // On ferme la modale
        hideModal();

        // On réinitialise l'organigramme
        init();
        loadSelect();
      };
      // Lit le fichier comme une URL de données (base64)
      reader.readAsDataURL(file);
    } else {
      // Aucun fichier sélectionné => image par défaut
      personne.photo = '/assets/images/photo_1.webp';

      // On ajoute la personne au stockage
      addItem(personne);

      // On ferme la modale
      hideModal();

      // On réinitialise l'organigramme
      init();
      loadSelect();
    }
  });
});
