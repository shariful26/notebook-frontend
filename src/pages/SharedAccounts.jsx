import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccounts } from '../context/AccountsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share, History, X, ArrowUpCircle, ArrowDownCircle, FileDown, TrendingUp, TrendingDown, Image, Mail } from 'lucide-react';
import { downloadPDFFromHTML, emailPDFFromHTML } from '../utils/pdfGenerator';
import './Accounts.css';

const SharedAccounts = () => {
  const { sharedAccounts, sharedTotal } = useAccounts();
  const { user } = useAuth();
  const navigate = useNavigate();

  // History & Modal states
  const [showHistory, setShowHistory] = useState(false);
  const [historyAcc, setHistoryAcc] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedProofImage, setSelectedProofImage] = useState(null);

  // Email statement loading state
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAccountName, setEmailAccountName] = useState('');

  const formatCurrency = (amount) => `৳ ${Number(amount).toLocaleString()}`;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const openHistory = (acc) => {
    setHistoryAcc(acc);
    setShowHistory(true);
  };

  const getRunningHistory = (acc) => {
    if (!acc) return [];
    const rows = [];
    let running = Number(acc.baseAmount) || 0;

    // Starting row (only for non-zero baseAmount to support legacy accounts)
    if (running !== 0) {
      rows.push({
        id: 'base',
        date: acc.createdAt,
        type: acc.baseAmount >= 0 ? 'plus' : 'minus',
        amount: Math.abs(Number(acc.baseAmount)) || 0,
        note: acc.baseNote || '—',
        balance: running,
      });
    }

    // Transactions chronologically
    const sorted = [...(acc.transactions || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sorted.forEach((trx) => {
      const trxAmt = Number(trx.amount) || 0;
      if (trx.type === 'plus') running += trxAmt;
      else running -= trxAmt;
      rows.push({
        id: trx._id,
        date: trx.date,
        type: trx.type,
        amount: trxAmt,
        note: trx.note || '—',
        proofImage: trx.proofImage || '',
        balance: running,
      });
    });

    return rows;
  };

  const handleDownloadSinglePDF = async (accountName) => {
    await downloadPDFFromHTML('single-account-print', `${accountName}_hisab_sheet.pdf`);
  };

  const openEmailModal = (accountName) => {
    setEmailAccountName(accountName);
    setEmailTo(user?.email || '');
    setEmailSubject(`📊 Smart Notebook - Statement: ${accountName}`);
    setEmailBody(`প্রিয় গ্রাহক/ব্যবহারকারী,\n\nস্মার্ট নোটবুক থেকে আপনার হিসাবের স্টেটমেন্ট ফাইলটি পিডিএফ আকারে পাঠানো হলো। অনুগ্রহ করে সংযুক্ত ফাইলটি দেখুন।\n\nধন্যবাদ,\n${user?.name || 'স্মার্ট নোটবুক টিম'}`);
    setShowEmailModal(true);
  };

  const handleEmailSinglePDF = async (e) => {
    if (e) e.preventDefault();
    if (!emailTo) {
      alert("ইমেইল ঠিকানা দিন।");
      return;
    }
    setEmailLoading(true);
    setShowEmailModal(false);
    try {
      await emailPDFFromHTML('single-account-print', emailTo, `${emailAccountName}_hisab_sheet.pdf`, emailSubject, emailBody);
      alert("স্টেটমেন্টটি সফলভাবে ইমেইলে পাঠানো হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("ইমেইল পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে ব্যাকএন্ড SMTP কনফিগারেশন চেক করুন।");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
      <div className="accounts-page animate-fade-in">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/accounts')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2>Shared With Me</h2>
          <div style={{ width: '85px' }}></div> {/* Spacer */}
        </div>

        <div className="grand-total-card" style={{ background: 'linear-gradient(135deg, #475569, #1e293b)' }}>
          <p>Total Shared Amount</p>
          <h1>{formatCurrency(sharedTotal)}</h1>
        </div>

        <div className="accounts-list">
          {sharedAccounts.length === 0 ? (
            <div className="empty-state">No shared accounts found.</div>
          ) : (
            sharedAccounts.map(acc => (
              <div key={acc._id} className="glass-card account-card">
                <div className="account-info">
                  <h3>{acc.name}</h3>
                  <span className="base-amount">Base: {formatCurrency(Math.abs(acc.currentBalance))}</span>
                  
                  {acc.userId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#3b82f6', fontSize: '0.85rem' }}>
                      <Share size={14} />
                      <span>Shared by: {acc.userId.name}</span>
                    </div>
                  )}
                </div>
                <div className="account-actions">
                  <button
                    className="icon-btn history-btn"
                    title="লেনদেনের ইতিহাস"
                    onClick={() => openHistory(acc)}
                    style={{ marginRight: '8px' }}
                  >
                    <History size={18} />
                  </button>
                  <div className={`current-balance ${acc.currentBalance > 0 ? 'negative' : acc.currentBalance < 0 ? 'positive' : ''}`}>
                    {formatCurrency(Math.abs(acc.currentBalance))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Shared Modals ─── */}
      {createPortal(
        <>
          {/* History Modal */}
          {showHistory && historyAcc && (() => {
            const rows = getRunningHistory(historyAcc);
            const baseAmt = Number(historyAcc.baseAmount) || 0;
            const totalIn = historyAcc.transactions.filter(t => t.type === 'plus').reduce((s, t) => s + t.amount, 0) + (baseAmt > 0 ? baseAmt : 0);
            const totalOut = historyAcc.transactions.filter(t => t.type === 'minus').reduce((s, t) => s + t.amount, 0) + (baseAmt < 0 ? Math.abs(baseAmt) : 0);
            return (
              <div className="full-page-overlay animate-slide-up">
                <div className="full-page-container">
                  <div className="fp-header">
                    <div>
                      <h3>{historyAcc.name}</h3>
                      <p>লেনদেনের ইতিহাস ({rows.length - 1} টি লেনদেন) [Read-Only]</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleDownloadSinglePDF(historyAcc.name)}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
                      >
                        <FileDown size={16} /> PDF ডাউনলোড
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        onClick={() => openEmailModal(historyAcc.name)}
                        disabled={emailLoading}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                      >
                        <Mail size={16} /> {emailLoading ? "পাঠানো হচ্ছে..." : "ইমেইলে পাঠান"}
                      </button>
                      <button className="fp-close-btn" onClick={() => setShowHistory(false)} style={{ width: '40px', height: '40px' }}>
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="fp-content">
                    <div className="fp-history-summary">
                      <div className="fp-summary-card">
                        <div className="label">
                          {historyAcc.currentBalance > 0 ? "পাবে: অন্যজন (দেনা)" : historyAcc.currentBalance < 0 ? "পাবে: আমি (পাওনা)" : "ব্যালেন্স"}
                        </div>
                        <div className={`value ${historyAcc.currentBalance > 0 ? 'negative' : historyAcc.currentBalance < 0 ? 'positive' : ''}`}>
                          {formatCurrency(Math.abs(historyAcc.currentBalance))}
                        </div>
                      </div>
                      <div className="fp-summary-card">
                        <div className="label"><TrendingUp size={16} color="var(--danger)" /> মোট ঋণ গ্রহণ</div>
                        <div className="value negative">{formatCurrency(totalIn)}</div>
                      </div>
                      <div className="fp-summary-card">
                        <div className="label"><TrendingDown size={16} color="var(--success)" /> মোট পরিশোধ</div>
                        <div className="value positive">{formatCurrency(totalOut)}</div>
                      </div>
                    </div>

                    <div className="history-table-wrap fp-table-wrap">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>তারিখ</th>
                            <th>ধরন</th>
                            <th>পরিমাণ</th>
                            <th>রেফারেন্স / নোট</th>
                            <th>ব্যালেন্স</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id} className={`history-row ${row.type}`}>
                              <td className="date-cell">{formatDate(row.date)}</td>
                              <td className="type-cell">
                                {(row.type === 'base' || row.type === 'base_plus') && <span className="badge badge-base">প্রারম্ভিক বকেয়া</span>}
                                {row.type === 'base_minus' && <span className="badge badge-plus"><ArrowDownCircle size={13} /> প্রারম্ভিক পরিশোধ</span>}
                                {row.type === 'plus' && <span className="badge badge-minus"><ArrowUpCircle size={13} /> ঋণ গ্রহণ</span>}
                                {row.type === 'minus' && <span className="badge badge-plus"><ArrowDownCircle size={13} /> পরিশোধ</span>}
                              </td>
                              <td className={`amount-cell ${(row.type === 'minus' || row.type === 'base_minus') ? 'positive' : 'negative'}`}>
                                {(row.type === 'minus' || row.type === 'base_minus') ? '−' : '+'}{formatCurrency(row.amount)}
                              </td>
                              <td 
                                className={`note-cell ${row.note && row.note !== '—' ? 'clickable' : ''}`}
                                onClick={() => {
                                  if (row.note && row.note !== '—') {
                                    setSelectedNote(row.note);
                                  }
                                }}
                                title={row.note && row.note !== '—' ? "সম্পূর্ণ দেখতে ক্লিক করুন" : undefined}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{row.note}</span>
                                  {row.proofImage && (
                                    <button
                                      type="button"
                                      className="icon-btn image-proof-btn"
                                      title="প্রমাণ ছবি দেখুন"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProofImage(row.proofImage);
                                      }}
                                      style={{ 
                                        marginLeft: '8px', padding: '4px 8px', 
                                        background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', 
                                        borderRadius: '4px', display: 'inline-flex', alignItems: 'center', 
                                        border: 'none', cursor: 'pointer', fontSize: '0.75rem', gap: '4px' 
                                      }}
                                    >
                                      <Image size={13} /> ছবি
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className={`balance-cell ${row.balance > 0 ? 'negative' : row.balance < 0 ? 'positive' : ''}`}>
                                {formatCurrency(Math.abs(row.balance))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rows.length === 1 && (
                        <div className="empty-state" style={{ marginTop: '24px' }}>
                          এখনো কোনো লেনদেন নেই
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Note Viewer Modal */}
          {selectedNote && (
            <div className="note-modal-overlay" onClick={() => setSelectedNote(null)}>
              <div className="note-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="note-modal-header">
                  <h3>রেফারেন্স / নোটের সম্পূর্ণ বিবরণ</h3>
                  <button className="fp-close-btn" onClick={() => setSelectedNote(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="note-modal-body">
                  {selectedNote}
                </div>
                <div className="note-modal-footer">
                  <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedNote(null)}>বন্ধ করুন</button>
                </div>
              </div>
            </div>
          )}

          {/* Proof Image Viewer Modal */}
          {selectedProofImage && (
            <div className="note-modal-overlay" onClick={() => setSelectedProofImage(null)}>
              <div className="note-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="note-modal-header">
                  <h3>লেনদেনের প্রমাণ ছবি</h3>
                  <button className="fp-close-btn" onClick={() => setSelectedProofImage(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="note-modal-body" style={{ textAlign: 'center', padding: '16px' }}>
                  <img src={selectedProofImage} alt="Transaction Proof" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-color)' }} />
                </div>
                <div className="note-modal-footer">
                  <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedProofImage(null)}>বন্ধ করুন</button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Print Template for HTML-to-Canvas PDF */}
          <div id="single-account-print" style={{
            position: 'absolute',
            left: '-9999px',
            top: '0',
            width: '800px',
            padding: '40px',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: 'SolaimanLipi, "Noto Sans Bengali", sans-serif',
            boxSizing: 'border-box',
            display: 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4f46e5', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#4f46e5' }}>স্মার্ট নোটবুক</h1>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>হিসাব বিবরণী (Shared Statement Sheet)</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>

            {historyAcc && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1e293b' }}>হিসাবের নাম: {historyAcc.name}</h2>
                </div>

                {(() => {
                  const rows = getRunningHistory(historyAcc);
                  const baseAmt = Number(historyAcc.baseAmount) || 0;
                  const totalIn = historyAcc.transactions.filter(t => t.type === 'plus').reduce((s, t) => s + t.amount, 0) + (baseAmt > 0 ? baseAmt : 0);
                  const totalOut = historyAcc.transactions.filter(t => t.type === 'minus').reduce((s, t) => s + t.amount, 0) + (baseAmt < 0 ? Math.abs(baseAmt) : 0);
                  const currentBal = historyAcc.currentBalance;
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            {currentBal > 0 ? "পাবে: অন্যজন (দেনা)" : currentBal < 0 ? "পাবে: আমি (পাওনা)" : "ব্যালেন্স"}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentBal > 0 ? '#dc2626' : currentBal < 0 ? '#16a34a' : '#64748b' }}>
                            {formatCurrency(Math.abs(currentBal))}
                          </div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>মোট ঋণ গ্রহণ (+)</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                            {formatCurrency(totalIn)}
                          </div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>মোট পরিশোধ (-)</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
                            {formatCurrency(totalOut)}
                          </div>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#1e293b' }}>
                        <thead>
                          <tr style={{ background: '#4f46e5', color: '#ffffff' }}>
                            <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left' }}>তারিখ</th>
                            <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left' }}>ধরন</th>
                            <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left' }}>পরিমাণ</th>
                            <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left' }}>রেফারেন্স / নোট</th>
                            <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'right' }}>ব্যালেন্স</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                              <td style={{ border: '1px solid #e2e8f0', padding: '10px' }}>{formatDate(row.date)}</td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontWeight: 'bold', color: row.type === 'plus' ? '#dc2626' : (row.type === 'minus' || row.type === 'base_minus') ? '#16a34a' : '#4f46e5' }}>
                                {row.type === 'base' ? 'প্রারম্ভিক বকেয়া' : row.type === 'base_minus' ? 'প্রারম্ভিক পরিশোধ' : row.type === 'plus' ? 'ঋণ গ্রহণ' : 'পরিশোধ'}
                              </td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontWeight: 'bold', color: (row.type === 'minus' || row.type === 'base_minus') ? '#16a34a' : '#dc2626' }}>
                                {(row.type === 'minus' || row.type === 'base_minus') ? '−' : '+'}{formatCurrency(row.amount)}
                              </td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '10px' }}>{row.note}</td>
                              <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'right', fontWeight: 'bold', color: row.balance > 0 ? '#dc2626' : row.balance < 0 ? '#16a34a' : '#64748b' }}>
                                {formatCurrency(Math.abs(row.balance))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </>
            )}
            {showEmailModal && (
            <div className="note-modal-overlay" onClick={() => setShowEmailModal(false)}>
              <div className="note-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="note-modal-header">
                  <h3>✉️ ইমেইল স্টেটমেন্ট পাঠান</h3>
                  <button className="fp-close-btn" onClick={() => setShowEmailModal(false)}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleEmailSinglePDF}>
                  <div className="note-modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.9rem', textAlign: 'left' }}>কার কাছে পাঠাবেন (ইমেইল)</label>
                      <input 
                        type="email" 
                        className="input-field" 
                        value={emailTo} 
                        onChange={(e) => setEmailTo(e.target.value)} 
                        required 
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.9rem', textAlign: 'left' }}>ইমেইল বিষয় (Subject)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={emailSubject} 
                        onChange={(e) => setEmailSubject(e.target.value)} 
                        required 
                        placeholder="ইমেইল বিষয় লিখুন"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.9rem', textAlign: 'left' }}>বার্তা (Custom Message)</label>
                      <textarea 
                        className="input-field" 
                        rows="5"
                        value={emailBody} 
                        onChange={(e) => setEmailBody(e.target.value)} 
                        required
                        placeholder="আপনার বার্তা লিখুন..."
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div className="note-modal-footer" style={{ gap: '12px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEmailModal(false)}>বাতিল করুন</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={emailLoading}>
                      {emailLoading ? "পাঠানো হচ্ছে..." : "ইমেইল পাঠান"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {emailLoading && (
            <div className="note-modal-overlay" style={{ zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="spinner"></div>
                <p style={{ color: 'white', fontWeight: '500', fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                  ইমেইল স্টেটমেন্ট তৈরি ও পাঠানো হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
                </p>
              </div>
            </div>
          )}
        </div>
      </>,
      document.body
    )}
  </>
  );
};

export default SharedAccounts;
