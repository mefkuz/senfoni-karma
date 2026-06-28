import React, { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';

const CalendarView = ({ user, role, activeOperation, onOperationChange }) => {
    const [tasks, setTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                const filtered = activeOperation ? data.filter(t => t.operationId === activeOperation) : data;
                setTasks(filtered);
            })
            .catch(console.error);
    }, [activeOperation]);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    // Adjust so Monday is 0 (firstDay is 0 for Sunday by default)
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const dayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            return t.dueDate.split('T')[0] === dateStr;
        });

        days.push(
            <div key={d} className="calendar-day">
                <span className="day-number">{d}</span>
                <div className="day-tasks">
                    {dayTasks.map(t => (
                        <div key={t._id} className={`cal-task urgency-${t.urgency} status-${t.status}`}>
                            {t.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <main className="main-content">
            <Topbar user={user} activeOperation={activeOperation} onOperationChange={onOperationChange} />
            
            <div className="board-header" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Takvim</h2>
                <div className="calendar-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={prevMonth} className="btn btn-secondary"><i className="bi bi-chevron-left"></i></button>
                    <h3 style={{ margin: 0, minWidth: '150px', textAlign: 'center' }}>{monthNames[month]} {year}</h3>
                    <button onClick={nextMonth} className="btn btn-secondary"><i className="bi bi-chevron-right"></i></button>
                </div>
            </div>

            <div className="calendar-grid-container" style={{ marginTop: '2rem' }}>
                <div className="calendar-header-row">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                        <div key={day} className="calendar-header-cell">{day}</div>
                    ))}
                </div>
                <div className="calendar-grid">
                    {days}
                </div>
            </div>
        </main>
    );
};

export default CalendarView;
