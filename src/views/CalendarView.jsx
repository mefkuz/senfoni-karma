import React from 'react';
import Topbar from '../components/Topbar';

const CalendarView = ({ user, role, activeOperation, onOperationChange }) => {
    return (
        <main className="main-content">
            <Topbar user={user} activeOperation={activeOperation} onOperationChange={onOperationChange} />
            <div className="board-header" style={{ marginTop: '2rem' }}>
                <h2>Takvim</h2>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: '1rem', color: 'var(--text-muted)' }}>
                Görev bitiş tarihlerine göre planlama takvimi buraya gelecek.
            </div>
        </main>
    );
};

export default CalendarView;
