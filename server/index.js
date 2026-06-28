const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { encrypt, decrypt, encryptFields, decryptFields, decryptArray } = require('./crypto');

// Fields to encrypt per model
const TASK_ENC = ['title', 'description', 'report'];
const TEAM_ENC = ['name', 'description'];
const NOTIF_ENC = ['message'];
const MSG_ENC = ['content'];

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(uploadDir));

app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/senfoni-karma';
mongoose.connect(MONGO_URI).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Schemas
const teamSchema = new mongoose.Schema({
    name: String,
    description: String
});
const Team = mongoose.model('Team', teamSchema);

const memberSchema = new mongoose.Schema({
    username: String, // from Senfoni Chat
    role: { type: String, default: 'Member' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});
const Member = mongoose.model('Member', memberSchema);

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
    urgency: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' },
    dueDate: String,
    attachment: String,
    report: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});
const Task = mongoose.model('Task', taskSchema);

const notifSchema = new mongoose.Schema({
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notifSchema);
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    isTeamMessage: { type: Boolean, default: false },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const requireUser = (req, res, next) => {
    const user = req.headers['x-user'];
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
};

// Auth Route
app.post('/api/auth', async (req, res) => {
    try {
        const { apiKey } = req.body;
        // Verify with Senfoni Chat internally via Docker network
        const chatRes = await fetch('http://senfoni-chat:3000/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
        });
        const chatData = await chatRes.json();
        
        if (chatData.valid) {
            let member = await Member.findOne({ username: chatData.username });
            if (!member) {
                member = new Member({ username: chatData.username, role: chatData.role });
                await member.save();
            }

            // If the user is an admin, automatically sync all users from Senfoni Chat
            if (chatData.role === 'admin') {
                try {
                    const adminRes = await fetch('http://senfoni-chat:3000/api/admin', {
                        headers: { 'X-Senfoni-Key': apiKey }
                    });
                    const adminData = await adminRes.json();
                    if (adminData.users) {
                        for (const u of adminData.users) {
                            let existing = await Member.findOne({ username: u.username });
                            if (!existing) {
                                await (new Member({ username: u.username, role: u.role })).save();
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to sync users:', err);
                }
            }

            res.json({ valid: true, user: chatData.username, role: chatData.role });
        } else {
            res.status(401).json({ valid: false, error: 'Geçersiz API Token.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Server error', details: e.message });
    }
});

// Stats Route for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const doneCount = await Task.countDocuments({ status: 'done' });
        const inProgressCount = await Task.countDocuments({ status: 'in-progress' });
        
        // Late calculation (very simple string comparison for MVP, assuming YYYY-MM-DD or simple logic)
        const today = new Date().toISOString().split('T')[0];
        const lateCount = await Task.countDocuments({ 
            status: { $ne: 'done' }, 
            dueDate: { $lt: today, $ne: '' } 
        });

        const activeMemberCount = await Member.countDocuments();

        res.json({
            done: doneCount,
            inProgress: inProgressCount,
            late: lateCount,
            activeMembers: activeMemberCount
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Teams Routes
app.get('/api/teams', async (req, res) => {
    const teams = await Team.find();
    res.json(decryptArray(teams, TEAM_ENC));
});
app.post('/api/teams', async (req, res) => {
    const encrypted = encryptFields(req.body, TEAM_ENC);
    const team = new Team(encrypted);
    await team.save();
    res.json(decryptFields(team, TEAM_ENC));
});
app.put('/api/teams/:id', async (req, res) => {
    const encrypted = encryptFields(req.body, TEAM_ENC);
    const team = await Team.findByIdAndUpdate(req.params.id, encrypted, { new: true });
    res.json(decryptFields(team, TEAM_ENC));
});
app.delete('/api/teams/:id', async (req, res) => {
    await Team.findByIdAndDelete(req.params.id);
    await Member.updateMany({ teamId: req.params.id }, { teamId: null });
    res.json({ success: true });
});

// Members Routes
app.get('/api/members', async (req, res) => {
    const members = await Member.find().populate('teamId');
    // Decrypt team names inside populated teamId
    const decrypted = members.map(m => {
        const obj = m.toObject();
        if (obj.teamId) obj.teamId = decryptFields(obj.teamId, TEAM_ENC);
        return obj;
    });
    res.json(decrypted);
});
app.post('/api/members', async (req, res) => {
    const member = new Member(req.body);
    await member.save();
    res.json(member);
});
app.put('/api/members/:id', async (req, res) => {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('teamId');
    const obj = member.toObject();
    if (obj.teamId) obj.teamId = decryptFields(obj.teamId, TEAM_ENC);
    res.json(obj);
});

// Internal webhook: called by Senfoni Chat when a user is deleted
// This removes the user from Karma (tasks unassigned, member removed)
app.delete('/api/members/by-username/:username', async (req, res) => {
    // Only allow from internal Docker network (loopback or 172.x range)
    const clientIp = req.ip || req.connection.remoteAddress || '';
    const isInternal = clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('172.') || clientIp.startsWith('::ffff:172.');
    if (!isInternal) {
        return res.status(403).json({ error: 'Internal only' });
    }
    try {
        const { username } = req.params;
        const member = await Member.findOne({ username });
        if (!member) return res.status(404).json({ error: 'Member not found' });

        // Unassign tasks
        await Task.updateMany({ assignee: member._id }, { $unset: { assignee: 1 } });
        // Delete member
        await Member.deleteOne({ _id: member._id });
        console.log(`[sync] Deleted member ${username} from Karma (triggered by Senfoni Chat)`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Tasks Routes
app.get('/api/tasks', async (req, res) => {
    const tasks = await Task.find().populate('assignee').populate('teamId');
    const decrypted = tasks.map(t => {
        const obj = decryptFields(t, TASK_ENC);
        if (obj.teamId) obj.teamId = decryptFields(obj.teamId, TEAM_ENC);
        return obj;
    });
    res.json(decrypted);
});

app.post('/api/tasks', async (req, res) => {
    const encrypted = encryptFields(req.body, TASK_ENC);
    const task = new Task(encrypted);
    await task.save();
    await task.populate('assignee');
    await task.populate('teamId');
    const obj = decryptFields(task, TASK_ENC);
    if (obj.teamId) obj.teamId = decryptFields(obj.teamId, TEAM_ENC);
    res.json(obj);
});

app.put('/api/tasks/:id', async (req, res) => {
    const encrypted = encryptFields(req.body, TASK_ENC);
    const task = await Task.findByIdAndUpdate(req.params.id, encrypted, { new: true }).populate('assignee').populate('teamId');
    
    // Decrypt for notification text and response
    const decryptedTask = decryptFields(task, TASK_ENC);
    if (decryptedTask.teamId) decryptedTask.teamId = decryptFields(decryptedTask.teamId, TEAM_ENC);
    
    if (req.body.status === 'done') {
        const notifMsg = `${task.assignee ? task.assignee.username : (decryptedTask.teamId ? decryptedTask.teamId.name : 'Biri')} "${decryptedTask.title}" görevini tamamladı! ${task.attachment ? 'Dosya eklendi.' : ''}`;
        const notif = new Notification({
            message: encrypt(notifMsg)
        });
        await notif.save();
    }
    
    res.json(decryptedTask);
});

app.delete('/api/tasks/:id', async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.get('/api/notifications', async (req, res) => {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(10);
    res.json(decryptArray(notifs, NOTIF_ENC));
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi' });
    }
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ url: fileUrl });
});

// Chat Endpoints
app.get('/api/messages/:target', requireUser, async (req, res) => {
    const { target } = req.params;
    const { type } = req.query; // 'user' or 'team'
    
    let query;
    if (type === 'team') {
        // Only return team messages if the user is in that team or is admin
        const member = await Member.findOne({ username: req.user }).populate('teamId');
        const isAdmin = member && (member.role.toLowerCase() === 'admin' || member.role.toLowerCase() === 'moderator');
        const isTeamMember = member && member.teamId && member.teamId._id.toString() === target;
        
        if (!isAdmin && !isTeamMember) {
            return res.status(403).json({ error: 'Bu takımın mesajlarını okuma yetkiniz yok.' });
        }
        query = { receiver: target, isTeamMessage: true };
    } else {
        // User to User chat
        query = {
            isTeamMessage: false,
            $or: [
                { sender: req.user, receiver: target },
                { sender: target, receiver: req.user }
            ]
        };
    }
    
    const messages = await Message.find(query).sort({ timestamp: 1 }).limit(100);
    res.json(decryptArray(messages, MSG_ENC));
});

app.post('/api/messages', requireUser, async (req, res) => {
    const { receiver, content, isTeamMessage } = req.body;
    
    // Security checks
    if (isTeamMessage) {
        const member = await Member.findOne({ username: req.user }).populate('teamId');
        const isAdmin = member && (member.role.toLowerCase() === 'admin' || member.role.toLowerCase() === 'moderator');
        const isTeamMember = member && member.teamId && member.teamId._id.toString() === receiver;
        
        if (!isAdmin && !isTeamMember) {
            return res.status(403).json({ error: 'Bu takıma mesaj gönderme yetkiniz yok.' });
        }
    }
    
    // XSS Protection (basic)
    const sanitizedContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    const newMsg = new Message({
        sender: req.user,
        receiver,
        isTeamMessage,
        content: encrypt(sanitizedContent)
    });
    await newMsg.save();
    res.json(decryptFields(newMsg, MSG_ENC));
});

// Serve frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, { index: false })); // Don't serve index.html automatically
app.use((req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
