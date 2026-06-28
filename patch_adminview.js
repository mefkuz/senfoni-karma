const fs = require('fs');
let content = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

// Insert new states
content = content.replace(
    "const [editIsAdminTeam, setEditIsAdminTeam] = useState(false);",
    "const [editIsAdminTeam, setEditIsAdminTeam] = useState(false);\n    const [chatUsers, setChatUsers] = useState([]);\n    const [karmaMembers, setKarmaMembers] = useState([]);\n    const [newChatUser, setNewChatUser] = useState('');"
);

// Insert fetch logic
content = content.replace(
    "fetch('/api/teams').then(r => r.json()).then(setTeams);",
    `fetch('/api/teams').then(r => r.json()).then(setTeams);
        fetch('/api/members').then(r => r.json()).then(setKarmaMembers);
        
        const apiKey = localStorage.getItem('senfoni_api_key');
        if (apiKey) {
            fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ action: 'list-users' })
            }).then(r => r.json()).then(data => {
                if (data.users) setChatUsers(data.users);
            }).catch(console.error);
        }`
);

// Insert User Management Handlers
const userHandlers = `
    const handleAssignMember = async (memberId, teamId) => {
        try {
            const res = await fetch(\`/api/members/\${memberId}\`, {
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
        const apiKey = localStorage.getItem('senfoni_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ action: 'create-user', name: newChatUser.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setChatUsers([...chatUsers, { username: newChatUser.trim(), role: 'user', apiKey: data.apiKey, createdAt: new Date() }]);
                setNewChatUser('');
                alert(\`Kullanıcı oluşturuldu! API Key: \${data.apiKey}\`);
            } else {
                alert('Hata: ' + (data.error || 'Bilinmiyor'));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteChatUser = async (username) => {
        if (!window.confirm(\`[\${username}] kullanıcısını silmek istediğinize emin misiniz? Tüm erişimi iptal edilecek.\`)) return;
        const apiKey = localStorage.getItem('senfoni_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
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
        if (!window.confirm(\`[\${username}] için yeni bir API anahtarı oluşturulacak. Eski anahtar geçersiz olacak. Devam edilsin mi?\`)) return;
        const apiKey = localStorage.getItem('senfoni_api_key');
        try {
            const res = await fetch('/api/chat-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ action: 'gen-api', name: username })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setChatUsers(chatUsers.map(u => u.username === username ? { ...u, apiKey: data.apiKey } : u));
                alert(\`Yeni API Key oluşturuldu: \${data.apiKey}\`);
            } else {
                alert('Hata: ' + (data.error || 'Bilinmiyor'));
            }
        } catch (err) { console.error(err); }
    };
`;

content = content.replace("const handleUpdateTeam = async", userHandlers + "\n    const handleUpdateTeam = async");

// Insert User Management UI
const userManagementUI = `
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
`;

content = content.replace("</section>\n                </div>\n            </div>\n        </div>", "</section>\n" + userManagementUI + "\n                </div>\n            </div>\n        </div>");

fs.writeFileSync('src/views/AdminView.jsx', content);
