import React from 'react';

const Sidebar = ({ onOpenApiModal, onLogout, activeTab, setActiveTab, isOpen }) => {
    return (
        <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
            <div className="brand">
                <img src="/logo.png" className="logo" alt="Senfoni Logo" />
                <h2>KARMA</h2>
            </div>
            
            <nav className="nav-menu">
                <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}><i className="bi bi-grid-1x2"></i> Dashboard</a>
                <a href="#" className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tasks'); }}><i className="bi bi-kanban"></i> Görevler</a>
                <a href="#" className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('team'); }}><i className="bi bi-people"></i> Ekip</a>
                <a href="#" className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }}><i className="bi bi-calendar3"></i> Takvim</a>
                <a href="#" className={`nav-item ${activeTab === 'communication' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('communication'); }}><i className="bi bi-chat-square-text"></i> İletişim</a>
                <a href="#" className="nav-item" style={{ color: 'var(--accent)' }} onClick={(e) => { e.preventDefault(); onOpenApiModal(); }}>
                    <i className="bi bi-key"></i> API Bağlantıları
                </a>
            </nav>

            <div className="sidebar-footer">
                <a href="#" className="nav-item"><i className="bi bi-gear"></i> Ayarlar</a>
                <a href="#" className="nav-item logout" onClick={(e) => { e.preventDefault(); onLogout(); }}><i className="bi bi-box-arrow-left"></i> Çıkış Yap</a>
            </div>
        </aside>
    );
};

export default Sidebar;

