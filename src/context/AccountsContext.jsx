import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const AccountsContext = createContext();

export const useAccounts = () => useContext(AccountsContext);

export const AccountsProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compute currentBalance from baseAmount + transactions (frontend side)
  const computeBalance = (acc) => {
    let bal = acc.baseAmount || 0;
    (acc.transactions || []).forEach(trx => {
      if (trx.type === 'plus') bal += trx.amount;
      else if (trx.type === 'minus') bal -= trx.amount;
    });
    return bal;
  };

  const withBalance = (accs) => accs.map(a => ({ ...a, currentBalance: computeBalance(a) }));

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(withBalance(res.data.data));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchDeletedAccounts = async () => {
    try {
      const res = await api.get('/accounts/deleted');
      setDeletedAccounts(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
      fetchDeletedAccounts();
    } else {
      setAccounts([]);
      setDeletedAccounts([]);
    }
  }, [isAuthenticated]);

  const addAccount = async (name, baseAmount) => {
    const res = await api.post('/accounts', { name, baseAmount });
    const newAcc = res.data.data;
    setAccounts([...accounts, { ...newAcc, currentBalance: computeBalance(newAcc) }]);
  };

  const deleteAccount = async (id) => {
    await api.delete(`/accounts/${id}`);
    setAccounts(accounts.filter(a => a._id !== id));
  };

  const addTransaction = async (accountId, type, amount, note, proofImage) => {
    const res = await api.post(`/accounts/${accountId}/transaction`, { type, amount, note, proofImage });
    const updated = res.data.data;
    setAccounts(accounts.map(a => a._id === accountId ? { ...updated, currentBalance: computeBalance(updated) } : a));
  };

  const shareAccount = async (accountId, targetUserId) => {
    try {
      await api.post(`/accounts/${accountId}/share`, { targetUserId });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const shareAllAccounts = async (targetUserId) => {
    try {
      await api.post(`/accounts/share-all`, { targetUserId });
      await fetchAccounts();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const restoreAccount = async (id) => {
    const res = await api.put(`/accounts/restore/${id}`);
    setDeletedAccounts(deletedAccounts.filter(a => a._id !== id));
    setAccounts([...accounts, res.data.data]);
  };

  const hardDeleteAccount = async (id) => {
    await api.delete(`/accounts/hard-delete/${id}`);
    setDeletedAccounts(deletedAccounts.filter(a => a._id !== id));
  };

  // Derived state
  const personalAccounts = accounts.filter(a => a.userId?._id === user?._id || a.userId === user?._id);
  const sharedAccounts = accounts.filter(a => a.userId?._id !== user?._id && a.userId !== user?._id);
  const personalTotal = personalAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const sharedTotal = sharedAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  return (
    <AccountsContext.Provider value={{
      accounts, deletedAccounts, personalAccounts, sharedAccounts, personalTotal, sharedTotal, loading,
      fetchAccounts, fetchDeletedAccounts, addAccount, deleteAccount, addTransaction, shareAccount, shareAllAccounts, restoreAccount, hardDeleteAccount
    }}>
      {children}
    </AccountsContext.Provider>
  );
};
