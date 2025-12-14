import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      setUser(response.data.user)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const checkAuth = async () => {
      try {
        // Logique de vérification de session
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}