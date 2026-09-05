import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  StickyNote, 
  Tags, 
  Wallet, 
  Share2, 
  LogOut, 
  Menu, 
  X,
  BookOpen
} from 'lucide-react';

const compressImage = (file, maxWidth = 120, maxHeight = 120, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Sidebar = () => {
  const { user, logout, updateProfileImage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 120, 120, 0.85);
        await updateProfileImage(compressedBase64);
      } catch (err) {
        console.error("Failed to upload profile image:", err);
        alert("Failed to upload profile image.");
      }
    }
  };

  const navItems = [
    { name: 'Accounts / হিসাব', path: '/', icon: <Wallet size={20} /> },
    { name: 'Notes / নোটসমূহ', path: '/notes', icon: <StickyNote size={20} /> },
    { name: 'Categories / ক্যাটেগরি', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Shared With Me', path: '/shared-accounts', icon: <Share2 size={20} /> },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="mobile-top-bar d-md-none">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="mobile-top-brand">
          <BookOpen color="var(--primary)" size={24} />
          <span>Smart Note</span>
        </div>
        <div className="mobile-user-avatar" onClick={handleAvatarClick} title="প্রোফাইল ছবি">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
      </header>

      {/* Backdrop Overlay for mobile drawer */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <BookOpen color="var(--primary)" size={28} />
          <h2>Smart Note</h2>
        </div>

        <div className="sidebar-user">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleProfileImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <div className="user-avatar" onClick={handleAvatarClick} title="প্রোফাইল ছবি পরিবর্তন করুন">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav d-md-none">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <div className="bottom-nav-icon">{item.icon}</div>
            <span className="bottom-nav-label">{item.name.split(' / ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
