import React, { useEffect } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trash2 } from 'lucide-react';
import format from 'date-fns/format';
import './Accounts.css';

const DeletedAccounts = () => {
  const { deletedAccounts, fetchDeletedAccounts, restoreAccount, hardDeleteAccount } = useAccounts();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeletedAccounts();
    // eslint-disable-next-line
  }, []);

  const formatCurrency = (amount) => `৳\u00A0${Number(amount).toLocaleString()}`;

  return (
    <div className="accounts-page animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/accounts')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2>Recently Deleted / ট্র্যাশ</h2>
        <div style={{ width: '85px' }}></div>
      </div>

      <div className="accounts-list">
        {deletedAccounts.length === 0 ? (
          <div className="empty-state">No deleted accounts. Recycle bin is empty!</div>
        ) : (
          deletedAccounts.map(acc => (
            <div key={acc._id} className="glass-card account-card" style={{ opacity: 0.8 }}>
              <div className="account-info">
                <h3>{acc.name}</h3>
                <span className="base-amount">Base: {formatCurrency(acc.baseAmount)}</span>
                
                {acc.deletedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    <Trash2 size={14} />
                    <span>Deleted: {format(new Date(acc.deletedAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
              <div className="account-actions">
                <button className="icon-btn share-btn" title="Restore Account" onClick={() => restoreAccount(acc._id)}>
                  <RefreshCcw size={18} />
                </button>
                <div className={`current-balance ${acc.currentBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(acc.currentBalance)}
                </div>
                <button className="icon-btn sub-btn" title="Delete Permanently" onClick={() => window.confirm('Are you absolutely sure? This cannot be undone.') && hardDeleteAccount(acc._id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeletedAccounts;
