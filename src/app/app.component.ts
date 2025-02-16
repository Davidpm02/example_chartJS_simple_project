import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// Importo Chart y sus elementos registrables
import { Chart, registerables } from 'chart.js';
import { lastValueFrom } from 'rxjs';
// Importo los componentes de selección de rango de fechas y categorías
import { DateRangeSelectorComponent } from './date-range-selector.component';
import { CategorySelectorComponent } from './category-selector.component';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  // Agrego los nuevos componentes al array de imports para Standalone Components
  imports: [CommonModule, FormsModule, DateRangeSelectorComponent, CategorySelectorComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public title = 'proyecto-charts';
  public selectedChart: string | null = null;
  public selectedTable: string | null = null;
  public tables: { name: string }[] = [];
  public chart: Chart | undefined;

  // Propiedades para la selección de fechas
  public startDate: string | null = null;
  public endDate: string | null = null;

  // Propiedades para la selección de categorías y para almacenar los datos de la tabla
  public availableCategories: string[] = [];
  public selectedCategories: string[] = [];
  public allTableData: any[] = [];

  // Nuevas propiedades para drill down
  public drillDownActive: boolean = false;
  public originalData: any;

  constructor(private http: HttpClient) { }

  // Método para seleccionar el tipo de gráfico (invocado al hacer click en una card)
  public selectChart(chart: string): void {
    this.selectedChart = chart;
  }

  // Método que recibe el rango de fechas seleccionado desde el componente hijo
  public onDateRangeSelected(event: { startDate: string | null, endDate: string | null }): void {
    this.startDate = event.startDate;
    this.endDate = event.endDate;
    console.log('Rango de fechas seleccionado:', this.startDate, this.endDate);
  }

  // Método que recibe las categorías seleccionadas desde el componente CategorySelector
  public onCategoriesSelected(selected: string[]): void {
    this.selectedCategories = selected;
    console.log('Categorías seleccionadas:', this.selectedCategories);
  }

  // Método que se ejecuta cuando se selecciona una tabla en el dropdown
  public async onTableSelected(): Promise<void> {
    // Reseteo las variables relacionadas con fechas, categorías y datos
    this.startDate = null;
    this.endDate = null;
    this.selectedCategories = [];
    this.availableCategories = [];
    this.allTableData = [];
    this.drillDownActive = false;

    if (!this.selectedTable) {
      return;
    }

    try {
      // Obtengo los datos completos de la tabla seleccionada
      const data: any[] = await lastValueFrom(
        this.http.get<any[]>('http://localhost:3000/getData/' + this.selectedTable)
      );
      // Almaceno los datos para usarlos posteriormente en generateChart()
      this.allTableData = data;
      // Extraigo las categorías disponibles de los datos
      this.availableCategories = Array.from(new Set(data.map((r: any) => r.categoria)));
      console.log('Categorías disponibles:', this.availableCategories);
    } catch (err) {
      console.error('Error al obtener los datos de la tabla:', err);
    }
  }

  // Inicializo el componente y obtengo la lista de tablas de la base de datos
  public async ngOnInit(): Promise<void> {
    try {
      const tablas = await lastValueFrom(this.http.get<{ name: string }[]>('http://localhost:3000/getTables'));
      this.tables = (tablas || []).map(table => ({ name: table.name }));
      console.log('Tablas en la base de datos:', this.tables);
    } catch (err) {
      console.error('Error al obtener las tablas:', err);
    }
  }

  // Función auxiliar para generar un color aleatorio en formato rgba
  private getRandomColor(opacity: number = 0.5): string {
    // Genero números aleatorios para RGB
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  public async generateChart(): Promise<void> {
    // Verifico que se haya seleccionado una tabla y un tipo de gráfico
    if (!this.selectedTable || !this.selectedChart) {
      console.error('Tabla o tipo de gráfico no seleccionado');
      return;
    }
  
    try {
      // Uso los datos almacenados de la tabla seleccionada
      const tableData = this.allTableData;
      if (!tableData || tableData.length === 0) {
        console.error('No hay datos para la tabla seleccionada');
        return;
      }
  
      // Filtro los datos según el rango de fechas (si se proporcionó alguno)
      let filteredData = tableData;
      if (this.startDate || this.endDate) {
        filteredData = tableData.filter((r: any) => {
          let valid = true;
          if (this.startDate) {
            valid = valid && (r.fecha >= this.startDate);
          }
          if (this.endDate) {
            valid = valid && (r.fecha <= this.endDate);
          }
          return valid;
        });
      }
  
      // Filtro los datos según las categorías seleccionadas (si el usuario marcó alguna)
      if (this.selectedCategories && this.selectedCategories.length > 0) {
        filteredData = filteredData.filter((r: any) => this.selectedCategories.includes(r.categoria));
      }
  
      let data: any;
      let chartType: string;
  
      // Refactorizo la lógica según el tipo de gráfico
      switch (this.selectedChart) {
        case 'lineas': {
          // Agrupo por fecha para gráficos de líneas
          const fechas: string[] = Array.from(new Set(filteredData.map((r: any) => r.fecha))).sort();
          const dataPoints = fechas.map((fecha) => {
            const registros = filteredData.filter((r: any) => r.fecha === fecha);
            return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
          });
          data = {
            labels: fechas,
            datasets: [{
              label: `Datos de ${this.selectedTable}`,
              data: dataPoints,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          };
          chartType = 'line';
          break;
        }
        case 'barras': {
          // Agrupo por fecha para gráficos de barras simples
          const fechas: string[] = Array.from(new Set(filteredData.map((r: any) => r.fecha))).sort();
          const dataPoints = fechas.map((fecha) => {
            const registros = filteredData.filter((r: any) => r.fecha === fecha);
            return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
          });
          data = {
            labels: fechas,
            datasets: [{
              label: `Datos de ${this.selectedTable}`,
              data: dataPoints,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          };
          chartType = 'bar';
          // Guardo la data original para permitir el drill down
          this.originalData = JSON.parse(JSON.stringify(data));
          this.drillDownActive = false;
          break;
        }
        case 'barrasAgrupadas': {
          // Para barras agrupadas, agrupo los datos por fecha y categoría
          const fechas: string[] = Array.from(new Set(filteredData.map((r: any) => r.fecha))).sort();
          const categorias: string[] = Array.from(new Set(filteredData.map((r: any) => r.categoria)));
          const datasets = categorias.map((cat) => {
            const dataPoints = fechas.map((fecha) => {
              const registros = filteredData.filter((r: any) => r.fecha === fecha && r.categoria === cat);
              return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
            });
            return {
              label: cat,
              data: dataPoints,
              backgroundColor: this.getRandomColor(0.5),
              borderColor: this.getRandomColor(1),
              borderWidth: 1
            };
          });
          data = {
            labels: fechas,
            datasets: datasets
          };
          chartType = 'bar';
          break;
        }
        case 'pastel': {
          // Para gráficos de pastel, agrupo los datos por categoría
          const categorias: string[] = Array.from(new Set(filteredData.map((r: any) => r.categoria)));
          const valores = categorias.map((cat) => {
            const registros = filteredData.filter((r: any) => r.categoria === cat);
            return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
          });
          data = {
            labels: categorias,
            datasets: [{
              label: `Datos de ${this.selectedTable}`,
              data: valores,
              backgroundColor: categorias.map(() => this.getRandomColor(0.5)),
              borderColor: categorias.map(() => this.getRandomColor(1)),
              borderWidth: 1
            }]
          };
          chartType = 'pie';
          break;
        }
        default: {
          console.error('Tipo de gráfico desconocido');
          return;
        }
      } // Fin del switch
  
      // Destruyo el gráfico anterior si existe para evitar duplicados
      if (this.chart) {
        this.chart.destroy();
      }
  
      // Obtengo el elemento canvas donde se renderizará el gráfico
      const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('No se encontró el elemento canvas');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('No se pudo obtener el contexto del canvas');
        return;
      }
  
      // Creo el gráfico con ChartJS, incorporando la lógica de drill down en gráficos de barras
      this.chart = new Chart(ctx, {
        type: chartType as any,
        data: data,
        options: {
          responsive: true,
          onClick: (evt: MouseEvent, activeElements: any[]) => {
            // Aplico drill down sólo para el gráfico de barras simples y si no estoy ya en drill down
            if (this.selectedChart === 'barras' && !this.drillDownActive && activeElements && activeElements.length > 0) {
              const index = activeElements[0].index;
              // Obtengo la etiqueta (en este caso, la fecha) que se ha clicado
              const label = this.chart && this.chart.data.labels ? this.chart.data.labels[index] as string : '';
              this.drillDown(label);
            } else if (this.selectedChart === 'pastel' && !this.drillDownActive && activeElements && activeElements.length > 0) {
              // Obtengo el índice del segmento clicado y su etiqueta (la categoría)
              const index = activeElements[0].index;
              const label = this.chart && this.chart.data.labels ? this.chart.data.labels[index] as string : '';
              this.drillDownPie(label);
            } else if (this.selectedChart === 'barrasAgrupadas' && !this.drillDownActive && activeElements && activeElements.length > 0) {
                // Obtengo el elemento activo (contiene datasetIndex e index)
                const activeElement = activeElements[0];
                const datasetIndex = activeElement.datasetIndex;
                const index = activeElement.index;
                const label = this.chart && this.chart.data.labels 
                                ? this.chart.data.labels[index] as string 
                                : '';
                alert(`Se ha seleccionado el segmento correspondiente al día: ${label}`);

                // Accedo al array de colores del dataset seleccionado.
                // Es importante que backgroundColor esté definido como un array de colores.
                const dataset = this.chart?.data?.datasets ? this.chart.data.datasets[datasetIndex] : undefined;
                if (!dataset) {
                  console.error('Dataset no encontrado');
                  return;
                }
                
                // Si backgroundColor es un array, modifico el color en la posición 'index'
                if (Array.isArray(dataset.backgroundColor)) {
                  // Cambio el color a, por ejemplo, rojo semitransparente
                  const newBackgroundColors = [...dataset.backgroundColor];
                  newBackgroundColors[index] = 'rgba(255, 0, 0, 0.7)';
                  dataset.backgroundColor = newBackgroundColors;
                } else {
                  // Si backgroundColor no es un array, convierto el color en un array con el mismo color para todos los elementos,
                  // y luego modifico el seleccionado
                  const color = dataset.backgroundColor;
                  dataset.backgroundColor = Array(this.chart?.data?.labels?.length || 0).fill(color);
                  const newBackgroundColors = [...dataset.backgroundColor];
                  newBackgroundColors[index] = 'rgba(255, 0, 0, 0.7)';
                  dataset.backgroundColor = newBackgroundColors;
                }

                // Actualizo el gráfico para reflejar el cambio de color
                if (this.chart) {
                  this.chart.update();
                }
            } else if (this.selectedChart === 'lineas' && !this.drillDownActive && activeElements && activeElements.length > 0) {
              // Obtengo el elemento activo (contiene datasetIndex e index)
              const activeElement = activeElements[0];
              const datasetIndex = activeElement.datasetIndex;
              const index = activeElement.index;
              const label = this.chart && this.chart.data.labels 
                              ? this.chart.data.labels[index] as string 
                              : '';
              alert(`Se ha seleccionado el segmento correspondiente al día: ${label}`);

              // Accedo al array de colores del dataset seleccionado.
              // Es importante que backgroundColor esté definido como un array de colores.
              const dataset = this.chart?.data?.datasets ? this.chart.data.datasets[datasetIndex] : undefined;
              if (!dataset) {
                console.error('Dataset no encontrado');
                return;
              }
              
              // Si backgroundColor es un array, modifico el color en la posición 'index'
              if (Array.isArray(dataset.backgroundColor)) {
                // Cambio el color a, por ejemplo, rojo semitransparente
                const newBackgroundColors = [...dataset.backgroundColor];
                newBackgroundColors[index] = 'rgba(255, 0, 0, 0.7)';
                dataset.backgroundColor = newBackgroundColors;
              } else {
                // Si backgroundColor no es un array, convierto el color en un array con el mismo color para todos los elementos,
                // y luego modifico el seleccionado
                const color = dataset.backgroundColor;
                dataset.backgroundColor = Array(this.chart?.data?.labels?.length || 0).fill(color);
                const newBackgroundColors = [...dataset.backgroundColor];
                newBackgroundColors[index] = 'rgba(255, 0, 0, 0.7)';
                dataset.backgroundColor = newBackgroundColors;
              }

              // Actualizo el gráfico para reflejar el cambio de color
              if (this.chart) {
                this.chart.update();
              }
            }
          }
        }
      });
  
      console.log('Gráfico generado:', this.chart);
    } catch (error) {
      console.error('Error al generar el gráfico:', error);
    }
  }
  

  // Función para realizar el drill down a partir del elemento clicado
  public drillDown(clickedLabel: string): void {
    // Filtro los registros basándome en el label clicado (por ejemplo, la fecha)
    // y, si hay categorías seleccionadas, también verifico que el registro pertenezca a alguna de ellas.
    const filteredRows = this.allTableData.filter((r: any) => {
      const matchFecha = r.fecha === clickedLabel;
      const matchCategoria = (this.selectedCategories && this.selectedCategories.length > 0)
        ? this.selectedCategories.includes(r.categoria)
        : true;
      return matchFecha && matchCategoria;
    });
    console.log("Filas filtradas para drill down:", filteredRows);
  
    if (filteredRows.length === 0) {
      console.warn('No se encontraron registros para drill down en:', clickedLabel);
      return;
    }
  
    // Verifico si la propiedad 'subcategoria' existe en los registros
    if (!filteredRows[0].hasOwnProperty('subcategoria')) {
      console.error("La propiedad 'subcategoria' no se encuentra en los datos. Verifico el nombre de la columna.");
      return;
    }
  
    // Extraigo las subcategorías y filtro valores nulos o vacíos
    const subcategorias = filteredRows
      .map((r: any) => r.subcategoria)
      .filter((sub: any) => sub !== null && sub !== undefined && sub !== '');
    console.log("Subcategorías extraídas:", subcategorias);
  
    if (subcategorias.length === 0) {
      console.warn("No se encontraron subcategorías válidas para el drill down.");
      return;
    }
  
    // Obtengo las subcategorías únicas
    const uniqueSubcategorias = Array.from(new Set(subcategorias));
  
    // Construyo los valores agregados para cada subcategoría
    const dataPoints = uniqueSubcategorias.map((sub) => {
      const registros = filteredRows.filter((r: any) => r.subcategoria === sub);
      return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
    });
  
    // Construyo la nueva data para el drill down
    const drillData = {
      labels: uniqueSubcategorias,
      datasets: [{
        label: `${clickedLabel}`,
        data: dataPoints,
        backgroundColor: uniqueSubcategorias.map(() => this.getRandomColor(0.5)),
        borderColor: uniqueSubcategorias.map(() => this.getRandomColor(1)),
        borderWidth: 1
      }]
    };
  
    // Actualizo el gráfico con la nueva data y marco que estoy en drill down
    if (this.chart) {
      this.chart.data = drillData;
      this.chart.update();
      this.drillDownActive = true;
      console.log('Drill down activado para:', clickedLabel);
    }
  }

  // Función para el drill down en gráficos de pastel
public drillDownPie(clickedCategory: string): void {
  // Filtro los registros que corresponden a la categoría clicada.
  // Si tengo filtros adicionales (por fecha, etc.), los aplico aquí.
  const filteredRows = this.allTableData.filter((r: any) => r.categoria === clickedCategory);
  console.log("Filas filtradas para drill down en pastel:", filteredRows);

  if (filteredRows.length === 0) {
    console.warn('No se encontraron registros para drill down en la categoría:', clickedCategory);
    return;
  }

  // Verifico que la propiedad 'subcategoria' exista
  if (!filteredRows[0].hasOwnProperty('subcategoria')) {
    console.error("La propiedad 'subcategoria' no se encuentra en los datos.");
    return;
  }

  // Extraigo las subcategorías y filtro aquellos valores nulos o vacíos
  const subcategorias = filteredRows
    .map((r: any) => r.subcategoria)
    .filter((sub: any) => sub !== null && sub !== undefined && sub !== '');
  console.log("Subcategorías extraídas:", subcategorias);

  if (subcategorias.length === 0) {
    console.warn("No se encontraron subcategorías válidas para la categoría:", clickedCategory);
    return;
  }

  // Obtengo las subcategorías únicas
  const uniqueSubcategorias = Array.from(new Set(subcategorias));

  // Calculo el valor total por cada subcategoría
  const dataPoints = uniqueSubcategorias.map((sub) => {
    const registros = filteredRows.filter((r: any) => r.subcategoria === sub);
    return registros.reduce((acum: number, r: any) => acum + r.valor, 0);
  });

  // Construyo la nueva data para el drill down en pastel
  const drillData = {
    labels: uniqueSubcategorias,
    datasets: [{
      label: `Drill Down de ${clickedCategory}`,
      data: dataPoints,
      backgroundColor: uniqueSubcategorias.map(() => this.getRandomColor(0.5)),
      borderColor: uniqueSubcategorias.map(() => this.getRandomColor(1)),
      borderWidth: 1
    }]
  };

  // Guardo la data original si aún no se ha guardado para permitir volver atrás
  if (!this.drillDownActive && this.chart) {
    this.originalData = JSON.parse(JSON.stringify(this.chart.data));
  }

  // Actualizo el gráfico con la nueva data
  if (this.chart) {
    this.chart.data = drillData;
    this.chart.update();
    this.drillDownActive = true;
    console.log('Drill down en pastel activado para:', clickedCategory);
  }
}

  
  

  // Método para volver al gráfico original desde el drill down
  public onBack(): void {
    if (this.chart && this.originalData) {
      // Resto la data original y actualizo el gráfico
      this.chart.data = JSON.parse(JSON.stringify(this.originalData));
      this.chart.update();
      this.drillDownActive = false;
      console.log('Volviendo al gráfico original');
    }
  }
}
