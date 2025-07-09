import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { 
  login, 
  register, 
  logout, 
  getProfile, 
  clearError,
  clearAuth 
} from '@/store/slices/authSlice';
import { getProfile as getUserProfile } from '@/store/slices/userSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isLoading, error } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.user);

  const loginUser = async (credentials: { email: string; password: string }) => {
    try {
      await dispatch(login(credentials)).unwrap();
      // Fetch user profile after successful login
      await dispatch(getUserProfile()).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    walletAddress?: string;
  }) => {
    try {
      await dispatch(register(userData)).unwrap();
      // Fetch user profile after successful registration
      await dispatch(getUserProfile()).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch(clearAuth());
    }
  };

  const fetchProfile = async () => {
    try {
      await dispatch(getProfile()).unwrap();
      await dispatch(getUserProfile()).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    profile,
    token,
    isLoading,
    error,
    isAuthenticated: !!token && !!user,
    loginUser,
    registerUser,
    logoutUser,
    fetchProfile,
    clearAuthError,
  };
}; 