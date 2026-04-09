<<<<<<< HEAD:lab-manager/src/components/business/IconesLocais.jsx
import React from 'react';
import { Warehouse, Cpu, Thermometer } from 'lucide-react';
=======
//centraliza a lógica de "qual ícone usar para cada tipo de máquina".
import React from 'react';
import { Warehouse, Cpu, Thermometer } from 'lucide-react';

>>>>>>> fd131c1fe2bab35d05226c8663d1c7fe45158923:lab-manager/src/components/business/LocationIcon.jsx
import { getLocationType } from '../../utils/helpers';

const LocationIcon = ({ id, size = 20, className }) => {
  const type = getLocationType(id);

  switch (type) {
    case 'SALA':
      return <Warehouse size={size} className={className} />;
    case 'THERMOTRON':
      return <Cpu size={size} className={className} />;
    default: 
      return <Thermometer size={size} className={className} />;
  }
};

export default LocationIcon;
