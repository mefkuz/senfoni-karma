const fs = require('fs');
let content = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

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
