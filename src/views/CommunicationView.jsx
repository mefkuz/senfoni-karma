import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';

const CommunicationView = ({ user, activeOperation, onOperationChange }) => {
    const [chatUrl, setChatUrl] = useState('https://chat.senfoni.info/');

    useEffect(() => {
        const savedKey = localStorage.getItem('senfoni_chat_api_key');
        if (savedKey) {
            setChatUrl(`https://chat.senfoni.info/?key=${encodeURIComponent(savedKey)}`);
        }
    }, []);

    return (
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0', boxSizing: 'border-box' }}>
            <div style={{ padding: '1rem', paddingBottom: '0' }}>
                <Topbar user={user} activeOperation={activeOperation} onOperationChange={onOperationChange} />
            </div>
            <div style={{ flex: 1, marginTop: '1rem', width: '100%', height: '100%' }}>
                <iframe 
                    src={chatUrl} 
                    title="Senfoni Chat"
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 'var(--radius) 0 0 0' }}
                    allow="microphone; camera; display-capture; clipboard-read; clipboard-write; notifications"
                />
            </div>
        </main>
    );
};

export default CommunicationView;

