import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../services/authService";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage and fetch fresh profile from MongoDB
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("healtalk_token");
        const storedUser = localStorage.getItem("healtalk_user");

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Fetch fresh user profile from backend to ensure role is up-to-date
          try {
            const res = await API.get("/auth/me");
            if (res.data && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem("healtalk_user", JSON.stringify(res.data.user));
            }
          } catch (apiErr) {
            console.warn("Could not refresh user profile from backend:", apiErr.message);
          }
        }
      } catch (err) {
        console.error("Error reading auth state from localStorage:", err);
        localStorage.removeItem("healtalk_token");
        localStorage.removeItem("healtalk_user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Handle Login
  const login = async (credentials) => {
    const data = await loginUser(credentials);
    // data contains { message, token, user }
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("healtalk_token", data.token);
      localStorage.setItem("healtalk_user", JSON.stringify(data.user));
    }
    return data;
  };

  // Handle Register
  const register = async (userData) => {
    const data = await registerUser(userData);
    return data;
  };

  // Handle Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("healtalk_token");
    localStorage.removeItem("healtalk_user");
  };

  // Update local user state immediately
  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem("healtalk_user", JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
