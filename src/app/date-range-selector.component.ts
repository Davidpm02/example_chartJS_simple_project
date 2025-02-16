import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="date-range-selector my-3">
    <h5>Rango de tiempo:</h5>
      <div class="form-group">
        <label for="startDate">Fecha de inicio:</label>
        <input 
          id="startDate" 
          type="date" 
          class="form-control" 
          [(ngModel)]="startDate">
      </div>
      <div class="form-group">
        <label for="endDate">Fecha de fin:</label>
        <input 
          id="endDate" 
          type="date" 
          class="form-control" 
          [(ngModel)]="endDate">
      </div>
      <div class="text-center my-2">
        <button class="btn btn-secondary" (click)="applyFilter()">
          Aplicar Filtro
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* He aplicado los mismos estilos para el contenedor para mantener la coherencia visual */
    .date-range-selector {
      max-width: 400px;
      margin: 0 auto;
      padding: 1rem;             /* Agrego padding para mejorar la presentación */
      background-color: #f8f9fa;   /* Fondo suave */
      border-radius: 5px;        /* Bordes redondeados */
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Sombra sutil para dar profundidad */
    }
    /* Estilo para separar los grupos de formularios */
    .form-group {
      margin-bottom: 1rem;
    }
    /* Puedo agregar estilos opcionales para los inputs si lo requiero */
    .form-control {
      cursor: pointer;  /* Indico interactividad en el input */
    }
    /* Estilo para el título */
    h5 {
      text-align: center;
      color: #343a40;
      margin-bottom: 1rem;
    }
  `]
})

export class DateRangeSelectorComponent {
  // Propiedades para almacenar las fechas seleccionadas
  public startDate: string | null = null;
  public endDate: string | null = null;

  // Evento para enviar la selección de fechas al componente padre
  @Output() dateRangeSelected = new EventEmitter<{ startDate: string | null, endDate: string | null }>();

  // Método que emite las fechas seleccionadas
  public applyFilter(): void {
    // Emito el evento con las fechas seleccionadas
    this.dateRangeSelected.emit({ startDate: this.startDate, endDate: this.endDate });
  }
}
