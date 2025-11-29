import React from 'react';
import { TareaList } from '../../components/tareas';

// Componente de página para la gestión de tareas
const Tareas = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Renderiza el componente de lista de tareas */}
          <TareaList />
        </div>
      </div>
    </div>
  );
};

export default Tareas;