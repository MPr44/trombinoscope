const DATA_URL = '/assets/data/trombinoscope_data_french.json';

function initStorage () {
  const data = window.localStorage.getItem('data')
  if (!data) {
    fetch(DATA_URL)
    .then(response => response.json())
    .then(data => {
      window.localStorage.setItem('data', JSON.stringify(data))
    })
  }
}

// initStorage()

function addItem (item) {
  const data = JSON.parse(window.localStorage.getItem('data'))
  if (data) {
    data.push(item)
    window.localStorage.setItem('data', JSON.stringify(data))
  } else {
    // On utilise une constante avec un "_" pour éviter le conflit de nommage
    const _data = []
    _data.push(item)
    window.localStorage.setItem('data', JSON.stringify(_data))
  }
}

function removeItem (itemId) {
  const data = JSON.parse(window.localStorage.getItem('data'))
  if (data) {
    const _data = data.filter(item => item.id !== itemId)
    window.localStorage.setItem('data', JSON.stringify(_data))
  }
}

function getNewId () {
  const data = JSON.parse(window.localStorage.getItem('data'))
  if (data) {
    const lastId = data.map(item => item.id).sort((a,b) => b - a)[0]
    return (lastId || 0) + 1
  } else {
    return 1
  }
}

function getAllItems () {
  const data = JSON.parse(window.localStorage.getItem('data'))
  return data || []
}