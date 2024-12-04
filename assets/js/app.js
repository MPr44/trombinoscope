const DATA_PATH = '/trombinoscope/assets/data/trombinoscope_data_french.json'

/**
 * Initialisation des données
 */
async function init () {
  // Récupération du fichier local contenant les données de test
  const response = await fetch(DATA_PATH)
  const data = await response.json()
  console.log(data)
}

init()