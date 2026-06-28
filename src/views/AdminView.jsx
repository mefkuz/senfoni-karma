import React, { useState, useEffect } from 'react';

const AdminView = ({ user, role, onExit }) => {
    const [operations, setOperations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [newOpName, setNewOpName] = useState('');
    const [newOpDefaultTeam, setNewOpDefaultTeam] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [newIsAdminTeam, setNewIsAdminTeam] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [editIsAdminTeam, setEditIsAdminTeam] = useState(false);
    const [chatUsers, setChatUsers] = useState([]);
    const [karmaMembers, setKarmaMembers] = useState([]);
    const [newChatUser, setNewChatUser] = useState('');

    useEffect(() => {
        fetch('/api/operations').then(r => r.json()).then(setOperations);
        fetch('/api/teams').then(r => r.json()).then(setTeams);
        fetch('/api/members').then(r => r.json()).then(setKarmaMembers);
        
        const apiKey = localStorage.getItem('senfoni_api_key') || localStorage.getItem('senfoni_chat_api_key');
        if (apiKey) {
            fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-User': localStorage.getItem('senfoni_user') },
                body: JSON.stringify({ action: 'list-users' })
            }).then(r => r.json()).then(data => {
                if (data.users) setChatUsers(data.users);
            }).catch(console.error);
        }
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

    const handleUpdateTeam = async (e, id) => {
        e.preventDefault();
        if (!editTeamName.trim()) return;
        try {
            const res = await fetch(`/api/teams/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editTeamName, isAdminTeam: editIsAdminTeam })
            });
            if (res.ok) {
                const updated = await res.json();
                setTeams(teams.map(t => t._id === id ? updated : t));
                setEditingTeamId(null);
            }
        } catch (err) { console.error(err); }
    };


    const handleAssignMember = async (memberId, teamId) => {
        try {
            const res = await fetch(`/api/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: teamId || null })
            });
            if (res.ok) {
                const updated = await res.json();
                setKarmaMembers(karmaMembers.map(m => m._id === memberId ? { ...m, teamId: updated.teamId } : m));
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateChatUser = async (e) => {
        e.preventDefault();
        if (!newChatUser.trim()) return;
        const apiKey = localStorage.getItem('senfoni_api_key') || localStorage.getItem('senfoni_chat_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-User': localStorage.getItem('senfoni_user') },
                body: JSON.stringify({ action: 'create-user', name: newChatUser.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setChatUsers([...chatUsers, { username: newChatUser.trim(), role: 'user', apiKey: data.apiKey, createdAt: new Date() }]);
                setNewChatUser('');
                alert(`Kullanıcı oluşturuldu! API Key: ${data.apiKey}`);
            } else {
                alert('Hata: ' + (data.error || 'Bilinmiyor'));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteChatUser = async (username) => {
        if (!window.confirm(`[${username}] kullanıcısını silmek istediğinize emin misiniz? Tüm erişimi iptal edilecek.`)) return;
        const apiKey = localStorage.getItem('senfoni_api_key') || localStorage.getItem('senfoni_chat_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-User': localStorage.getItem('senfoni_user') },
                body: JSON.stringify({ action: 'delete-user', name: username })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setChatUsers(chatUsers.filter(u => u.username !== username));
                setKarmaMembers(karmaMembers.filter(m => m.username !== username));
            } else {
                alert('Hata: ' + (data.error || 'Bilinmiyor'));
            }
        } catch (err) { console.error(err); }
    };

    const handleGenApiKey = async (username) => {
        if (!window.confirm(`[${username}] için yeni bir API anahtarı oluşturulacak. Eski anahtar geçersiz olacak. Devam edilsin mi?`)) return;
        const apiKey = localStorage.getItem('senfoni_api_key') || localStorage.getItem('senfoni_chat_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-User': localStorage.getItem('senfoni_user') },
                body: JSON.stringify({ action: 'gen-api', name: username })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setChatUsers(chatUsers.map(u => u.username === username ? { ...u, apiKey: data.apiKey } : u));
                alert(`Yeni API Key oluşturuldu: ${data.apiKey}`);
            } else {
                alert('Hata: ' + (data.error || 'Bilinmiyor'));
            }
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
                                    {editingTeamId === team._id ? (
                                        <form onSubmit={(e) => handleUpdateTeam(e, team._id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <input type="text" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} required />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                                <input type="checkbox" checked={editIsAdminTeam} onChange={e => setEditIsAdminTeam(e.target.checked)} />
                                                Yönetici Ekibi
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button type="submit" className="btn-primary" style={{ flex: 1 }}><i className="bi bi-check"></i> Kaydet</button>
                                                <button type="button" onClick={() => setEditingTeamId(null)} className="btn-primary" style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>İptal</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{team.name}</h3>
                                                {team.isAdminTeam && <span className="tag" style={{ background: 'var(--danger)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', display: 'inline-block' }}>Yönetici Ekibi</span>}
                                                <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                                                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Üyeler:</div>
                                                    {karmaMembers.filter(m => m.teamId && (m.teamId._id === team._id || m.teamId === team._id)).length > 0 ? (
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                            {karmaMembers.filter(m => m.teamId && (m.teamId._id === team._id || m.teamId === team._id)).map(m => (
                                                                <li key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <div style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                                        {m.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span>{m.username}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Üye yok</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <button onClick={() => { setEditingTeamId(team._id); setEditTeamName(team.name); setEditIsAdminTeam(team.isAdminTeam || false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '0.5rem' }}><i className="bi bi-pencil"></i></button>
                                                <button onClick={() => handleDeleteTeam(team._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* User & API Key Management */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="bi bi-person-badge text-warning"></i> Kullanıcı ve API Yönetimi</h2>
                        </div>

                        <form onSubmit={handleCreateChatUser} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                            <input type="text" placeholder="Yeni Kullanıcı Adı" value={newChatUser} onChange={e => setNewChatUser(e.target.value)} style={{ flex: 1, padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} required />
                            <button type="submit" className="btn-primary"><i className="bi bi-person-plus"></i> Kullanıcı Ekle</button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {chatUsers.map(chatUser => {
                                const kMember = karmaMembers.find(m => m.username === chatUser.username);
                                return (
                                    <div key={chatUser.username} style={{ background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px' }}>
                                            <div style={{ width: '40px', height: '40px', background: chatUser.role === 'admin' ? 'var(--danger)' : 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                {chatUser.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {chatUser.username}
                                                    {chatUser.role === 'admin' && <span className="tag" style={{ background: 'var(--danger)', fontSize: '0.7rem' }}>Admin</span>}
                                                </h4>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    API Key: <code style={{ background: 'var(--bg-main)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{chatUser.apiKey}</code>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '250px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Karma Ekibi:</span>
                                                <select 
                                                    value={kMember && kMember.teamId ? (kMember.teamId._id || kMember.teamId) : ''} 
                                                    onChange={(e) => handleAssignMember(kMember._id, e.target.value)}
                                                    style={{ flex: 1, padding: '0.3rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%' }}
                                                    disabled={!kMember}
                                                >
                                                    <option value="" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>Atanmamış (Karma'ya giriş yapmalı)</option>
                                                    {kMember && <option value="" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>- Ekip Yok -</option>}
                                                    {teams.map(t => <option key={t._id} value={t._id} style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleGenApiKey(chatUser.username)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem' }} title="Yeni API Key Oluştur"><i className="bi bi-arrow-clockwise"></i></button>
                                                <button onClick={() => handleDeleteChatUser(chatUser.username)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.5rem' }} title="Kullanıcıyı Sil"><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default AdminView;
