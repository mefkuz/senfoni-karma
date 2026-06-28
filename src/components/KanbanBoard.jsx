import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const KanbanBoard = ({ user, role, activeOperation }) => {
    const [tasks, setTasks] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [members, setMembers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [operations, setOperations] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', description: '', urgency: 'normal', status: 'todo', assignType: '', assignId: '', attachment: '', report: '', dueDate: '' });
    const [selectedTask, setSelectedTask] = useState(null);
    const [completingTask, setCompletingTask] = useState(null);
    const [reportText, setReportText] = useState('');
    const [reportFile, setReportFile] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const urgencyOrder = { high: 1, normal: 2, low: 3 };

    useEffect(() => {
        const fetchTasks = () => {
            fetch('/api/tasks')
                .then(res => res.json())
                .then(data => {
                    // Update state carefully to avoid cursor jumping if someone is dragging
                    setTasks(prev => {
                        const sorted = data.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
                        // If completely identical lengths, maybe assume same, but let's just replace
                        return sorted;
                    });
                })
                .catch(console.error);
        };
        fetchTasks();
        const intervalId = setInterval(fetchTasks, 5000); // Auto-refresh every 5s

        fetch('/api/members')
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(console.error);

        fetch('/api/teams')
            .then(res => res.json())
            .then(data => setTeams(data))
            .catch(console.error);

        fetch('/api/operations')
            .then(res => res.json())
            .then(data => setOperations(data))
            .catch(console.error);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsAdding(false);
                setEditingTaskId(null);
                setNewTask({ title: '', description: '', urgency: 'normal', status: 'todo', assignType: '', assignId: '', attachment: '', report: '', dueDate: '' });
            }
            if (e.key === 'Escape') {
                setSelectedTask(null);
                setCompletingTask(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        const socket = io('/', { path: '/socket.io' });
        
        socket.on('task_update', (data) => {
            if (data.action === 'create') {
                setTasks(prev => [...prev, data.task].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]));
            } else if (data.action === 'update') {
                setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t).sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]));
            } else if (data.action === 'delete') {
                setTasks(prev => prev.filter(t => t._id !== data.taskId));
            }
        });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(intervalId);
            socket.disconnect();
        };
    }, []);

    const currentMember = members.find(m => m.username === user);
    const inAdminTeam = currentMember && currentMember.teamId && currentMember.teamId.isAdminTeam;
    const dbRole = currentMember ? (currentMember.role || '').toLowerCase() : '';
    const isAdmin = role === 'admin' || role === 'moderator' || dbRole === 'admin' || dbRole === 'moderator' || inAdminTeam;

    const canMoveTask = (task) => {
        if (!task) return false;
        if (isAdmin) return true;
        if (!currentMember) return false;
        
        if (task.assignee && task.assignee.username === user) return true;
        
        const taskTeamId = task.teamId ? (task.teamId._id || task.teamId) : null;
        const myTeamId = currentMember.teamId ? (currentMember.teamId._id || currentMember.teamId) : null;
        if (taskTeamId && myTeamId && String(taskTeamId) === String(myTeamId)) return true;
        
        return false;
    };

    const onDragStart = (e, id) => {
        const task = tasks.find(t => t._id === id);
        if (!canMoveTask(task)) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('id', id);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = async (e, status) => {
        const id = e.dataTransfer.getData('id');
        if (!id) return;
        const task = tasks.find(t => t._id === id);
        if (!task || task.status === status || !canMoveTask(task)) return;

        // Only admins can move tasks to 'done'
        if (status === 'done') {
            if (!isAdmin) {
                alert('Sadece yöneticiler görevleri onaylayıp "Tamamlandı" olarak işaretleyebilir.');
                return;
            }
            // Admins can just drop to done directly
            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...task, status: 'done' })
                });
                const updated = await res.json();
                setTasks(tasks.map(t => t._id === id ? updated : t));
            } catch (err) {
                console.error('Drag drop error:', err);
            }
            return;
        }

        // When moving to 'review', ask for a report
        if (status === 'review') {
            setCompletingTask(task);
            setReportText(task.report || '');
            setReportFile(task.attachment || '');
            return;
        }

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': user },
                body: JSON.stringify({ ...task, status })
            });
            const updated = await res.json();
            setTasks(tasks.map(t => t._id === id ? updated : t));
        } catch (err) {
            console.error('Drag drop error:', err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newTask.title,
                description: newTask.description,
                urgency: newTask.urgency,
                status: newTask.status,
                attachment: newTask.attachment,
                dueDate: newTask.dueDate,
                assignee: newTask.assignType === 'member' ? newTask.assignId : null,
                teamId: newTask.assignType === 'team' ? newTask.assignId : null,
                operationId: activeOperation || null
            };

            if (editingTaskId) {
                const res = await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-user': user },
                    body: JSON.stringify(payload)
                });
                const updatedTask = await res.json();
                setTasks(tasks.map(t => t._id === editingTaskId ? updatedTask : t));
                setEditingTaskId(null);
            } else {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user': user },
                    body: JSON.stringify(payload)
                });
                const savedTask = await res.json();
                setTasks([...tasks, savedTask].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]));
            }
            
            setIsAdding(false);
            setNewTask({ title: '', description: '', urgency: 'normal', status: 'todo', assignType: '', assignId: '', attachment: '', report: '', dueDate: '' });
        } catch (err) {
            console.error('Save task error:', err);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        setTasks(tasks.filter(t => t._id !== id));
    };

    const handleEditTask = (task) => {
        setEditingTaskId(task._id);
        setNewTask({ 
            title: task.title, 
            description: task.description, 
            urgency: task.urgency, 
            status: task.status, 
            assignType: task.assignee ? 'member' : (task.teamId ? 'team' : ''), 
            assignId: task.assignee ? task.assignee._id : (task.teamId ? task.teamId._id : ''), 
            attachment: task.attachment || '',
            report: task.report || '',
            dueDate: task.dueDate || ''
        });
        setIsAdding(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        setIsUploading(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setReportFile(data.url);
            }
        } catch (err) {
            console.error('Upload error', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCompleteTask = async (e) => {
        e.preventDefault();
        if (!reportText.trim()) return;
        
        const taskToComplete = completingTask || selectedTask;
        
        try {
            const res = await fetch(`/api/tasks/${taskToComplete._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user': user },
                body: JSON.stringify({ ...taskToComplete, status: 'review', report: reportText, attachment: reportFile })
            });
            const updated = await res.json();
            setTasks(tasks.map(t => t._id === taskToComplete._id ? updated : t));
            setSelectedTask(null);
            setCompletingTask(null);
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        { id: 'todo', title: 'Yapılacaklar' },
        { id: 'in-progress', title: 'Devam Eden' },
        { id: 'review', title: 'İncelemede' },
        { id: 'done', title: 'Tamamlanan' }
    ];

    let visibleTasks = tasks;
    if (activeOperation) {
        visibleTasks = visibleTasks.filter(t => t.operationId && (t.operationId._id === activeOperation || t.operationId === activeOperation));
    }
    if (!isAdmin) {
        visibleTasks = visibleTasks.filter(task => {
            if (task.assignee && task.assignee.username === user) return true;
            if (task.teamId && currentMember && currentMember.teamId) {
                const taskTeamId = task.teamId._id || task.teamId;
                const myTeamId = currentMember.teamId._id || currentMember.teamId;
                if (String(taskTeamId) === String(myTeamId)) return true;
            }
            return false;
        });
    }

    return (
        <div className="kanban-wrapper">
            <div className="board-header">
                <h2>Görev Yönetimi</h2>
                {isAdmin && <button className="btn-primary" onClick={() => {
                    let defaultAssignType = '';
                    let defaultAssignId = '';
                    if (activeOperation) {
                        const op = operations.find(o => o._id === activeOperation);
                        if (op && op.defaultTeamId) {
                            defaultAssignType = 'team';
                            defaultAssignId = op.defaultTeamId._id ? op.defaultTeamId._id : op.defaultTeamId;
                        }
                    }
                    setNewTask({...newTask, assignType: defaultAssignType, assignId: defaultAssignId});
                    setIsAdding(true);
                }}><i className="bi bi-plus-lg"></i> Yeni Görev</button>}
            </div>
            
            <div className="kanban-board">
                {columns.map(col => (
                    <div 
                        key={col.id} 
                        className="kanban-col" 
                        onDragOver={onDragOver} 
                        onDrop={(e) => onDrop(e, col.id)}
                    >
                        <div className="col-header">
                            <h3>{col.title} <span className="badge">{visibleTasks.filter(t => t.status === col.id).length}</span></h3>
                        </div>
                        {visibleTasks.filter(t => t.status === col.id)
                            .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
                            .map(task => (
                            <div 
                                key={task._id} 
                                className={`task-card ${task.status === 'done' ? 'done' : ''}`} 
                                draggable 
                                onDragStart={(e) => onDragStart(e, task._id)}
                                onClick={(e) => {
                                    if (e.target.closest('.action-btns')) return;
                                    setSelectedTask(task);
                                    setReportText(task.report || '');
                                    setReportFile(task.attachment || '');
                                }}
                                style={{ cursor: 'grab', background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}
                            >
                                <div className="task-tags" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`tag tag-${task.urgency}`}>{task.urgency === 'high' ? 'Acil' : task.urgency === 'low' ? 'Düşük' : 'Normal'}</span>
                                    {isAdmin && (
                                        <div className="action-btns" style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleEditTask(task)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><i className="bi bi-pencil"></i></button>
                                            <button onClick={() => handleDeleteTask(task._id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                                        </div>
                                    )}
                                </div>
                                <h4>{task.title}</h4>
                                <p>{task.description}</p>
                                {task.attachment && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        <i className="bi bi-paperclip"></i> <a href={task.attachment} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Ekli Dosya</a>
                                    </div>
                                )}
                                {task.dueDate && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <i className="bi bi-calendar-event"></i> Teslim: {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                                {task.assignee && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                                            {task.assignee.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{task.assignee.username}</span>
                                    </div>
                                )}
                                {task.teamId && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <div style={{ width: '20px', height: '20px', background: '#8e44ad', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            <i className="bi bi-people-fill" style={{ fontSize: '10px' }}></i>
                                        </div>
                                        <span>Takım: {task.teamId.name}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>{editingTaskId ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</h3>
                        <form onSubmit={handleAddTask}>
                            <input type="text" placeholder="Görev Başlığı" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                            <textarea placeholder="Açıklama" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', minHeight: '100px' }}></textarea>
                            <select value={newTask.urgency} onChange={e => setNewTask({...newTask, urgency: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                                <option value="high">Acil</option>
                                <option value="normal">Normal</option>
                                <option value="low">Düşük</option>
                            </select>
                            <select value={`${newTask.assignType}_${newTask.assignId}`} onChange={e => {
                                const val = e.target.value;
                                if (!val || val === '_') setNewTask({...newTask, assignType: '', assignId: ''});
                                else {
                                    const [type, id] = val.split('_');
                                    setNewTask({...newTask, assignType: type, assignId: id});
                                }
                            }} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                                <option value="_">Atama Yok</option>
                                <optgroup label="Üyeler">
                                    {members.map(m => <option key={m._id} value={`member_${m._id}`}>{m.username}</option>)}
                                </optgroup>
                                <optgroup label="Takımlar">
                                    {teams.map(t => <option key={t._id} value={`team_${t._id}`}>{t.name}</option>)}
                                </optgroup>
                            </select>
                            <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} title="Bitiş Tarihi" />
                            <input type="text" placeholder="Dosya / Link Ekle (İsteğe Bağlı)" value={newTask.attachment} onChange={e => setNewTask({...newTask, attachment: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingTaskId ? 'Kaydet' : 'Ekle'}</button>
                                <button type="button" className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }} onClick={() => { setIsAdding(false); setEditingTaskId(null); setNewTask({ title: '', description: '', urgency: 'normal', status: 'todo', assignType: '', assignId: '', attachment: '', report: '', dueDate: '' }); }}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(selectedTask || completingTask) && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '500px', border: '1px solid var(--border)', color: 'var(--text-main)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{completingTask ? 'Görevi Tamamla' : 'Görev Detayları'}</h3>
                            <button onClick={() => { setSelectedTask(null); setCompletingTask(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="bi bi-x-lg"></i></button>
                        </div>
                        <h2 style={{ marginBottom: '0.5rem' }}>{(completingTask || selectedTask).title}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{(completingTask || selectedTask).description}</p>
                        
                        {(((selectedTask && selectedTask.status === 'done') || !canMoveTask(selectedTask || completingTask)) && !completingTask) ? (
                            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                {selectedTask.status === 'done' ? (
                                    <>
                                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}><i className="bi bi-check-circle-fill"></i> Tamamlandı Raporu</h4>
                                        {selectedTask.report && <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{selectedTask.report}</p>}
                                        {selectedTask.attachment && (
                                            <a href={selectedTask.attachment} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <i className="bi bi-paperclip"></i> Ekli Dosya / Görsel
                                            </a>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}><i className="bi bi-lock-fill"></i> Bu görev üzerinde işlem yapma yetkiniz yok.</p>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleCompleteTask}>
                                <h4 style={{ marginBottom: '1rem' }}>Nasıl Tamamladınız? Neler Yaptınız?</h4>
                                <textarea placeholder="Rapor / Notlar (Zorunlu)" required value={reportText} onChange={e => setReportText(e.target.value)} style={{ width: '100%', height: '120px', padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', resize: 'vertical' }}></textarea>
                                
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Dosya veya Görsel Ekle (İsteğe Bağlı)</label>
                                    <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
                                    {reportFile && <p style={{ color: '#2ecc71', fontSize: '0.8rem', marginTop: '0.5rem' }}>✓ Dosya başarıyla yüklendi.</p>}
                                </div>
                                
                                <button type="submit" className="btn-primary" disabled={isUploading} style={{ width: '100%', background: '#2ecc71', color: '#000', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: 'var(--radius)' }}><i className="bi bi-check-lg"></i> {isUploading ? 'Dosya Yükleniyor...' : 'İncelemeye Gönder (Raporla)'}</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
