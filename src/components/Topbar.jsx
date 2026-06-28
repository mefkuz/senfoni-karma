import React, { useState, useEffect } from 'react';

const Topbar = ({ user, activeOperation, onOperationChange }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [operations, setOperations] = useState([]);
    
    useEffect(() => {
        fetch('/api/notifications').then(r => r.json()).then(setNotifs).catch(console.error);
        fetch('/api/operations').then(r => r.json()).then(setOperations).catch(console.error);
        const interval = setInterval(() => {
            fetch('/api/notifications').then(r => r.json()).then(setNotifs).catch(console.error);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const username = user || 'Kullanıcı';
    const initial = username.charAt(0).toUpperCase();

    return (
        <header className="topbar">
            <div className="greeting">
                <h1>Hoş geldin, {username}</h1>
                <p>İşte ekibinin bugünkü durumu.</p>
            </div>
            
            <div className="topbar-actions">
                {operations.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <i className="bi bi-briefcase text-muted"></i>
                        <select 
                            value={activeOperation || ''} 
                            onChange={(e) => onOperationChange && onOperationChange(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            <option value="">Tüm Operasyonlar</option>
                            {operations.map(op => (
                                <option key={op._id} value={op._id}>{op.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input type="text" placeholder="Görev veya üye ara..." />
                </div>
                <div style={{ position: 'relative' }}>
                    <button className="btn-icon" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                        <i className="bi bi-bell"></i>
                        {notifs.length > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--danger)', width: '8px', height: '8px', borderRadius: '50%' }}></span>}
                    </button>
                    {isNotifOpen && (
                        <div style={{ position: 'absolute', top: '120%', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '300px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', textAlign: 'left', color: 'var(--text-main)', maxHeight: '300px', overflowY: 'auto' }}>
                            <h4 style={{ margin: 0, padding: '1rem', borderBottom: '1px solid var(--border)' }}>Bildirimler</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {notifs.length === 0 ? (
                                    <li style={{ padding: '1rem', color: 'var(--text-muted)' }}>Yeni bildirim yok.</li>
                                ) : (
                                    notifs.map(n => (
                                        <li key={n._id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                            {n.message}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {new Date(n.createdAt).toLocaleTimeString()}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="profile-pic" style={{ cursor: 'pointer', position: 'relative' }} title="Profil" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    {initial}
                    {isProfileOpen && (
                        <div style={{ position: 'absolute', top: '120%', right: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', width: '200px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', textAlign: 'left', color: 'var(--text-main)' }}>
                            <h4 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{username}</h4>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Senfoni Karma yetkilisi. Tüm projeleri görüntüleme ve görev atama yetkisine sahipsiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
