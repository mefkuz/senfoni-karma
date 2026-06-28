import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });
            const data = await res.json();
            if (data.valid) {
                localStorage.setItem('senfoni_api_key', apiKey);
                onLogin(data.user, data.role);
            } else {
                setError('Geçersiz API Token.');
            }
        } catch (err) {
            setError('Sunucu bağlantı hatası.');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div style={{ width: '400px', background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logo.png" className="logo" style={{ margin: '0 auto 1rem', width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%' }} alt="Senfoni Logo" />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Senfoni Ağına Bağlan</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Devam etmek için lütfen Senfoni Chat API Token'ınızı girin.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>API Token</label>
                        <input type="text" placeholder="snfn_chat_..." required value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} />
                        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
                    </div>
                    
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                        Sisteme Bağlan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Auth;
