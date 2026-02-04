//export: Permite que essa função seja importada e usada em outros arquivos

export const normalizeStr = (str) => {
    return String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

//essa função é apenas para melhoria de ex de usuario em telefones e tablets
export const formatDataCurta = (datastr) => {
    // Adicionei uma verificação extra para garantir que não quebre
    if(!datastr || datastr === '-' || datastr === 'A calcular') return '--/-- --:--';
    try {
        const [data, hora] = datastr.split(' '); 
        const [dia, mes] = data.split('/'); 
        return `${dia}/${mes} ${hora}`;
    } catch (error) {
        return datastr;
    }
};


export const getLocationType = (id) => { //Recebe o id do local e retorna o tipo de local
  const upperId = id ? id.toUpperCase() : ''; //Converte o id para maiúsculas
    if (upperId.includes("SALA")) return "SALA"; //Se o id contém "SALA", retorna "SALA"
    if (upperId.includes('THERMOTRON') || upperId.includes('TERMO')) return 'THERMOTRON';
    return 'BANHO';
};

