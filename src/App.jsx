import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Notes from './pages/Notes';
import Categories from './pages/Categories';
import Accounts from './pages/Accounts';
import SharedAccounts from './pages/SharedAccounts';
import DeletedAccounts from './pages/DeletedAccounts';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Accounts />} />
          <Route path="/accounts" element={<Navigate to="/" replace />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/shared-accounts" element={<SharedAccounts />} />
          <Route path="/deleted-accounts" element={<DeletedAccounts />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
