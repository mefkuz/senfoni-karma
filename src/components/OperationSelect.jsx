import React, { useState, useEffect } from 'react';

const OperationSelect = ({ onSelect, role, user }) => {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dbRole, setDbRole] = useState(role || '');

    const isChatAdmin = dbRole && (dbRole.toLowerCase() === 'admin' || dbRole.toLowerCase() === 'moderator');



    useEffect(() => {
        Promise.all([
            fetch('/api/operations').then(r => r.json()),
            fetch('/api/members').then(r => r.json())
        ])
        .then(([opsData, membersData]) => {
            setOperations(opsData);
            if (user) {
                const me = membersData.find(m => m.username === user);
                if (me && me.role) setDbRole(me.role);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [role, user]);



    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>Operasyon Seçimi</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Lütfen girmek istediğiniz operasyonu seçin.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
                        {/* Option to view ALL operations if needed, or maybe just specific ones. 
                            Let's add "Tüm Operasyonlar" as a default card */}
                        <div 
                            onClick={() => onSelect('')}
                            style={{ flex: '1 1 250px', maxWidth: '350px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-main))', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <i className="bi bi-globe" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
                            <h3 style={{ margin: 0 }}>Genel Karargah</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tüm Operasyonlar</span>
                        </div>

                        {operations.map((op, idx) => {
                            const opIcons = ['bi-briefcase', 'bi-shield-check', 'bi-hdd-network', 'bi-server', 'bi-terminal', 'bi-bug', 'bi-crosshair', 'bi-radar', 'bi-cpu'];
                            const IconClass = opIcons[idx % opIcons.length];
                            return (
                                <div 
                                    key={op._id}
                                    onClick={() => onSelect(op._id)}
                                    style={{ flex: '1 1 250px', maxWidth: '350px', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px', position: 'relative' }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                >
                                    <i className={`bi ${IconClass}`} style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}></i>
                                    <h3 style={{ margin: 0, textAlign: 'center' }}>{op.name}</h3>
                                </div>
                            );
                        })}

                        {isChatAdmin && (
                            <div 
                                onClick={() => onSelect('ADMIN_PANEL')}
                                style={{ flex: '1 1 250px', maxWidth: '350px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-main))', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px' }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(233,69,96,0.3)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <i className="bi bi-shield-lock" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}></i>
                                <h3 style={{ margin: 0, color: 'var(--accent)' }}>Admin Paneli</h3>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Ekip, Üye ve Platform Yönetimi</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationSelect;
