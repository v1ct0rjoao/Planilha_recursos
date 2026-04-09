export const normalizeStr = (str) => {
    return String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const formatDataCurta = (datastr) => {
    if(!datastr || datastr === '-' || datastr === 'A calcular') return '--/-- --:--';
    try {
        const [data, hora] = datastr.split(' '); 
        const [dia, mes] = data.split('/'); 
        return `${dia}/${mes} ${hora}`;
    } catch (error) {
        return datastr;
    }
};

export const getLocationType = (id) => {
    const upperId = id ? id.toUpperCase() : '';
    if (upperId.includes("SALA")) return "SALA";
    if (upperId.includes('THERMOTRON') || upperId.includes('TERMO')) return 'THERMOTRON';
    return 'BANHO';
};

export const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
};

export const formatTime = (decimalHours) => {
    if (!decimalHours || isNaN(decimalHours)) return '0h 00m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};