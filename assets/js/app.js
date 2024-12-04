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
  const liste = conteneur.firstElementChild //On récupère l'élément UL
  const fragment = document.createDocumentFragment() //je crée un fragment pour stocker les li

  data.forEach(item => {
    const { id, nom, prenom, poste, niveauHierarchique, photo, dateNaissance } =
      item
    const element = document.createElement('li') //On crée l'élément li
    element.textContent = `${nom} ${prenom} ${poste} ${niveauHierarchique} ${photo} ${dateNaissance}` //on ajoute le contenu data
    fragment.appendChild(element)
  })
  liste.appendChild(fragment)
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
