const STORAGE_KEY = 'wingman_session'

// Dummy credentials — swap for real auth when ready
const VALID_CREDENTIALS = { username: 'abc', password: '123' }

export function login(username, password) {
  if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
    const session = { username, loggedIn: true, loginTime: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    return { success: true, username }
  }
  return { success: false, error: 'Invalid username or password' }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return getSession()?.loggedIn === true
}
