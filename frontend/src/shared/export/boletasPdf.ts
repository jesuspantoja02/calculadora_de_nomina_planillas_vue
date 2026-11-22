import { jsPDF } from 'jspdf';
import type { Boleta, Pago } from '../../modules/planilla/domain/pago.model';
import { formatoFecha, formatoMoneda, modalidadLabel } from '../formatters';
import { etiquetaSistemaPensiones } from '../pensiones';
import { stampFechaArchivo } from './descargarBlob';

type Linea = { etiqueta: string; valor: string; fuerte?: boolean; descuento?: boolean };

function lineasDeBoleta(b: Boleta): Linea[] {
  const pension = etiquetaSistemaPensiones(b.regimen, b.afp);
  const lineas: Linea[] = [
    { etiqueta: 'Nombre', valor: b.nombre.toUpperCase() },
    { etiqueta: 'DNI', valor: b.dni },
    { etiqueta: 'Cargo', valor: b.cargo },
    { etiqueta: 'Sistema de pensiones', valor: pension },
  ];

  if (b.modalidad === 'Quincena') {
    lineas.push(
      { etiqueta: 'Sueldo básico', valor: formatoMoneda(b.sueldoBase) },
      { etiqueta: 'Adelanto a pagar', valor: formatoMoneda(b.neto), fuerte: true },
    );
    return lineas;
  }

  if (b.modalidad === 'Gratificacion') {
    lineas.push({ etiqueta: 'Sueldo básico', valor: formatoMoneda(b.sueldoBase) });
    if (b.asignacionFamiliar > 0) {
      lineas.push({ etiqueta: 'Asignación familiar', valor: formatoMoneda(b.asignacionFamiliar) });
    }
    lineas.push(
      { etiqueta: `Gratificación (${b.mesesComputables} meses)`, valor: formatoMoneda(b.gratificacion) },
      { etiqueta: 'Bonificación extraordinaria', valor: formatoMoneda(b.bonificacionExtraordinaria) },
      { etiqueta: 'Neto a pagar', valor: formatoMoneda(b.neto), fuerte: true },
    );
    return lineas;
  }

  if (b.modalidad === 'CTS') {
    lineas.push(
      { etiqueta: 'Sueldo básico', valor: formatoMoneda(b.sueldoBase) },
      ...(b.asignacionFamiliar > 0
        ? [{ etiqueta: 'Asignación familiar', valor: formatoMoneda(b.asignacionFamiliar) }]
        : []),
      { etiqueta: 'Remuneración computable', valor: formatoMoneda(b.remuneracionComputable) },
      {
        etiqueta: `Tiempo (${b.mesesComputables} m / ${b.diasComputables} d)`,
        valor: formatoMoneda(b.cts),
      },
      { etiqueta: 'CTS a depositar', valor: formatoMoneda(b.neto), fuerte: true },
    );
    return lineas;
  }

  // Mensual
  lineas.push({ etiqueta: 'Sueldo básico', valor: formatoMoneda(b.sueldoBase) });
  if (b.asignacionFamiliar > 0) {
    lineas.push({ etiqueta: 'Asignación familiar', valor: formatoMoneda(b.asignacionFamiliar) });
  }
  if (b.pagoHoras25 > 0) {
    lineas.push({
      etiqueta: `Horas extra 25 % (${b.horasExtra25} h)`,
      valor: formatoMoneda(b.pagoHoras25),
    });
  }
  if (b.pagoHoras35 > 0) {
    lineas.push({
      etiqueta: `Horas extra 35 % (${b.horasExtra35} h)`,
      valor: formatoMoneda(b.pagoHoras35),
    });
  }
  if (b.pagoDescanso > 0) {
    lineas.push({
      etiqueta: `Descanso o feriado (${b.horasDescanso} h)`,
      valor: formatoMoneda(b.pagoDescanso),
    });
  }
  lineas.push({ etiqueta: 'Sueldo bruto', valor: formatoMoneda(b.bruto), fuerte: true });
  lineas.push({ etiqueta: 'Adelanto quincenal', valor: formatoMoneda(b.adelanto), descuento: true });

  if (b.regimen === 'AFP') {
    lineas.push(
      { etiqueta: `Aporte obligatorio (${pension})`, valor: formatoMoneda(b.aporteAfp), descuento: true },
      { etiqueta: `Prima de seguro (${pension})`, valor: formatoMoneda(b.primaSeguro), descuento: true },
    );
    if (b.comisionAfp > 0) {
      lineas.push({
        etiqueta: `Comisión (${pension})`,
        valor: formatoMoneda(b.comisionAfp),
        descuento: true,
      });
    }
  } else {
    lineas.push({
      etiqueta: `${pension}`,
      valor: formatoMoneda(b.pension),
      descuento: true,
    });
  }

  if (b.descuentoTardanza > 0) {
    lineas.push({
      etiqueta: `Tardanzas (${b.minutosTardanza} min)`,
      valor: formatoMoneda(b.descuentoTardanza),
      descuento: true,
    });
  }
  if (b.descuentoFalta > 0) {
    lineas.push({
      etiqueta: `Faltas (${b.diasFalta} días)`,
      valor: formatoMoneda(b.descuentoFalta),
      descuento: true,
    });
  }
  if (b.quintaCategoria > 0) {
    lineas.push({
      etiqueta: 'Retención 5.ª categoría',
      valor: formatoMoneda(b.quintaCategoria),
      descuento: true,
    });
  }

  lineas.push({ etiqueta: 'Neto a pagar', valor: formatoMoneda(b.neto), fuerte: true });
  return lineas;
}

function dibujarPagina(doc: jsPDF, b: Boleta): void {
  const margen = 18;
  const ancho = doc.internal.pageSize.getWidth();
  let y = 22;

  doc.setFillColor(15, 94, 189);
  doc.rect(0, 0, ancho, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(b.empresaNombre || 'Planilla Nómina', margen, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RUC ${b.empresaRuc || '—'}`, margen, 20);
  doc.text('Boleta de pago', ancho - margen, 12, { align: 'right' });
  doc.text(`${modalidadLabel(b.modalidad)} · ${formatoFecha(b.fechaPago)}`, ancho - margen, 20, {
    align: 'right',
  });

  y = 40;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Detalle de la boleta', margen, y);
  y += 8;

  doc.setDrawColor(213, 219, 230);
  doc.setLineWidth(0.3);

  for (const linea of lineasDeBoleta(b)) {
    if (y > doc.internal.pageSize.getHeight() - 24) {
      doc.addPage();
      y = 22;
    }
    if (linea.fuerte) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (linea.descuento) doc.setTextColor(185, 28, 28);
      else doc.setTextColor(71, 85, 105);
    }
    doc.text(linea.etiqueta, margen, y);
    if (linea.descuento) doc.setTextColor(185, 28, 28);
    else doc.setTextColor(15, 23, 42);
    doc.text(linea.valor, ancho - margen, y, { align: 'right' });
    y += 7;
    doc.setDrawColor(230, 234, 241);
    doc.line(margen, y - 4.5, ancho - margen, y - 4.5);
  }

  if (b.modalidad === 'Mensual' && b.essaludEmpleador > 0) {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `EsSalud del empleador: ${formatoMoneda(b.essaludEmpleador)}. No se descuenta al trabajador.`,
      margen,
      y,
      { maxWidth: ancho - margen * 2 },
    );
  }

  const pieY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento generado por Planilla — Nómina Perú', margen, pieY);
  doc.text(stampFechaArchivo(), ancho - margen, pieY, { align: 'right' });
}

function nombreArchivo(boletas: Boleta[]): string {
  if (boletas.length === 1) {
    const b = boletas[0];
    const safe = b.nombre.replace(/[^\w\-]+/g, '_').slice(0, 40);
    return `boleta_${safe}_${b.fechaPago}.pdf`;
  }
  return `boletas_${stampFechaArchivo()}.pdf`;
}

/** Genera PDF de una o varias boletas (una página por boleta). */
export function exportarBoletasPdf(boletas: Array<Boleta | Pago>): void {
  if (boletas.length === 0) return;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  boletas.forEach((b, i) => {
    if (i > 0) doc.addPage();
    dibujarPagina(doc, b);
  });
  doc.save(nombreArchivo(boletas));
}
