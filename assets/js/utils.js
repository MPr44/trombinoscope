function getAgeFromBirthdayDate (birthdayDate) {
  const age = new Date().getTime() - new Date(birthdayDate).getTime()
  return age / 1000 / 60 / 60 / 24 / 30 / 12
}