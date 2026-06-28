import React from 'react';
import Topbar from '../components/Topbar';
import KanbanBoard from '../components/KanbanBoard';

const TasksView = ({ user }) => {
    return (
        <main className="main-content">
            <Topbar user={user} />
            <div style={{ marginTop: '2rem' }}>
                <KanbanBoard user={user} />
            </div>
        </main>
    );
};

export default TasksView;
