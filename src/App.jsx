import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ApiModal from './components/ApiModal';
import Auth from './components/Auth';
import TasksView from './views/TasksView';
import TeamView from './views/TeamView';
import CalendarView from './views/CalendarView';
import CommunicationView from './views/CommunicationView';
import './index.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('senfoni_auth') === 'true';
    });
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    const handleLogin = (user) => {
        setIsAuthenticated(true);
        localStorage.setItem('senfoni_auth', 'true');
        localStorage.setItem('senfoni_user', user);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('senfoni_auth');
        localStorage.removeItem('senfoni_user');
    };

    if (!isAuthenticated) {
        return <Auth onLogin={handleLogin} />;
    }

    const bottomNavItems = [
        { key: 'dashboard', icon: 'bi-grid-1x2', label: 'Ana Sayfa' },
        { key: 'tasks', icon: 'bi-kanban', label: 'Görevler' },
        { key: 'communication', icon: 'bi-chat-square-text', label: 'Sohbet' },
        { key: 'team', icon: 'bi-people', label: 'Ekip' },
        { key: 'calendar', icon: 'bi-calendar3', label: 'Takvim' },
    ];

    return (
        <div className="app-container">
            {/* Mobile: overlay when sidebar open */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Mobile: top header bar */}
            <div className="mobile-topbar">
                <span className="mobile-brand">KARMA</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menü">
                        <i className={`bi bi-${sidebarOpen ? 'x' : 'list'}`}></i>
                    </button>
                </div>
            </div>

            {/* Desktop sidebar / Mobile drawer */}
            <Sidebar
                onOpenApiModal={() => { setIsApiModalOpen(true); setSidebarOpen(false); }}
                onLogout={handleLogout}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                isOpen={sidebarOpen}
            />

            {/* Page content */}
            <div className="page-content">
                {activeTab === 'dashboard' && <Dashboard user={localStorage.getItem('senfoni_user')} />}
                {activeTab === 'tasks' && <TasksView user={localStorage.getItem('senfoni_user')} />}
                {activeTab === 'team' && <TeamView user={localStorage.getItem('senfoni_user')} />}
                {activeTab === 'calendar' && <CalendarView user={localStorage.getItem('senfoni_user')} />}
                {activeTab === 'communication' && <CommunicationView user={localStorage.getItem('senfoni_user')} />}
            </div>

            {/* Mobile: Bottom navigation bar */}
            <nav className="bottom-nav">
                {bottomNavItems.map(item => (
                    <button
                        key={item.key}
                        className={`bottom-nav-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(item.key)}
                    >
                        <i className={`bi ${item.icon}`}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {isApiModalOpen && <ApiModal onClose={() => setIsApiModalOpen(false)} />}
        </div>
    );
}

export default App;

