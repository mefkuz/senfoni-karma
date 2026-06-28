import React from 'react';
import Topbar from '../components/Topbar';
import KanbanBoard from '../components/KanbanBoard';

const TasksView = ({ user, role, activeOperation, onOperationChange }) => {
    return (
        <main className="main-content">
            <Topbar user={user} activeOperation={activeOperation} onOperationChange={onOperationChange} />
            <div style={{ marginTop: '2rem' }}>
                <KanbanBoard user={user} role={role} />
            </div>
        </main>
    );
};

export default TasksView;
