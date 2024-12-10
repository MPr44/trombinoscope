function showModal () {
  const overlay = document.querySelector('#overlay')
  const modal = document.querySelector('#modal')
  overlay.classList.remove('hidden')
  overlay.classList.add('show')
  modal.classList.remove('hidden')
  modal.classList.add('show')
}

function hideModal () {
  const overlay = document.querySelector('#overlay')
  const modal = document.querySelector('#modal')
  overlay.classList.remove('show')
  overlay.classList.add('hidden')
  modal.classList.remove('show')
  modal.classList.add('hidden')
}

function afficherErreur (element, message) {
  const error = element.nextElementSibling
  if (!error || error.hasAttribute('data-dashlanecreated')) {
    element.classList.add('error')
    const errorElement = document.createElement('span')
    errorElement.textContent = message
    errorElement.classList.add('error-message')
    element.insertAdjacentElement('afterend', errorElement)
    const submitButton = document.querySelector('#submit-button')
    submitButton.disabled = true
  }
}

function retirerErreur (element) {
  const error = element.nextElementSibling
  if (error && !error.hasAttribute('data-dashlanecreated')) {
    error.remove()
    element.classList.remove('error')
    const submitButton = document.querySelector('#submit-button')
    submitButton.disabled = false
  }
}

/**
 * Validation du formulaire global 1x
 */
function validateForm () {
  const inputs = document.querySelectorAll("input")
  inputs.forEach(input => {
    if (input.value.trim() === '') {
      afficherErreur(input, 'Le champ ne doit pas être vide')
    } else {
      retirerErreur(input)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const addButton = document.querySelector('#add-button')
  const overlay = document.querySelector('#overlay')
  addButton.addEventListener('click', showModal)
  overlay.addEventListener('click', hideModal)

  /**
   * Validation du formulaire en temps réel
   */
  const inputs = document.querySelectorAll("input")
  inputs.forEach(input => {
    input.addEventListener('input', function (event) {
      console.log(event)
      if (event.target.value.trim() === '') {
        afficherErreur(input, 'Le champ ne doit pas être vide')
      } else {
        retirerErreur(input)
      }
    })
  })

  /**
   * Soumission du formulaire
   */
  const form = document.querySelector('#person-form')
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    validateForm()
    console.log('FORMULAIRE soumis')
  })

})

