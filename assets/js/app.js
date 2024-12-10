const DATA_PATH = '/assets/data/trombinoscope_data_french.json'

/**
 * Initialisation des données
 */
async function init () {
  // Récupération du fichier local contenant les données de test
  const response = await fetch(DATA_PATH)
  const data = await response.json()
  console.log(data)
  
  const conteneur = document.querySelector('.main-content')

  const fragment = document.createDocumentFragment() //je crée un fragment pour stocker les div

  data.forEach(item => {
    const { id, nom, prenom, poste, niveauHierarchique, photo, dateNaissance } =
      item
    const element = document.createElement('div') //On crée l'élément div
    element.classList.add('card') //on ajoute une class card 
    const age = new Date().getTime() - new Date(dateNaissance).getTime()
    const ageEnAnnees = age / 1000 / 60 / 60 / 24 / 30 / 12
    
    element.innerHTML = //on ajoute le code html suivant
    `
      <header class="card-header">
        ${prenom} ${nom}
      </header>
      <div class="card-body">
        <img
          src="${photo}"
          alt="${prenom} ${nom} - ${poste}"
        />
      </div>
      <footer class="card-footer">
        <div class="card-age">${ageEnAnnees.toFixed(0)} ans</div>
        <div class="card-function">${poste}</div>
      </footer>
    ` 
    fragment.appendChild(element)
  })
  conteneur.appendChild(fragment)
}

init()

/**
 * Mise en application
 */

// Etape 1 : Intégrer les données sur la page HTML
// 1) Utiliser les données dans l'objet "data" pour afficher une liste à puce avec le nom et le prénom de chaque salarié

// 1.a) Modifier le fichier HTML pour avoir un <ul> dans le <main> et ajouter un ID au main
// 1.b) Cibler/Récupérer l'élément HTML <ul> à partir du <main>
// 1.c) A l'aide d'une boucle et d'un fragment, ajouter des <li> pour chacun des salarié contenu dans le tableau "data"


//Etape 2 : à la place de textContact inner HTML
//mapper les variables

//Etape 3 : enlever les ul et écrire le css
//