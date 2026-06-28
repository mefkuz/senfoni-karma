import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';

const TeamView = ({ user, role }) => {
    const [members, setMembers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [newIsAdminTeam, setNewIsAdminTeam] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editTeamName, setEditTeamName] = useState('');
    const [editIsAdminTeam, setEditIsAdminTeam] = useState(false);

    useEffect(() => {
        fetch('/api/members').then(r => r.json()).then(setMembers);
        fetch('/api/teams').then(r => r.json()).then(setTeams);
    }, []);

    const currentMember = members.find(m => m.username === user);
    const inAdminTeam = currentMember && currentMember.teamId && currentMember.teamId.isAdminTeam;
    const dbRole = currentMember ? (currentMember.role || '').toLowerCase() : '';
    const isAdmin = role === 'admin' || role === 'moderator' || dbRole === 'admin' || dbRole === 'moderator' || inAdminTeam;

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
        } catch (err) {
            console.error(err);
        }
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
                setMembers(members.map(m => m._id === memberId ? { ...m, teamId: updated.teamId } : m));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTeam = async (id) => {
        if (!window.confirm('Bu takımı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTeams(teams.filter(t => t._id !== id));
                setMembers(members.map(m => m.teamId && m.teamId._id === id ? { ...m, teamId: null } : m));
            }
        } catch (err) {
            console.error(err);
        }
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
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main className="main-content">
            <Topbar user={user} />
            <div className="board-header" style={{ marginTop: '2rem' }}>
                <h2>Ekip & Takımlar</h2>
                {isAdmin && (
                    <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="text" placeholder="Yeni Takım Adı" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }} required />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                            <input type="checkbox" checked={newIsAdminTeam} onChange={e => setNewIsAdminTeam(e.target.checked)} />
                            Yönetici Ekibi
                        </label>
                        <button type="submit" className="btn-primary"><i className="bi bi-plus"></i> Takım Oluştur</button>
                    </form>
                )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                {teams.map(team => (
                    <div key={team._id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        {editingTeamId === team._id ? (
                            <form onSubmit={(e) => handleUpdateTeam(e, team._id)} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <input type="text" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} required />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                    <input type="checkbox" checked={editIsAdminTeam} onChange={e => setEditIsAdminTeam(e.target.checked)} />
                                    Yönetici
                                </label>
                                <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}><i className="bi bi-check"></i></button>
                                <button type="button" onClick={() => setEditingTeamId(null)} className="btn-primary" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}><i className="bi bi-x"></i></button>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {team.name}
                                    {team.isAdminTeam && <span className="tag" style={{ background: 'var(--danger)', fontSize: '0.7rem' }}>Yönetici Ekibi</span>}
                                </h3>
                                {isAdmin && (
                                    <div>
                                        <button onClick={() => { setEditingTeamId(team._id); setEditTeamName(team.name); setEditIsAdminTeam(team.isAdminTeam || false); }} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', marginRight: '0.5rem' }}><i className="bi bi-pencil"></i></button>
                                        <button onClick={() => handleDeleteTeam(team._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                                    </div>
                                )}
                            </div>
                        )}
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {members.filter(m => m.teamId && m.teamId._id === team._id).map(member => (
                                <li key={member._id} style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{member.username}</span>
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => handleAssignMember(member._id, null)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Takımdan Çıkar"><i className="bi bi-x-circle"></i></button>
                                    )}
                                </li>
                            ))}
                            {members.filter(m => m.teamId && m.teamId._id === team._id).length === 0 && (
                                <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bu takımda henüz üye yok.</li>
                            )}
                        </ul>
                    </div>
                ))}
                
                {/* Independent Members */}
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Atanmamış Üyeler</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {members.filter(m => !m.teamId).map(member => (
                            <li key={member._id} style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {member.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{member.username}</span>
                                </div>
                                {isAdmin && (
                                    <select onChange={(e) => handleAssignMember(member._id, e.target.value)} defaultValue="" style={{ padding: '0.2rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                        <option value="" disabled>Takıma Ata...</option>
                                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
};

export default TeamView;
