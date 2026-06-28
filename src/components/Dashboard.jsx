import React, { useState, useEffect } from 'react';
import Topbar from './Topbar';
import KanbanBoard from './KanbanBoard';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState({ done: 0, inProgress: 0, late: 0, activeMembers: 0 });

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error);
    }, []);

    return (
        <main className="main-content">
            <Topbar user={user} />

            <div className="dashboard-grid">
                {/* Stats */}
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-check2-circle"></i></div>
                    <div className="stat-info">
                        <h3>Tamamlanan</h3>
                        <p className="stat-num">{stats.done}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
                    <div className="stat-info">
                        <h3>Devam Eden</h3>
                        <p className="stat-num">{stats.inProgress}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-exclamation-circle"></i></div>
                    <div className="stat-info">
                        <h3>Geciken</h3>
                        <p className="stat-num">{stats.late}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-people"></i></div>
                    <div className="stat-info">
                        <h3>Aktif Üye</h3>
                        <p className="stat-num">{stats.activeMembers}</p>
                    </div>
                </div>
            </div>

            <KanbanBoard />
        </main>
    );
};

export default Dashboard;
