import React, { useMemo, useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Thermometer, CheckCircle2, Clock, Layers, BatteryCharging, ArrowLeft, Filter, SearchX
} from 'lucide-react';
import HighlightText from '../../components/ui/HighlightText'; 

const getLocationType = (id) => {
  const upperId = id ? String(id).toUpperCase() : '';
  if (upperId.includes("SALA")) return "SALA";
  if (upperId.includes('THERMOTRON') || upperId.includes('TERMO')) return 'THERMOTRON';
  return 'BANHO';
};

const CircuitCalendarView = ({ baths = [], searchTerm }) => {
  const [viewMode, setViewMode] = useState('calendar'); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [expandedBathId, setExpandedBathId] = useState(null);
  const [tempFilter, setTempFilter] = useState('ALL');
  
  const getLocalDateString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const parseDateStr = (dateStr) => {
    if (!dateStr || dateStr === '-' || dateStr === 'A calcular') return null;
    try {
      const [data, hora] = dateStr.split(' ');
      const [dia, mes, ano] = data.split('/');
      const [h, m] = hora ? hora.split(':') : ['00', '00'];
      return new Date(ano, mes - 1, dia, h, m);
    } catch (e) {
      return null;
    }
  };

  const getTempTheme = (temp) => {
    const t = parseFloat(temp);
    if (isNaN(t)) return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: 'text-slate-400', cardBg: 'bg-slate-50', cardBorder: 'border-slate-200', blob: 'bg-slate-500', shadowRing: 'shadow-slate-200 ring-slate-400', sideBorder: 'border-slate-400' };
    if (t < 25) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: 'text-blue-500', cardBg: 'bg-blue-50', cardBorder: 'border-blue-200', blob: 'bg-blue-500', shadowRing: 'shadow-blue-200 ring-blue-400', sideBorder: 'border-blue-400' };
    if (t === 25) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: 'text-emerald-600', cardBg: 'bg-emerald-50', cardBorder: 'border-emerald-200', blob: 'bg-emerald-500', shadowRing: 'shadow-emerald-200 ring-emerald-400', sideBorder: 'border-emerald-500' };
    if (t <= 45) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: 'text-amber-500', cardBg: 'bg-amber-50', cardBorder: 'border-amber-200', blob: 'bg-amber-500', shadowRing: 'shadow-amber-200 ring-amber-400', sideBorder: 'border-amber-400' };
    return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', icon: 'text-rose-500', cardBg: 'bg-rose-50', cardBorder: 'border-rose-200', blob: 'bg-rose-500', shadowRing: 'shadow-rose-200 ring-rose-400', sideBorder: 'border-rose-400' };
  };

  const groupedCircuits = useMemo(() => {
    const groups = {};
    baths.forEach(bath => {
      if (!bath.circuits) return;
      bath.circuits.forEach(c => {
        const isRunning = c.status === 'running' && c.progress < 100;
        if (isRunning && c.previsao && c.previsao.includes('/')) {
          const dateObj = parseDateStr(c.previsao);
          if (dateObj) {
            const dateKey = getLocalDateString(dateObj);
            if (!groups[dateKey]) groups[dateKey] = [];
            const cleanBathId = bath.id.replace(/^(BANHO|SALA|THERMOTRON) - /, '');
            groups[dateKey].push({ ...c, bathId: cleanBathId, temp: bath.temp, dateObj, rawBathId: bath.id });
          }
        }
      });
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.dateObj - b.dateObj);
    });
    return groups;
  }, [baths]);

  

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const lastDayOfWeek = new Date(year, month, daysInMonth).getDay();
    let nextDay = 1;
    if (lastDayOfWeek < 6) {
      for (let i = lastDayOfWeek + 1; i <= 6; i++) {
        cells.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
      }
    }
    return cells;
  }, [currentMonth]);

  const rowCount = calendarCells.length / 7;

  const handleDayClick = (dateKey, hasCircuits) => {
    if (!hasCircuits) return;
    setSelectedDateKey(dateKey);
    setTempFilter('ALL');
    setExpandedBathId(null);
    setViewMode('detail');
  };

  const handleBackToCalendar = () => {
    setViewMode('calendar');
    setSelectedDateKey(null);
    setExpandedBathId(null);
  };

  const handleBackToBaths = () => {
    setExpandedBathId(null);
  };

  const getFilteredCircuits = (circuits) => {
    if (!circuits) return [];
    if (!searchTerm || searchTerm.length < 2) return circuits;
    const term = searchTerm.toUpperCase();
    return circuits.filter(c => 
      c.id.toUpperCase().includes(term) || 
      (c.batteryId && c.batteryId.toUpperCase().includes(term)) ||
      c.bathId.toUpperCase().includes(term) ||
      (c.protocol && c.protocol.toUpperCase().includes(term))
    );
  };

  const selectedCircuits = getFilteredCircuits(groupedCircuits[selectedDateKey]);
  
  const circuitsByBathArray = useMemo(() => {
    const displayedCircuits = tempFilter === 'ALL' 
      ? selectedCircuits 
      : selectedCircuits.filter(c => String(c.temp) === String(tempFilter));
    const groups = {};
    displayedCircuits.forEach(c => {
      if (!groups[c.bathId]) groups[c.bathId] = { bathId: c.bathId, rawBathId: c.rawBathId, temp: c.temp, circuits: [] };
      groups[c.bathId].circuits.push(c);
    });
    return Object.values(groups).sort((a, b) => a.bathId.localeCompare(b.bathId));
  }, [selectedCircuits, tempFilter]);

  const tempSummary = useMemo(() => {
    const temps = {};
    selectedCircuits.forEach(c => {
      const t = c.temp !== undefined ? c.temp : 'N/A';
      temps[t] = (temps[t] || 0) + 1;
    });
    return Object.keys(temps).sort((a, b) => parseFloat(a) - parseFloat(b)).map(t => ({ temp: t, count: temps[t] }));
  }, [selectedCircuits]);

  const isToday = (dateKey) => dateKey === getLocalDateString(new Date());
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const CalendarBathCard = ({ group, onClick }) => {
    const theme = getTempTheme(group.temp);
    const type = getLocationType(group.rawBathId);
    return (
      <div onClick={onClick} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group p-4 flex flex-col h-[120px] justify-between relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 pointer-events-none ${theme.blob} group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{type}</span>
            <span className="text-base font-black text-slate-800 leading-tight break-all max-w-[140px] group-hover:text-blue-700 transition-colors">{group.bathId}</span>
          </div>
        </div>
        <div className="flex items-end justify-between z-10 mt-2">
          <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-lg ${theme.cardBg} ${theme.cardBorder}`}>
            <Thermometer size={14} className={theme.icon} />
            <span className={`text-xs font-black ${theme.text}`}>{group.temp}ºC</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Liberando</span>
            <span className="text-2xl font-black text-slate-800 leading-none mt-0.5">{group.circuits.length}</span>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'calendar') {
    return (
      <div className="flex-1 h-full w-full min-h-[500px] flex flex-col animate-in fade-in duration-300">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <CalendarIcon className="text-blue-600" size={26} /> Agenda de Liberações
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Visão macro de todas as máquinas programadas.</p>
          </div>
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronLeft size={20} /></button>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider w-36 text-center select-none">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 last:border-r-0">{day}</div>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar grid grid-cols-7 bg-white" style={{ gridTemplateRows: `repeat(${rowCount}, minmax(100px, 1fr))` }}>
            {calendarCells.map((cell, idx) => {
              const dateKey = getLocalDateString(cell.date);
              const dayCircuits = getFilteredCircuits(groupedCircuits[dateKey]);
              const count = dayCircuits.length;
              const hasCircuits = count > 0;
              const today = isToday(dateKey);
              const temps = {};
              dayCircuits.forEach(c => { const t = c.temp !== undefined ? c.temp : 'N/A'; temps[t] = (temps[t] || 0) + 1; });
              const summary = Object.keys(temps).sort((a, b) => parseFloat(a) - parseFloat(b)).map(t => ({ temp: t, count: temps[t] }));
              let cellClass = "flex flex-col relative border-r border-b border-slate-200 min-h-[100px] transition-colors focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500 ";
              if (!cell.isCurrentMonth) cellClass += "bg-slate-50/50 text-slate-400 ";
              else if (hasCircuits) cellClass += "bg-white hover:bg-blue-50/30 cursor-pointer group ";
              else cellClass += "bg-white ";
              const Wrapper = hasCircuits ? 'button' : 'div';
              return (
                <Wrapper key={idx} className={cellClass} onClick={() => handleDayClick(dateKey, hasCircuits)}>
                  <div className="px-2 pt-2 flex justify-between items-start">
                    <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full ${today ? 'bg-blue-600 text-white shadow-md' : !cell.isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`}>{cell.date.getDate()}</span>
                    {hasCircuits && <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors mt-1">{count} pos</span>}
                  </div>
                  <div className="flex-1 p-1.5 flex flex-col gap-[3px] overflow-hidden mt-1">
                    {summary.map((s, i) => {
                      const theme = getTempTheme(s.temp);
                      return (
                        <div key={i} className={`flex items-center justify-between px-1.5 py-0.5 rounded-sm border-l-2 ${theme.cardBg} ${theme.text} border-l-${theme.sideBorder.split('-')[2]}-500 text-[9px] font-bold`}>
                          <span>{s.temp}ºC</span>
                          <span>{s.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full min-h-[500px] flex flex-col animate-in slide-in-from-right-8 duration-300">
      <div className="mb-4 flex items-center gap-4 shrink-0">
        <button onClick={expandedBathId ? handleBackToBaths : handleBackToCalendar} className="flex items-center justify-center h-10 w-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all hover:-translate-x-0.1 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">{isToday(selectedDateKey) ? 'Hoje, ' : 'Dia '}{selectedDateKey?.split('-').reverse().join('/')}</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400" />
            {expandedBathId ? <span className="text-blue-600 font-bold">Visualizando circuitos de {expandedBathId}</span> : <span>Total de <strong className="text-slate-800">{selectedCircuits.length}</strong> posições liberando</span>}
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        {!expandedBathId && (
          <div className="bg-slate-50/80 border-b border-slate-200 p-4 sm:p-5 shrink-0 z-20">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              <button onClick={() => setTempFilter('ALL')} className={`text-left rounded-xl p-4 border transition-all duration-300 flex flex-col relative overflow-hidden focus:outline-none ${tempFilter === 'ALL' ? 'bg-slate-800 border-slate-800 text-white shadow-lg -translate-y-1 ring-2 ring-slate-800 ring-offset-2' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'}`}>
                <div className="flex justify-between items-start mb-2 relative z-10"><span className="text-[10px] font-black uppercase tracking-widest opacity-80">Visão Geral</span><Filter size={16} className="opacity-70" /></div>
                <div className="flex items-baseline gap-1.5 relative z-10"><span className="text-3xl font-black">{selectedCircuits.length}</span><span className="text-[10px] font-bold uppercase tracking-wider opacity-80">posições</span></div>
              </button>
              {tempSummary.map(group => {
                const theme = getTempTheme(group.temp);
                const isActive = tempFilter === group.temp;
                return (
                  <button key={group.temp} onClick={() => setTempFilter(group.temp)} className={`text-left rounded-xl p-4 border transition-all duration-300 flex flex-col relative overflow-hidden focus:outline-none ${isActive ? `bg-white ${theme.border} shadow-lg -translate-y-1 ring-2 ring-offset-2 ${theme.shadowRing}` : `bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5`}`}>
                    <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-20 transition-transform duration-500 ${theme.bg} ${isActive ? 'scale-110' : ''}`}></div>
                    <div className="flex justify-between items-start mb-2 relative z-10"><span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? theme.text : 'text-slate-500'}`}>Temp {group.temp}ºC</span><Thermometer size={16} className={isActive ? theme.icon : 'text-slate-400'} /></div>
                    <div className="flex items-baseline gap-1.5 relative z-10"><span className={`text-3xl font-black ${isActive ? theme.text : 'text-slate-800'}`}>{group.count}</span><span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? theme.text : 'text-slate-500'} opacity-80`}>vagas</span></div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/30">
          {!expandedBathId && (
            <div className="animate-in fade-in duration-300">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {circuitsByBathArray.map((group) => (<CalendarBathCard key={group.bathId} group={group} onClick={() => setExpandedBathId(group.bathId)} />))}
              </div>
              {circuitsByBathArray.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400"><SearchX size={48} className="mb-4 opacity-20 text-slate-500" /><p className="font-bold text-lg text-slate-600">Nenhum banho encontrado</p></div>
              )}
            </div>
          )}
          {expandedBathId && (
            <div className="animate-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {circuitsByBathArray.find(g => g.bathId === expandedBathId)?.circuits.map((circuit, idx) => {
                  const horaFim = circuit.dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const theme = getTempTheme(circuit.temp);
                  return (
                    <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all ${theme.sideBorder} border-l-4`}>
                      <div className="flex justify-between items-center mb-2"><span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-black font-mono flex items-center gap-1.5 border border-blue-100 shadow-sm"><Clock size={14} className="opacity-80" /> {horaFim}</span><span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${theme.cardBg} ${theme.text} ${theme.cardBorder}`}>{circuit.temp}ºC</span></div>
                      <div className="flex items-end justify-between mt-1"><div className="flex flex-col"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Circuito</span><span className="font-black text-slate-800 text-3xl leading-none"><HighlightText text={circuit.id} highlight={searchTerm} /></span></div><div className="flex flex-col items-end max-w-[50%]"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center justify-end gap-1">Bateria <BatteryCharging size={12} className="text-amber-500" /></span><span className="font-bold text-slate-700 text-sm truncate w-full text-right" title={circuit.batteryId}><HighlightText text={circuit.batteryId || 'N/A'} highlight={searchTerm} /></span></div></div>
                      <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</span><span className="text-xs font-black text-slate-600 font-mono truncate max-w-[160px]" title={circuit.protocol}>{circuit.protocol}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircuitCalendarView;