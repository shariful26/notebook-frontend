import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Send, 
  History, 
  CheckCircle, 
  X, 
  Clock, 
  AlertCircle,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, onClose, account }) => {
  if (!isOpen || !account) return null;

  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
  const [channel, setChannel] = useState('email'); // 'email', 'whatsapp', 'sms'
  const [templateType, setTemplateType] = useState('receivable'); // 'receivable', 'payable', 'statement', 'custom'
  
  const [phone, setPhone] = useState(account.phone || '');
  const [email, setEmail] = useState(account.email || '');
  const [customNote, setCustomNote] = useState('');
  const [subject, setSubject] = useState(`📌 স্মার্ট নোটবুক রিমাইন্ডার - ${account.name}`);
  
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  const balance = account.currentBalance || 0;
  const isReceivable = balance >= 0;

  useEffect(() => {
    setPhone(account.phone || '');
    setEmail(account.email || '');
    setCustomNote('');
    setStatusMsg({ type: '', text: '' });
    
    // Auto pick template based on balance
    if (balance >= 0) {
      setTemplateType('receivable');
    } else {
      setTemplateType('payable');
    }
  }, [account]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, account]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/notifications/history?accountId=${account._id}`);
      if (res.data && res.data.success) {
        setHistoryLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notification history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Generate body text based on template selection
  const generateMessageBody = () => {
    const formattedBalance = Math.abs(balance).toLocaleString('bn-BD');

    let baseText = '';
    if (templateType === 'receivable') {
      baseText = `প্রিয় ${account.name},\nস্মার্ট নোটবুকের হিসাব অনুযায়ী আপনার কাছে ${formattedBalance} ৳ পাওনা রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধের ব্যবস্থা করার অনুরোধ জানাচ্ছি।`;
    } else if (templateType === 'payable') {
      baseText = `প্রিয় ${account.name},\nআপনার হিসাব অনুযায়ী আপনার পাওনা ${formattedBalance} ৳ পরিশোধ সংক্রান্ত আপডেট। দ্রুত তা পরিশোধ করার প্রক্রিয়া চলছে।`;
    } else if (templateType === 'statement') {
      baseText = `প্রিয় ${account.name},\nআপনার হিসাব খাতা বিবরণী (Statement):\nখাতার নাম: ${account.name}\nবর্তমান স্থিতু/ব্যালেন্স: ${formattedBalance} ৳ (${isReceivable ? 'পাবো' : 'দেনা'})।`;
    } else {
      baseText = `প্রিয় ${account.name},\nআপনার জন্য একটি নোট দেওয়া হলো:`;
    }

    if (customNote.trim()) {
      baseText += `\n\n📝 নোট: ${customNote.trim()}`;
    }

    baseText += `\n\n- Smart Notebook (স্মার্ট নোটবুক)`;
    return baseText;
  };

  const messageText = generateMessageBody();

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!email) {
      setStatusMsg({ type: 'error', text: 'অনুগ্রহ করে প্রাপ্তিকারীর ইমেইল প্রদান করুন।' });
      return;
    }

    try {
      setLoading(true);
      setStatusMsg({ type: '', text: '' });

      const res = await api.post('/notifications/send-email', {
        accountId: account._id,
        email,
        subject,
        note: customNote,
        messageText,
        templateType,
        amount: balance,
      });

      if (res.data && res.data.success) {
        setStatusMsg({ type: 'success', text: '📧 ইমেইল সফলভাবে পাঠানো হয়েছে!' });
        fetchHistory();
      }
    } catch (err) {
      console.error('Email error:', err);
      setStatusMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'ইমেইল পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!phone) {
      setStatusMsg({ type: 'error', text: 'অনুগ্রহ করে প্রাপ্তিকারীর মোবাইল নম্বর প্রদান করুন।' });
      return;
    }

    try {
      setLoading(true);
      // Clean phone number (remove spaces, hyphens)
      let cleanPhone = phone.replace(/[^\d+]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '88' + cleanPhone; // Bangladesh default country code prefix
      }

      // Log notification
      await api.post('/notifications/log', {
        accountId: account._id,
        recipientPhone: phone,
        channel: 'whatsapp',
        templateType,
        note: customNote,
        messageText,
        amount: balance,
      });

      // Open WhatsApp chat with prefilled message
      const encodedMsg = encodeURIComponent(messageText);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');

      setStatusMsg({ type: 'success', text: '💬 হোয়াটসঅ্যাপে রিমাইন্ডার পাঠানো হচ্ছে...' });
      fetchHistory();
    } catch (err) {
      console.error('WhatsApp dispatch error:', err);
      setStatusMsg({ type: 'error', text: 'হোয়াটসঅ্যাপ রিডাইরেক্ট করতে সমস্যা হয়েছে।' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!phone) {
      setStatusMsg({ type: 'error', text: 'অনুগ্রহ করে প্রাপ্তিকারীর মোবাইল নম্বর প্রদান করুন।' });
      return;
    }

    try {
      setLoading(true);
      let cleanPhone = phone.replace(/[^\d+]/g, '');

      // Log notification
      await api.post('/notifications/log', {
        accountId: account._id,
        recipientPhone: phone,
        channel: 'sms',
        templateType,
        note: customNote,
        messageText,
        amount: balance,
      });

      // Trigger native SMS app
      const encodedMsg = encodeURIComponent(messageText);
      window.location.href = `sms:${cleanPhone}?body=${encodedMsg}`;

      setStatusMsg({ type: 'success', text: '📱 মেসেজ ডায়ালগ ওপেন হচ্ছে...' });
      fetchHistory();
    } catch (err) {
      console.error('SMS error:', err);
      setStatusMsg({ type: 'error', text: 'মেসেজ ওপেন করতে সমস্যা হয়েছে।' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel notification-modal animate-fade-in">
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title">
            <div className="header-icon-badge">
              <Bell size={22} color="var(--primary)" />
            </div>
            <div>
              <h3>মেসেজ ও নোটিফিকেশন পাঠান</h3>
              <p className="subtitle">খাতাধারী: <strong>{account.name}</strong> ({Math.abs(balance)} ৳ {isReceivable ? 'পাবো' : 'দেনা'})</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <Send size={16} />
            <span>নতুন মেসেজ পাঠান</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>নোটিফিকেশন হিস্ট্রি</span>
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMsg.text && (
          <div className={`status-banner ${statusMsg.type}`}>
            {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Content 1: Send Message */}
        {activeTab === 'send' && (
          <div className="tab-body">
            
            {/* Channel Selection */}
            <div className="section-group">
              <label className="section-label">মেসেজ মাধ্যম বেছে নিন (Select Channel):</label>
              <div className="channel-grid">
                <button 
                  type="button"
                  className={`channel-card ${channel === 'email' ? 'active' : ''}`}
                  onClick={() => setChannel('email')}
                >
                  <div className="channel-icon email"><Mail size={22} /></div>
                  <div className="channel-name">ইমেইল (Email)</div>
                  <span className="badge-pill">Auto Delivery</span>
                </button>

                <button 
                  type="button"
                  className={`channel-card ${channel === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setChannel('whatsapp')}
                >
                  <div className="channel-icon whatsapp"><MessageSquare size={22} /></div>
                  <div className="channel-name">হোয়াটসঅ্যাপ (WhatsApp)</div>
                  <span className="badge-pill wa">1-Click Chat</span>
                </button>

                <button 
                  type="button"
                  className={`channel-card ${channel === 'sms' ? 'active' : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  <div className="channel-icon sms"><PhoneCall size={22} /></div>
                  <div className="channel-name">মোবাইল SMS</div>
                  <span className="badge-pill sms">Mobile Trigger</span>
                </button>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="form-row">
              {channel === 'email' ? (
                <div className="form-group full-width">
                  <label className="input-label">প্রাপ্তিকারীর ইমেইল (Recipient Email):</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="icon" />
                    <input 
                      type="email" 
                      placeholder="e.g. name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group full-width">
                  <label className="input-label">প্রাপ্তিকারীর ফোন নম্বর (Phone Number):</label>
                  <div className="input-with-icon">
                    <PhoneCall size={18} className="icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. 01700000000" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Template Selector */}
            <div className="section-group">
              <label className="section-label">মেসেজ টেমপ্লেট বেছে নিন (Message Template):</label>
              <div className="template-chips">
                <button 
                  type="button"
                  className={`chip-btn ${templateType === 'receivable' ? 'active' : ''}`}
                  onClick={() => setTemplateType('receivable')}
                >
                  💰 পাওনা টাকা তাগাদা
                </button>
                <button 
                  type="button"
                  className={`chip-btn ${templateType === 'payable' ? 'active' : ''}`}
                  onClick={() => setTemplateType('payable')}
                >
                  💳 দেনা পরিশোধ আপডেট
                </button>
                <button 
                  type="button"
                  className={`chip-btn ${templateType === 'statement' ? 'active' : ''}`}
                  onClick={() => setTemplateType('statement')}
                >
                  📊 হিসাব বিবরণী
                </button>
                <button 
                  type="button"
                  className={`chip-btn ${templateType === 'custom' ? 'active' : ''}`}
                  onClick={() => setTemplateType('custom')}
                >
                  ✍️ শুধু কাস্টম বার্তা
                </button>
              </div>
            </div>

            {/* Custom Note input */}
            <div className="form-group">
              <label className="input-label">নোট বা বিশেষ বার্তা যোগ করুন (Add Custom Note):</label>
              <textarea 
                rows="2"
                placeholder="যেমন: আগামীকাল বিকাশ বা নগদ করে দিলে ভালো হয়..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="glass-textarea"
              />
            </div>

            {/* Live Message Preview */}
            <div className="preview-box">
              <div className="preview-header">
                <div className="preview-title">
                  <FileText size={15} />
                  <span>মেসেজ প্রিভিউ (Live Preview)</span>
                </div>
                <button type="button" className="copy-btn" onClick={handleCopyMessage}>
                  <Copy size={14} />
                  <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>
              </div>
              <pre className="preview-content">{messageText}</pre>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                বাতিল করুন
              </button>

              {channel === 'email' && (
                <button 
                  type="button" 
                  className="btn-send primary-btn"
                  onClick={handleSendEmail}
                  disabled={loading}
                >
                  <Mail size={18} />
                  <span>{loading ? 'ইমেইল পাঠানো হচ্ছে...' : 'ইমেইল পাঠান'}</span>
                </button>
              )}

              {channel === 'whatsapp' && (
                <button 
                  type="button" 
                  className="btn-send wa-btn"
                  onClick={handleSendWhatsApp}
                  disabled={loading}
                >
                  <MessageSquare size={18} />
                  <span>{loading ? 'প্রসেসিং...' : 'হোয়াটসঅ্যাপ মেসেজ দিন'}</span>
                  <ExternalLink size={14} style={{ marginLeft: 4 }} />
                </button>
              )}

              {channel === 'sms' && (
                <button 
                  type="button" 
                  className="btn-send sms-btn"
                  onClick={handleSendSMS}
                  disabled={loading}
                >
                  <PhoneCall size={18} />
                  <span>{loading ? 'প্রসেসিং...' : 'SMS ডায়ালগ ওপেন করুন'}</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* Tab Content 2: History */}
        {activeTab === 'history' && (
          <div className="tab-body history-tab">
            {historyLoading ? (
              <div className="loading-spinner">লোড হচ্ছে...</div>
            ) : historyLogs.length === 0 ? (
              <div className="empty-history">
                <Clock size={40} color="var(--text-secondary)" />
                <p>এই অ্যাকাউন্টের জন্য পূর্বে কোনো নোটিফিকেশন পাঠানো হয়নি।</p>
              </div>
            ) : (
              <div className="history-list">
                {historyLogs.map((log) => (
                  <div key={log._id} className="history-item">
                    <div className="history-item-header">
                      <div className="history-channel-badge">
                        {log.channel === 'email' && <span className="channel-tag email"><Mail size={14} /> Email</span>}
                        {log.channel === 'whatsapp' && <span className="channel-tag wa"><MessageSquare size={14} /> WhatsApp</span>}
                        {log.channel === 'sms' && <span className="channel-tag sms"><PhoneCall size={14} /> SMS</span>}
                        <span className="recipient-info">
                          {log.recipientPhone || log.recipientEmail || 'N/A'}
                        </span>
                      </div>
                      <span className="time-stamp">
                        {new Date(log.createdAt).toLocaleString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {log.note && (
                      <div className="history-note">
                        <strong>নোট:</strong> {log.note}
                      </div>
                    )}

                    <div className="history-msg-snippet">
                      {log.messageText}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default NotificationModal;
