import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle,
  FileText
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all'); // 'all', 'email', 'whatsapp', 'sms'

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/history');
      if (res.data && res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.accountName && log.accountName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.recipientPhone && log.recipientPhone.includes(searchQuery)) ||
      (log.recipientEmail && log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.note && log.note.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = channelFilter === 'all' || log.channel === channelFilter;

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="notifications-page animate-fade-in">
      
      {/* Header */}
      <div className="page-header">
        <div className="title-group">
          <div className="header-icon">
            <Bell size={24} color="#6366f1" />
          </div>
          <div>
            <h2>Notifications Log / নোটিফিকেশন হিস্ট্রি</h2>
            <p className="subtitle">সকল হিসাবের প্রেরিত মেসেজ ও ইমেইল নোটিফিকেশনের রেকর্ডসমূহ</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="হিসাবের নাম, ফোন নম্বর বা ইমেইল দিয়ে খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-chips">
          <button 
            className={`filter-chip ${channelFilter === 'all' ? 'active' : ''}`}
            onClick={() => setChannelFilter('all')}
          >
            সব নোটিফিকেশন ({logs.length})
          </button>
          <button 
            className={`filter-chip ${channelFilter === 'email' ? 'active' : ''}`}
            onClick={() => setChannelFilter('email')}
          >
            <Mail size={14} /> ইমেইল ({logs.filter(l => l.channel === 'email').length})
          </button>
          <button 
            className={`filter-chip ${channelFilter === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setChannelFilter('whatsapp')}
          >
            <MessageSquare size={14} /> হোয়াটসঅ্যাপ ({logs.filter(l => l.channel === 'whatsapp').length})
          </button>
          <button 
            className={`filter-chip ${channelFilter === 'sms' ? 'active' : ''}`}
            onClick={() => setChannelFilter('sms')}
          >
            <PhoneCall size={14} /> SMS ({logs.filter(l => l.channel === 'sms').length})
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="glass-panel loading-box">
          <div className="spinner"></div>
          <p>নোটিফিকেশন তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel empty-logs">
          <Clock size={48} color="#64748b" />
          <h3>কোনো নোটিফিকেশন পাওয়া যায়নি</h3>
          <p>আপনি এখনো কোনো মেসেজ বা ইমেইল নোটিফিকেশন পাঠাননি অথবা ফিল্টারের সাথে মেলেনি।</p>
        </div>
      ) : (
        <div className="logs-grid">
          {filteredLogs.map((log) => (
            <div key={log._id} className="glass-card log-card">
              
              <div className="log-card-header">
                <div className="account-info">
                  <div className="user-badge">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="acc-name">{log.accountName || log.accountId?.name || 'Unknown Account'}</h4>
                    <span className="recipient-contact">
                      {log.recipientPhone || log.recipientEmail || 'No contact specified'}
                    </span>
                  </div>
                </div>

                <div className="channel-badge-wrapper">
                  {log.channel === 'email' && (
                    <span className="channel-tag email"><Mail size={13} /> Email</span>
                  )}
                  {log.channel === 'whatsapp' && (
                    <span className="channel-tag wa"><MessageSquare size={13} /> WhatsApp</span>
                  )}
                  {log.channel === 'sms' && (
                    <span className="channel-tag sms"><PhoneCall size={13} /> SMS</span>
                  )}
                </div>
              </div>

              {log.note && (
                <div className="log-note-box">
                  <strong>📝 বিশেষ নোট:</strong> {log.note}
                </div>
              )}

              <div className="log-message-preview">
                <FileText size={14} className="icon" />
                <p>{log.messageText}</p>
              </div>

              <div className="log-card-footer">
                <div className="status-indicator">
                  <CheckCircle size={14} color="#4ade80" />
                  <span>পাঠানো হয়েছে (Sent)</span>
                </div>
                <span className="timestamp">
                  {new Date(log.createdAt).toLocaleString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notifications;
