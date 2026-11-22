import type { Empleado } from '../../modules/empleados/domain/empleado.model';
import { etiquetaSistemaPensiones } from '../pensiones';
import { descargarBlob, stampFechaArchivo } from './descargarBlob';

type FilaEmpleado = {
  DNI: string;
  Nombre: string;
  Cargo: string;
  'Sueldo base': number;
  Régimen: string;
  'Sistema de pensiones': string;
  'Tiene hijos': string;
  Hijos: string;
  'Creado en': string;
  'Actualizado en': string;
};

const COLUMNAS: { key: keyof FilaEmpleado; width: number }[] = [
  { key: 'DNI', width: 12 },
  { key: 'Nombre', width: 28 },
  { key: 'Cargo', width: 22 },
  { key: 'Sueldo base', width: 14 },
  { key: 'Régimen', width: 10 },
  { key: 'Sistema de pensiones', width: 18 },
  { key: 'Tiene hijos', width: 12 },
  { key: 'Hijos', width: 36 },
  { key: 'Creado en', width: 22 },
  { key: 'Actualizado en', width: 22 },
];

/** Azul marca de la app (#0b5fff). */
const ENCABEZADO_FILL = 'FF0B5FFF';
const ENCABEZADO_FONT = 'FFFFFFFF';

function filasEmpleados(items: Empleado[]): FilaEmpleado[] {
  return items.map((e) => ({
    DNI: e.dni,
    Nombre: e.nombre,
    Cargo: e.cargo,
    'Sueldo base': e.sueldoBase,
    Régimen: e.regimen,
    'Sistema de pensiones': etiquetaSistemaPensiones(e.regimen, e.afp),
    'Tiene hijos': e.tieneHijos ? 'Sí' : 'No',
    Hijos: e.hijos.map((h) => `${h.nombre} (${h.edad})`).join('; '),
    'Creado en': e.creadoEn,
    'Actualizado en': e.actualizadoEn,
  }));
}

function escaparCsv(valor: string | number): string {
  const s = String(valor ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function cargarExcelJS() {
  const mod = await import('exceljs');
  return mod.default ?? mod;
}

/** CSV UTF-8 con BOM (Excel moderno / Microsoft 365). */
export async function exportarEmpleadosCsv(items: Empleado[]): Promise<void> {
  const filas = filasEmpleados(items);
  if (filas.length === 0) return;

  const headers = COLUMNAS.map((c) => c.key);
  const lineas = [
    headers.join(','),
    ...filas.map((f) => headers.map((h) => escaparCsv(f[h])).join(',')),
  ];
  // BOM + CRLF: abre correctamente acentos y columnas en Excel actual.
  const contenido = `\uFEFF${lineas.join('\r\n')}\r\n`;
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  descargarBlob(blob, `empleados_${stampFechaArchivo()}.csv`);
}

/** Excel .xlsx con tabla estructurada y encabezados de color. */
export async function exportarEmpleadosExcel(items: Empleado[]): Promise<void> {
  const filas = filasEmpleados(items);
  if (filas.length === 0) return;

  const ExcelJS = await cargarExcelJS();
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Calculadora de nómina';
  libro.created = new Date();
  libro.modified = new Date();

  const hoja = libro.addWorksheet('Empleados', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  hoja.columns = COLUMNAS.map((c) => ({
    key: c.key,
    width: c.width,
  }));

  const headers = COLUMNAS.map((c) => c.key);

  hoja.addTable({
    name: 'Empleados',
    ref: 'A1',
    headerRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: headers.map((name) => ({ name, filterButton: true })),
    rows: filas.map((f) => headers.map((h) => f[h])),
  });

  const filaEncabezado = hoja.getRow(1);
  filaEncabezado.height = 22;
  for (let col = 1; col <= headers.length; col++) {
    const celda = filaEncabezado.getCell(col);
    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ENCABEZADO_FILL },
    };
    celda.font = {
      bold: true,
      color: { argb: ENCABEZADO_FONT },
      size: 11,
      name: 'Calibri',
    };
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }

  const colSueldo = headers.indexOf('Sueldo base') + 1;
  const ultimaFila = filas.length + 1;
  for (let row = 2; row <= ultimaFila; row++) {
    hoja.getCell(row, colSueldo).numFmt = '#,##0.00';
  }

  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  descargarBlob(blob, `empleados_${stampFechaArchivo()}.xlsx`);
}
