const STORAGE_KEY = 'wingman_session'
const API_URL = import.meta.env.VITE_API_URL

export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        username: data.username,
        loggedIn: true,
        loginTime: Date.now(),
      }))
      return { success: true, username: data.username }
    }
    return { success: false, error: data.error || 'Invalid username or password' }
  } catch {
    return { success: false, error: 'Could not reach server — is the backend running?' }
  }
}

export async function signup(username, password) {
  try {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        username: data.username,
        loggedIn: true,
        loginTime: Date.now(),
      }))
      return { success: true, username: data.username }
    }
    return { success: false, error: data.error || 'Signup failed.' }
  } catch {
    return { success: false, error: 'Could not reach server — is the backend running?' }
  }
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

export function currentUsername() {
  return getSession()?.username || null
}

/** Returns a localStorage key scoped to the logged-in user. */
export function userKey(base) {
  const u = currentUsername() || '_guest'
  return `${base}_${u}`
}
