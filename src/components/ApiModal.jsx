import React, { useState, useEffect } from 'react';

const ApiModal = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const savedKey = localStorage.getItem('senfoni_chat_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('senfoni_chat_api_key', apiKey.trim());
            localStorage.setItem('senfoni_api_key', apiKey.trim());
        } else {
            localStorage.removeItem('senfoni_chat_api_key');
            localStorage.removeItem('senfoni_api_key');
        }
        onClose();
    };

    return (
        <>
            <div className="modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s forwards' }}>
                <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '400px', textAlign: 'center', position: 'relative' }}>
                    <i className="bi bi-link-45deg" style={{ fontSize: '3rem', color: 'var(--accent)' }}></i>
                    <h3 style={{ margin: '1rem 0' }}>Senfoni Chat'e Bağlan</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Senfoni Karma'yı mevcut Senfoni Chat API anahtarınız ile entegre edin. Bu, "İletişim" sekmesinde otomatik giriş yapmanızı sağlar.
                    </p>
                    <input 
                        type="text" 
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="API Key giriniz (Örn: snfn_chat_...)" 
                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', outline: 'none' }} 
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Kaydet</button>
                    </div>
                    <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', fontSize: '1.5rem', color: 'var(--text-main)', cursor: 'pointer' }} onClick={onClose}>
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default ApiModal;
