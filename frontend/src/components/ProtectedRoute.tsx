import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerified?: boolean;
  requirePremium?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireVerified = false,
  requirePremium = false,
}) => {
  const location = useLocation();
  const { user, token, isLoading } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.user);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but verification is required
  if (requireVerified && isAuthenticated && profile) {
    const isVerified = profile.profile?.isVerified;
    if (!isVerified) {
      return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }
  }

  // If premium subscription is required
  if (requirePremium && isAuthenticated && profile) {
    const subscription = profile.subscription;
    const isPremium = subscription?.status === 'premium' || subscription?.plan === 'premium';
    if (!isPremium) {
      return <Navigate to="/upgrade" state={{ from: location }} replace />;
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 