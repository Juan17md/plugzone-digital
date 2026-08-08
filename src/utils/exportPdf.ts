import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Producto, Venta, GastoOperativo, CierreCaja, esVentaMultiProducto } from '@/types';
import { obtenerDescripcionGasto } from '@/utils/gastos';
import { METODOS_PAGO } from '@/utils/caja';

/**
 * Formatea una fecha ISO a un formato legible en español para los PDF
 */
const formatearFechaPdf = (isoString?: string): string => {
  if (!isoString) return 'Sin fecha';
  const fecha = new Date(isoString);
  if (isNaN(fecha.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
};

/**
 * Carga el logo oficial desde la carpeta pública y lo convierte a Data URL Base64
 */
const cargarLogoBase64 = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = '/logo_sin_fondo.PNG';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Agrega el encabezado corporativo estandarizado con Logo a un documento PDF
 */
const agregarEncabezadoPdf = (
  doc: jsPDF,
  tituloReporte: string,
  subtitulo: string = '',
  logoBase64?: string | null
) => {
  let startX = 14;

  if (logoBase64) {
    try {
      // Renderizar el logo corporativo de PlugZone
      doc.addImage(logoBase64, 'PNG', 14, 6, 26, 20);
      startX = 44; // Desplazar el texto del título al lado derecho del logo
    } catch (e) {
      console.warn('No se pudo incrustar el logo en el PDF:', e);
    }
  }

  // Título de Marca y Reporte
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate Oscuro #0F172A
  doc.text('PLUGZONE DIGITAL', startX, 14);

  doc.setFontSize(11);
  doc.setTextColor(6, 182, 212); // Cyan de acento #06B6D4
  doc.text(tituloReporte, startX, 20);

  if (subtitulo) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitulo, startX, 25);
  }

  // Fecha de Generación (Alineada a la derecha)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const fechaGeneracion = `Generado el: ${formatearFechaPdf(new Date().toISOString())}`;
  doc.text(fechaGeneracion, doc.internal.pageSize.width - 14, 14, { align: 'right' });

  // Línea divisora Cyan
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.8);
  doc.line(14, 29, doc.internal.pageSize.width - 14, 29);
};

/**
 * Agrega números de página al pie de cada página del PDF
 */
const agregarPieDePagina = (doc: jsPDF) => {
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const textoPie = `Página ${i} de ${totalPages} — PlugZone Digital`;
    doc.text(textoPie, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
  }
};

// ==========================================
// EXPORTACIÓN DE INVENTARIO EN PDF
// ==========================================
export const exportarProductosPdf = async (
  productos: Producto[],
  nombreArchivo: string = 'Inventario_PlugZone'
) => {
  const logoBase64 = await cargarLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  agregarEncabezadoPdf(
    doc,
    'Reporte Catálogo de Inventario',
    `Total de productos listados: ${productos.length}`,
    logoBase64
  );

  let totalStock = 0;
  let valorTotalInventario = 0;

  const tableBody = productos.map((p) => {
    const especificaciones = [p.ram ? `RAM: ${p.ram}` : '', p.almacenamiento ? `ROM: ${p.almacenamiento}` : '']
      .filter(Boolean)
      .join(' | ');

    const valorTotal = (p.costoCompra || 0) * (p.stockActual || 0);
    totalStock += p.stockActual || 0;
    valorTotalInventario += valorTotal;

    const stock = p.stockActual || 0;
    const estaBajo = stock <= (p.stockMinimo || 0);
    const estadoStock = stock <= 0 ? 'AGOTADO' : estaBajo ? 'CRÍTICO' : 'NORMAL';

    return [
      p.sku || 'N/A',
      p.nombre,
      p.marca,
      p.categoria,
      especificaciones || 'N/A',
      `$${(p.costoCompra || 0).toFixed(2)}`,
      `$${(p.precioVenta || 0).toFixed(2)}`,
      `${stock}`,
      `$${valorTotal.toFixed(2)}`,
      estadoStock,
    ];
  });

  const tableFoot = [
    [
      'TOTALES',
      `Total: ${productos.length} prods.`,
      '',
      '',
      '',
      '',
      '',
      `${totalStock}`,
      `$${valorTotalInventario.toFixed(2)}`,
      '',
    ],
  ];

  autoTable(doc, {
    startY: 33,
    head: [['SKU', 'Nombre', 'Marca', 'Categoría', 'Especificaciones', 'Costo ($)', 'PVP ($)', 'Stock', 'Valor Total ($)', 'Estado']],
    body: tableBody,
    foot: tableFoot,
    styles: {
      font: 'Helvetica',
      overflow: 'linebreak', // Salto de línea sin cortar palabras a la mitad
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { cellWidth: 52 }, // Espacio amplio para el nombre del producto
      2: { cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24 },
      4: { cellWidth: 34 }, // Espacio cómodo para RAM / ROM
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 26 },
      9: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        if (data.cell.raw === 'AGOTADO') {
          data.cell.styles.textColor = [255, 73, 73];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'CRÍTICO') {
          data.cell.styles.textColor = [255, 159, 67];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  agregarPieDePagina(doc);
  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// EXPORTACIÓN DE HISTORIAL DE VENTAS EN PDF
// ==========================================
export const exportarVentasPdf = async (
  ventas: Venta[],
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Historial_Ventas_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const logoBase64 = await cargarLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const ventasValidas = ventas.filter((v) => !v.anulada);

  agregarEncabezadoPdf(
    doc,
    'Bitácora Desglosada de Ventas',
    `Ventas activas: ${ventasValidas.length} | Tasa BCV: Bs. ${tasa.toFixed(2)}`,
    logoBase64
  );

  let totalUnidades = 0;
  let totalUSD = 0;
  let totalBS = 0;
  let totalGanancia = 0;

  const tableBody: string[][] = [];

  ventas.forEach((v) => {
    const esAnulada = !!v.anulada;

    if (esVentaMultiProducto(v)) {
      v.items!.forEach((item) => {
        const totalVentaUSD = item.precioVentaFinal * item.cantidadVendida;
        const totalVentaBS = totalVentaUSD * tasa;

        if (!esAnulada) {
          totalUnidades += item.cantidadVendida;
          totalUSD += totalVentaUSD;
          totalBS += totalVentaBS;
          totalGanancia += item.gananciaNeta;
        }

        tableBody.push([
          formatearFechaPdf(v.fecha),
          v.nombreCliente || 'Cliente General',
          item.nombreProducto,
          `${item.cantidadVendida}`,
          `$${item.precioVentaFinal.toFixed(2)}`,
          `$${totalVentaUSD.toFixed(2)}`,
          `Bs. ${totalVentaBS.toFixed(2)}`,
          `$${item.gananciaNeta.toFixed(2)}`,
          v.metodoPago,
          esAnulada ? 'ANULADA' : 'COMPLETADA',
        ]);
      });
    } else {
      const totalVentaUSD = (v.precioVentaFinal || 0) * (v.cantidadVendida || 1);
      const totalVentaBS = totalVentaUSD * tasa;

      if (!esAnulada) {
        totalUnidades += v.cantidadVendida || 1;
        totalUSD += totalVentaUSD;
        totalBS += totalVentaBS;
        totalGanancia += v.gananciaNeta || 0;
      }

      tableBody.push([
        formatearFechaPdf(v.fecha),
        v.nombreCliente || 'Cliente General',
        v.nombreProducto,
        `${v.cantidadVendida || 1}`,
        `$${(v.precioVentaFinal || 0).toFixed(2)}`,
        `$${totalVentaUSD.toFixed(2)}`,
        `Bs. ${totalVentaBS.toFixed(2)}`,
        `$${(v.gananciaNeta || 0).toFixed(2)}`,
        v.metodoPago,
        esAnulada ? 'ANULADA' : 'COMPLETADA',
      ]);
    }
  });

  const tableFoot = [
    [
      'TOTALES',
      `Ventas: ${ventasValidas.length}`,
      '',
      `${totalUnidades}`,
      '',
      `$${totalUSD.toFixed(2)}`,
      `Bs. ${totalBS.toFixed(2)}`,
      `$${totalGanancia.toFixed(2)}`,
      '',
      '',
    ],
  ];

  autoTable(doc, {
    startY: 33,
    head: [['Fecha', 'Cliente', 'Producto', 'Cant.', 'P. Unit ($)', 'Total ($)', 'Total (Bs)', 'Ganancia ($)', 'Método', 'Estado']],
    body: tableBody,
    foot: tableFoot,
    styles: {
      font: 'Helvetica',
      overflow: 'linebreak',
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 36 }, // Ancho suficiente para fecha y hora en 1 sola línea
      1: { cellWidth: 30 },
      2: { cellWidth: 44 }, // Salto de línea limpio sin cortar palabras
      3: { halign: 'right', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 26 }, // Ancho cómodo para COMPLETADA / ANULADA
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowData = data.row.raw as string[];
        if (rowData && rowData[9] === 'ANULADA') {
          data.cell.styles.textColor = [156, 163, 175];
          if (data.column.index === 9) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  agregarPieDePagina(doc);
  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// EXPORTACIÓN DE GASTOS EN PDF
// ==========================================
export const exportarGastosPdf = async (
  gastos: GastoOperativo[],
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Gastos_Operativos_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const logoBase64 = await cargarLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  agregarEncabezadoPdf(
    doc,
    'Reporte de Gastos Operativos',
    `Total de registros: ${gastos.length} | Tasa BCV: Bs. ${tasa.toFixed(2)}`,
    logoBase64
  );

  let totalMontoUSD = 0;
  let totalMontoBS = 0;

  const tableBody = gastos.map((g) => {
    const montoUSD = g.monto || 0;
    const montoBS = montoUSD * tasa;
    totalMontoUSD += montoUSD;
    totalMontoBS += montoBS;

    const desc = obtenerDescripcionGasto(g);

    return [
      g.id ? `#${g.id.slice(-6).toUpperCase()}` : 'N/A',
      formatearFechaPdf(g.fecha),
      g.categoria || 'Otros',
      desc,
      `$${montoUSD.toFixed(2)}`,
      `Bs. ${montoBS.toFixed(2)}`,
    ];
  });

  const tableFoot = [
    [
      'TOTALES',
      `Egresos: ${gastos.length}`,
      '',
      '',
      `$${totalMontoUSD.toFixed(2)}`,
      `Bs. ${totalMontoBS.toFixed(2)}`,
    ],
  ];

  autoTable(doc, {
    startY: 33,
    head: [['ID Gasto', 'Fecha', 'Categoría', 'Descripción', 'Monto ($)', 'Monto (Bs)']],
    body: tableBody,
    foot: tableFoot,
    styles: {
      font: 'Helvetica',
      overflow: 'linebreak',
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 28 },
      3: { cellWidth: 56 }, // Descripción amplia para salto de línea natural sin cortar palabras
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 26 },
    },
  });

  agregarPieDePagina(doc);
  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// EXPORTACIÓN DE REPORTE FINANCIERO SEMANAL EN PDF
// ==========================================
export const exportarReporteFinancieroPdf = async (
  ventasSemana: Venta[],
  gastosSemana: GastoOperativo[],
  semanaTexto: string,
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Reporte_Financiero_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const logoBase64 = await cargarLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const ventasValidas = ventasSemana.filter((v) => !v.anulada);
  const ingresosBrutos = ventasValidas.reduce(
    (acc, v) => acc + (v.precioVentaFinal || 0) * (v.cantidadVendida || 1),
    0
  );
  const gananciaOperativa = ventasValidas.reduce((acc, v) => acc + (v.gananciaNeta || 0), 0);
  const totalGastos = gastosSemana.reduce((acc, g) => acc + (g.monto || 0), 0);
  const balanceNeto = gananciaOperativa - totalGastos;

  agregarEncabezadoPdf(
    doc,
    'Reporte Operativo Financiero',
    `Período: ${semanaTexto} | Tasa BCV: Bs. ${tasa.toFixed(2)}`,
    logoBase64
  );

  // TABLA 1: RESUMEN DE BALANCE GENERAL
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Resumen de Balance General', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Métrica Financiera', 'Monto ($)', 'Monto en Bolívares (Bs)']],
    body: [
      ['Ingresos Brutos por Ventas', `$${ingresosBrutos.toFixed(2)}`, `Bs. ${(ingresosBrutos * tasa).toFixed(2)}`],
      ['Ganancia Operativa Neta', `$${gananciaOperativa.toFixed(2)}`, `Bs. ${(gananciaOperativa * tasa).toFixed(2)}`],
      ['Gastos Operativos Totales', `$${totalGastos.toFixed(2)}`, `Bs. ${(totalGastos * tasa).toFixed(2)}`],
      ['BALANCE FINAL NETO', `$${balanceNeto.toFixed(2)}`, `Bs. ${(balanceNeto * tasa).toFixed(2)}`],
    ],
    styles: { font: 'Helvetica', overflow: 'linebreak', cellPadding: 2, valign: 'middle' },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 86 },
      1: { halign: 'right', cellWidth: 48 },
      2: { halign: 'right', cellWidth: 48 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        if (data.column.index > 0) {
          data.cell.styles.textColor = balanceNeto >= 0 ? [16, 185, 129] : [239, 68, 68];
        }
      }
    },
  });

  // TABLA 2: DETALLE DE VENTAS DE LA SEMANA
  const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Desglose de Ventas de la Semana', 14, finalY1);

  const ventasBody: string[][] = [];

  ventasValidas.forEach((v) => {
    if (esVentaMultiProducto(v)) {
      v.items!.forEach((item) => {
        const totalVentaUSD = item.precioVentaFinal * item.cantidadVendida;
        ventasBody.push([
          v.id ? `#${v.id.slice(-6).toUpperCase()}` : 'N/A',
          formatearFechaPdf(v.fecha),
          item.nombreProducto,
          `${item.cantidadVendida}`,
          `$${item.precioVentaFinal.toFixed(2)}`,
          `$${totalVentaUSD.toFixed(2)}`,
          v.metodoPago,
        ]);
      });
    } else {
      const totalVentaUSD = (v.precioVentaFinal || 0) * (v.cantidadVendida || 1);
      ventasBody.push([
        v.id ? `#${v.id.slice(-6).toUpperCase()}` : 'N/A',
        formatearFechaPdf(v.fecha),
        v.nombreProducto,
        `${v.cantidadVendida || 1}`,
        `$${(v.precioVentaFinal || 0).toFixed(2)}`,
        `$${totalVentaUSD.toFixed(2)}`,
        v.metodoPago,
      ]);
    }
  });

  autoTable(doc, {
    startY: finalY1 + 4,
    head: [['ID Venta', 'Fecha', 'Producto', 'Cant.', 'Precio Unit.', 'Total ($)', 'Método Pago']],
    body: ventasBody.length > 0 ? ventasBody : [['-', '-', 'Sin ventas registradas en este período', '-', '-', '-', '-']],
    styles: { font: 'Helvetica', overflow: 'linebreak', cellPadding: 2, valign: 'middle' },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18 },
      1: { halign: 'center', cellWidth: 28 },
      2: { cellWidth: 54 },
      3: { halign: 'right', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 24 },
    },
  });

  // TABLA 3: GASTOS DE LA SEMANA
  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Desglose de Gastos de la Semana', 14, finalY2);

  const gastosBody = gastosSemana.map((g) => {
    const desc = obtenerDescripcionGasto(g);
    return [
      g.id ? `#${g.id.slice(-6).toUpperCase()}` : 'N/A',
      formatearFechaPdf(g.fecha),
      g.categoria || 'Otros',
      desc,
      `$${(g.monto || 0).toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: finalY2 + 4,
    head: [['ID Gasto', 'Fecha', 'Categoría', 'Descripción', 'Monto ($)']],
    body: gastosBody.length > 0 ? gastosBody : [['-', '-', '-', 'Sin gastos registrados en este período', '-']],
    styles: { font: 'Helvetica', overflow: 'linebreak', cellPadding: 2, valign: 'middle' },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 28 },
      3: { cellWidth: 80 },
      4: { halign: 'right', cellWidth: 28 },
    },
  });

  agregarPieDePagina(doc);
  doc.save(`${nombreArchivo}.pdf`);
};

// ==========================================
// EXPORTACIÓN DE CIERRE DE CAJA SEMANAL EN PDF
// ==========================================
export const exportarCierrePdf = async (
  cierre: CierreCaja,
  semanaTexto: string,
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Cierre_Caja_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const logoBase64 = await cargarLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const diferenciaTotal = cierre.totalDiferencia ?? 0;

  agregarEncabezadoPdf(
    doc,
    'Cierre de Caja Semanal',
    `Período: ${semanaTexto} | Tasa BCV: Bs. ${tasa.toFixed(2)} | Registrado por: ${cierre.registradoPorEmail ?? '—'}`,
    logoBase64
  );

  // TABLA 1: RESUMEN GENERAL
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Resumen General', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Métrica', 'Monto ($)', 'Monto en Bolívares (Bs)']],
    body: [
      ['Ventas Totales de la Semana', `$${(cierre.totalVentas ?? 0).toFixed(2)}`, `Bs. ${((cierre.totalVentas ?? 0) * tasa).toFixed(2)}`],
      ['Retiros Totales de la Semana', `$${(cierre.totalRetiros ?? 0).toFixed(2)}`, `Bs. ${((cierre.totalRetiros ?? 0) * tasa).toFixed(2)}`],
      ['Gastos Totales de la Semana', `$${(cierre.totalGastos ?? 0).toFixed(2)}`, `Bs. ${((cierre.totalGastos ?? 0) * tasa).toFixed(2)}`],
      ['Saldo Esperado en Caja', `$${(cierre.totalEsperado ?? 0).toFixed(2)}`, `Bs. ${((cierre.totalEsperado ?? 0) * tasa).toFixed(2)}`],
      ['Contado Real (Arqueo)', `$${(cierre.totalArqueo ?? 0).toFixed(2)}`, `Bs. ${((cierre.totalArqueo ?? 0) * tasa).toFixed(2)}`],
      ['DIFERENCIA TOTAL', `$${diferenciaTotal.toFixed(2)}`, `Bs. ${(diferenciaTotal * tasa).toFixed(2)}`],
    ],
    styles: { font: 'Helvetica', overflow: 'linebreak', cellPadding: 2, valign: 'middle' },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 86 },
      1: { halign: 'right', cellWidth: 48 },
      2: { halign: 'right', cellWidth: 48 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 5) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        if (data.column.index > 0) {
          data.cell.styles.textColor = diferenciaTotal >= 0 ? [16, 185, 129] : [239, 68, 68];
        }
      }
    },
  });

  // TABLA 2: DESGLOSE POR MÉTODO DE PAGO
  const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Desglose por Método de Pago', 14, finalY1);
  const bodyFilas: string[][] = [];

  METODOS_PAGO.forEach(({ value, label }) => {
    const ventas = cierre.montosVentas?.[value] ?? 0;
    const retiros = cierre.montosRetiros?.[value] ?? 0;
    const gastos = cierre.montosGastos?.[value] ?? 0;
    const saldo = cierre.saldoEsperado?.[value] ?? 0;
    const arqueo = cierre.arqueoReal?.[value] ?? 0;
    const diferencia = cierre.diferencia?.[value] ?? 0;
    if (ventas === 0 && retiros === 0 && gastos === 0 && arqueo === 0) return;

    bodyFilas.push([
      label,
      `$${ventas.toFixed(2)}`,
      `$${retiros.toFixed(2)}`,
      `$${gastos.toFixed(2)}`,
      `$${saldo.toFixed(2)}`,
      `$${arqueo.toFixed(2)}`,
      `${diferencia > 0 ? '+' : ''}$${diferencia.toFixed(2)}`,
    ]);
  });

  autoTable(doc, {
    startY: finalY1 + 4,
    head: [['Método', 'Ventas ($)', 'Retiros ($)', 'Gastos ($)', 'Saldo Esperado ($)', 'Contado Real ($)', 'Diferencia ($)']],
    body: bodyFilas.length > 0
      ? bodyFilas
      : [['-', '-', '-', '-', '-', 'Sin movimientos en esta semana', '-']],
    styles: { font: 'Helvetica', overflow: 'linebreak', cellPadding: 2, valign: 'middle' },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { halign: 'right', cellWidth: 23 },
      2: { halign: 'right', cellWidth: 23 },
      3: { halign: 'right', cellWidth: 23 },
      4: { halign: 'right', cellWidth: 29 },
      5: { halign: 'right', cellWidth: 29 },
      6: { halign: 'right', cellWidth: 24 },
    },
  });

  // OBSERVACIONES
  if (cierre.observaciones) {
    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Observaciones:', 14, finalY2);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const lineas = doc.splitTextToSize(cierre.observaciones, doc.internal.pageSize.width - 28);
    doc.text(lineas, 14, finalY2 + 6);
  }

  agregarPieDePagina(doc);
  doc.save(`${nombreArchivo}.pdf`);
};
