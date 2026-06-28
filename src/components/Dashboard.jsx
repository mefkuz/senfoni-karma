import React, { useState, useEffect } from 'react';
import Topbar from './Topbar';
import KanbanBoard from './KanbanBoard';

const Dashboard = ({ user, role }) => {
    const [stats, setStats] = useState({ done: 0, inProgress: 0, late: 0, activeMembers: 0 });

    useEffect(() => {
        Promise.all([
            fetch('/api/tasks').then(r => r.json()),
            fetch('/api/members').then(r => r.json())
        ]).then(([tasksData, membersData]) => {
            const currentMember = membersData.find(m => m.username === user);
            const inAdminTeam = currentMember && currentMember.teamId && currentMember.teamId.isAdminTeam;
            const dbRole = currentMember ? (currentMember.role || '').toLowerCase() : '';
            const isAdmin = role === 'admin' || role === 'moderator' || dbRole === 'admin' || dbRole === 'moderator' || inAdminTeam;

            let visibleTasks = tasksData;
            if (!isAdmin) {
                visibleTasks = tasksData.filter(task => {
                    if (task.assignee && task.assignee.username === user) return true;
                    if (task.teamId && currentMember && currentMember.teamId) {
                        const taskTeamId = task.teamId._id || task.teamId;
                        const myTeamId = currentMember.teamId._id || currentMember.teamId;
                        if (String(taskTeamId) === String(myTeamId)) return true;
                    }
                    return false;
                });
            }

            const done = visibleTasks.filter(t => t.status === 'done').length;
            const inProgress = visibleTasks.filter(t => t.status === 'in-progress').length;
            
            const today = new Date().toISOString().split('T')[0];
            const late = visibleTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today).length;
            
            setStats({ done, inProgress, late, activeMembers: membersData.length });
        }).catch(console.error);
    }, [user, role]);

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

            <KanbanBoard user={user} role={role} />
        </main>
    );
};

export default Dashboard;
