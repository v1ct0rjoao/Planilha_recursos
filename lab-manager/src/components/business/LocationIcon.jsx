//centraliza a lógica de "qual ícone usar para cada tipo de máquina". Se amanhã você quiser trocar o ícone de "SALA" por um sofá, você muda em um lugar só e o sistema todo atualiza.

import React from 'react';
import { Warehouse, Cpu, Thermometer } from 'lucide-react';
// Importamos a função auxiliar que criamos lá no começo
import { getLocationType } from '../../utils/helpers';

const LocationIcon = ({ id, size = 20, className }) => {
  const type = getLocationType(id);

  switch (type) {
    case 'SALA':
      return <Warehouse size={size} className={className} />;
    case 'THERMOTRON':
      return <Cpu size={size} className={className} />;
    default: // BANHO
      return <Thermometer size={size} className={className} />;
  }
};

export default LocationIcon;