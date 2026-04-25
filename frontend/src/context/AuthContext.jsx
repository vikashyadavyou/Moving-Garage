import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('mg_user')
    const storedTokens = localStorage.getItem('mg_tokens')
    
    if (storedUser && storedTokens) {
      setUser(JSON.parse(storedUser))
      // Verify token is still valid
      authAPI.getProfile()
        .then(res => {
          setUser(res.data)
          localStorage.setItem('mg_user', JSON.stringify(res.data))
        })
        .catch(() => {
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    const response = await authAPI.login(credentials)
    const { user: userData, tokens } = response.data
    
    localStorage.setItem('mg_user', JSON.stringify(userData))
    localStorage.setItem('mg_tokens', JSON.stringify(tokens))
    setUser(userData)
    
    return userData
  }

  const register = async (data) => {
    const response = await authAPI.register(data)
    const { user: userData, tokens } = response.data
    
    localStorage.setItem('mg_user', JSON.stringify(userData))
    localStorage.setItem('mg_tokens', JSON.stringify(tokens))
    setUser(userData)
    
    return userData
  }

  const logout = () => {
    localStorage.removeItem('mg_user')
    localStorage.removeItem('mg_tokens')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('mg_user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
