import React, { useState, useEffect } from 'react';

const OperationSelect = ({ onSelect, role }) => {
    const [operations, setOperations] = useState([]);
    const [newOpName, setNewOpName] = useState('');
    const [loading, setLoading] = useState(true);

    const isChatAdmin = role === 'admin' || role === 'moderator';

    useEffect(() => {
        fetch('/api/operations')
            .then(r => r.json())
            .then(data => {
                setOperations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleCreateOperation = async (e) => {
        e.preventDefault();
        if (!newOpName.trim()) return;
        try {
            const res = await fetch('/api/operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newOpName })
            });
            if (res.ok) {
                const created = await res.json();
                setOperations([...operations, created]);
                setNewOpName('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteOperation = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Bu operasyonu silerseniz, operasyona bağlı tüm görevler SİLİNİR! Emin misiniz?')) return;
        try {
            const res = await fetch(`/api/operations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setOperations(operations.filter(o => o._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>Operasyon Seçimi</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Lütfen girmek istediğiniz operasyonu seçin.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {/* Option to view ALL operations if needed, or maybe just specific ones. 
                            Let's add "Tüm Operasyonlar" as a default card */}
                        <div 
                            onClick={() => onSelect('')}
                            style={{ background: 'linear-gradient(145deg, var(--bg-card), var(--bg-main))', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <i className="bi bi-globe" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
                            <h3 style={{ margin: 0 }}>Genel Karargah</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tüm Operasyonlar</span>
                        </div>

                        {operations.map(op => (
                            <div 
                                key={op._id}
                                onClick={() => onSelect(op._id)}
                                style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px', position: 'relative' }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                <i className="bi bi-briefcase" style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}></i>
                                <h3 style={{ margin: 0, textAlign: 'center' }}>{op.name}</h3>
                                
                                {isChatAdmin && (
                                    <button 
                                        onClick={(e) => handleDeleteOperation(op._id, e)}
                                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,0,0,0.1)', border: 'none', color: 'var(--danger)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        title="Operasyonu Sil"
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                )}
                            </div>
                        ))}

                        {isChatAdmin && (
                            <div 
                                onClick={() => onSelect('ADMIN_PANEL')}
                                style={{ background: 'linear-gradient(145deg, var(--bg-card), var(--bg-main))', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '180px' }}
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

                {isChatAdmin && (
                    <div style={{ marginTop: '4rem', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="bi bi-plus-circle text-primary"></i>
                            Yeni Operasyon Oluştur
                        </h3>
                        <form onSubmit={handleCreateOperation} style={{ display: 'flex', gap: '1rem' }}>
                            <input 
                                type="text" 
                                placeholder="Operasyon Adı (Örn: Sızma Testi A)" 
                                value={newOpName} 
                                onChange={e => setNewOpName(e.target.value)} 
                                style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }} 
                                required 
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0 2rem', fontSize: '1rem' }}>Oluştur</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationSelect;
