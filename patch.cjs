const fs = require('fs');
let content = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

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

    return (`;

content = content.replace("    return (", userHandlers);
fs.writeFileSync('src/views/AdminView.jsx', content);
