import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="category-selector my-3" *ngIf="categories && categories.length">
      <h5>Categorías a incluir:</h5>
      <div *ngFor="let category of categories" class="form-check">
        <input 
          class="form-check-input" 
          type="checkbox" 
          [value]="category" 
          [(ngModel)]="selectedMap[category]" 
          (change)="onSelectionChange()">
        <label class="form-check-label">{{ category }}</label>
      </div>
    </div>
  `,
  styles: [`
    /* Estilo principal para el contenedor del selector */
    .category-selector {
      max-width: 400px;
      margin: 0 auto;
      padding: 1rem;             /* Agrego padding para mejorar la presentación */
      background-color: #f8f9fa;   /* Fondo suave */
      border-radius: 5px;        /* Bordes redondeados */
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Sutil sombra para dar profundidad */
    }
    /* Estilo para cada elemento de la lista */
    .form-check {
      margin-bottom: 0.5rem;
    }
    /* Personalización de los inputs */
    .form-check-input {
      cursor: pointer;           /* Cambio de cursor para indicar interactividad */
    }
    /* Personalización de las etiquetas */
    .form-check-label {
      cursor: pointer;
      margin-left: 0.3rem;
    }
    /* Estilo para el título */
    h5 {
      text-align: center;
      color: #343a40;
      margin-bottom: 1rem;
    }
  `]
})

export class CategorySelectorComponent {
  // Recibo la lista de categorías disponibles
  @Input() public categories: string[] = [];
  // Emito la lista de categorías seleccionadas al componente padre
  @Output() public selectedCategoriesChange = new EventEmitter<string[]>();

  // Mapa para llevar el control de la selección de cada categoría
  public selectedMap: { [key: string]: boolean } = {};

  // Cada vez que cambia una selección, emito la lista actualizada
  public onSelectionChange(): void {
    const selected = Object.keys(this.selectedMap).filter(cat => this.selectedMap[cat]);
    this.selectedCategoriesChange.emit(selected);
  }
}
