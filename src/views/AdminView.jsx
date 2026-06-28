import React, { useState, useEffect } from 'react';

const AdminView = ({ user, role, onExit }) => {
    const [operations, setOperations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [newOpName, setNewOpName] = useState('');
    const [newOpDefaultTeam, setNewOpDefaultTeam] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [newIsAdminTeam, setNewIsAdminTeam] = useState(false);

    useEffect(() => {
        fetch('/api/operations').then(r => r.json()).then(setOperations);
        fetch('/api/teams').then(r => r.json()).then(setTeams);
    }, []);

    const handleCreateOperation = async (e) => {
        if (e) e.preventDefault();
        if (!newOpName.trim()) return;
        try {
            const res = await fetch('/api/operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newOpName, defaultTeamId: newOpDefaultTeam || null })
            });
            if (res.ok) {
                const created = await res.json();
                setOperations([...operations, created]);
                setNewOpName('');
                setNewOpDefaultTeam('');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteOperation = async (id) => {
        if (!window.confirm('Bu operasyonu silerseniz, bağlı tüm görevler silinir. Emin misiniz?')) return;
        try {
            const res = await fetch(`/api/operations/${id}`, { method: 'DELETE' });
            if (res.ok) setOperations(operations.filter(o => o._id !== id));
        } catch (err) { console.error(err); }
    };

    const handleUpdateOperationDefaultTeam = async (opId, teamId) => {
        try {
            const op = operations.find(o => o._id === opId);
            const res = await fetch(`/api/operations/${opId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...op, defaultTeamId: teamId || null })
            });
            if (res.ok) {
                const updated = await res.json();
                setOperations(operations.map(o => o._id === opId ? updated : o));
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateTeam = async (e) => {
        if (e) e.preventDefault();
        if (!newTeamName.trim()) return;
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTeamName, isAdminTeam: newIsAdminTeam })
            });
            if (res.ok) {
                const created = await res.json();
                setTeams([...teams, created]);
                setNewTeamName('');
                setNewIsAdminTeam(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteTeam = async (id) => {
        if (!window.confirm('Bu takımı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
            if (res.ok) setTeams(teams.filter(t => t._id !== id));
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <i className="bi bi-shield-lock" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}></i>
                        <div>
                            <h1 style={{ margin: 0 }}>Sistem Yönetim Paneli</h1>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Senfoni Karma Platform Ayarları</p>
                        </div>
                    </div>
                    <button onClick={onExit} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                        <i className="bi bi-box-arrow-left"></i> Panele Dön
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '3rem' }}>
                    {/* Operations Management */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="bi bi-briefcase text-primary"></i> Operasyon Yönetimi</h2>
                        </div>
                        
                        <form onSubmit={handleCreateOperation} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                            <input type="text" placeholder="Yeni Operasyon Adı" value={newOpName} onChange={e => setNewOpName(e.target.value)} style={{ flex: 1, padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} required />
                            <select value={newOpDefaultTeam} onChange={e => setNewOpDefaultTeam(e.target.value)} style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                <option value="" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>Varsayılan Ekip (İsteğe Bağlı)</option>
                                {teams.map(t => <option key={t._id} value={t._id} style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>{t.name}</option>)}
                            </select>
                            <button type="submit" className="btn-primary"><i className="bi bi-plus"></i> Operasyon Oluştur</button>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {operations.map(op => (
                                <div key={op._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'relative' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {op.name}
                                    </h3>
                                    <button onClick={() => handleDeleteOperation(op._id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                                    
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Oluşturulma: {new Date(op.createdAt).toLocaleDateString()}
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Varsayılan Ekip:</span>
                                        <select 
                                            value={op.defaultTeamId ? op.defaultTeamId._id : ''} 
                                            onChange={(e) => handleUpdateOperationDefaultTeam(op._id, e.target.value)}
                                            style={{ flex: 1, padding: '0.3rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                                        >
                                            <option value="" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>Yok</option>
                                            {teams.map(t => <option key={t._id} value={t._id} style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Team Management */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="bi bi-people text-accent"></i> Ekip Yönetimi</h2>
                        </div>

                        <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                            <input type="text" placeholder="Yeni Takım Adı" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ flex: 1, padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} required />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <input type="checkbox" checked={newIsAdminTeam} onChange={e => setNewIsAdminTeam(e.target.checked)} />
                                Yönetici Ekibi (Tam Yetki)
                            </label>
                            <button type="submit" className="btn-primary"><i className="bi bi-plus"></i> Takım Oluştur</button>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {teams.map(team => (
                                <div key={team._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{team.name}</h3>
                                            {team.isAdminTeam && <span className="tag" style={{ background: 'var(--danger)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>Yönetici Ekibi</span>}
                                        </div>
                                        <button onClick={() => handleDeleteTeam(team._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
