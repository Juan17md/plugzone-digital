import ExcelJS from 'exceljs';
import { Producto, Venta, GastoOperativo, CierreCaja, esVentaMultiProducto } from '@/types';
import { obtenerDescripcionGasto } from '@/utils/gastos';
import { METODOS_PAGO } from '@/utils/caja';

/**
 * Función auxiliar para formatear fechas de manera legible en Excel
 */
const formatearFechaExcel = (isoString?: string): string => {
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
 * Aplica estilos estándar de encabezado a la primera fila de una hoja de Excel
 */
const aplicarEstilosEncabezado = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate Oscuro de Marca
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF06B6D4' } }, // Borde Cyan de acento
    };
  });
};

/**
 * Aplica bordes limpios y alineación a las filas de datos
 */
const aplicarEstilosFilas = (worksheet: ExcelJS.Worksheet, startRow: number = 2) => {
  for (let r = startRow; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    row.height = 20;
    row.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  }
};

/**
 * Agrega y aplica estilo a una fila de Totales en la parte inferior
 */
const aplicarFilaTotales = (row: ExcelJS.Row) => {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // Gris claro de fondo
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
    cell.alignment = { vertical: 'middle' };
  });
};

/**
 * Descarga el archivo de Excel generado en el navegador
 */
const descargarArchivo = async (workbook: ExcelJS.Workbook, nombreArchivo: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${nombreArchivo}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

// ==========================================
// EXPORTACIÓN DE INVENTARIO (PRODUCTOS)
// ==========================================
export const exportarProductosExcel = async (
  productos: Producto[],
  nombreArchivo: string = 'Inventario_PlugZone'
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlugZone Digital';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Inventario de Productos');

  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 16 },
    { header: 'Nombre del Producto', key: 'nombre', width: 36 },
    { header: 'Marca', key: 'marca', width: 16 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'RAM / Almacenamiento', key: 'especificaciones', width: 26 },
    { header: 'Costo Compra ($)', key: 'costoCompra', width: 18 },
    { header: 'Precio Venta ($)', key: 'precioVenta', width: 18 },
    { header: 'Stock Actual', key: 'stockActual', width: 14 },
    { header: 'Stock Mínimo', key: 'stockMinimo', width: 14 },
    { header: 'Valor Total Stock ($)', key: 'valorTotal', width: 22 },
    { header: 'Estado Stock', key: 'estadoStock', width: 18 },
  ];

  aplicarEstilosEncabezado(worksheet);

  let totalStock = 0;
  let valorTotalInventario = 0;

  productos.forEach((p) => {
    const especificaciones = [p.ram ? `RAM: ${p.ram}` : '', p.almacenamiento ? `ROM: ${p.almacenamiento}` : '']
      .filter(Boolean)
      .join(' | ');

    const valorTotal = (p.costoCompra || 0) * (p.stockActual || 0);
    totalStock += p.stockActual || 0;
    valorTotalInventario += valorTotal;

    const stock = p.stockActual || 0;
    const estaBajo = stock <= (p.stockMinimo || 0);
    const estadoStock = stock <= 0 ? 'AGOTADO' : estaBajo ? 'CRÍTICO' : 'NORMAL';

    const row = worksheet.addRow({
      sku: p.sku,
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,
      especificaciones: especificaciones || 'N/A',
      costoCompra: p.costoCompra,
      precioVenta: p.precioVenta,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      valorTotal: valorTotal,
      estadoStock: estadoStock,
    });

    // Formatos de celdas
    row.getCell('costoCompra').numFmt = '"$"#,##0.00';
    row.getCell('precioVenta').numFmt = '"$"#,##0.00';
    row.getCell('valorTotal').numFmt = '"$"#,##0.00';
    row.getCell('stockActual').numFmt = '#,##0';
    row.getCell('stockMinimo').numFmt = '#,##0';

    // Alineación
    row.getCell('sku').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('categoria').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('stockActual').alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell('stockMinimo').alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell('estadoStock').alignment = { horizontal: 'center', vertical: 'middle' };

    // Highlight stock según estado (AGOTADO coral / CRÍTICO ámbar)
    if (estadoStock === 'AGOTADO') {
      row.getCell('estadoStock').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFF4949' } };
    } else if (estadoStock === 'CRÍTICO') {
      row.getCell('estadoStock').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFF9F43' } };
    }
  });

  aplicarEstilosFilas(worksheet);

  // Fila de Totales
  const totalRow = worksheet.addRow({
    sku: 'TOTALES',
    nombre: `Total de ${productos.length} productos`,
    marca: '',
    categoria: '',
    especificaciones: '',
    costoCompra: '',
    precioVenta: '',
    stockActual: totalStock,
    stockMinimo: '',
    valorTotal: valorTotalInventario,
    estadoStock: '',
  });

  totalRow.getCell('valorTotal').numFmt = '"$"#,##0.00';
  totalRow.getCell('stockActual').numFmt = '#,##0';
  totalRow.getCell('stockActual').alignment = { horizontal: 'right', vertical: 'middle' };

  aplicarFilaTotales(totalRow);

  await descargarArchivo(workbook, nombreArchivo);
};

// ==========================================
// EXPORTACIÓN DE HISTORIAL DE VENTAS (DESGLOSADO)
// ==========================================
export const exportarVentasExcel = async (
  ventas: Venta[],
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Historial_Ventas_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlugZone Digital';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Ventas Desglosadas');

  worksheet.columns = [
    { header: 'Fecha y Hora', key: 'fecha', width: 25 },
    { header: 'Cliente', key: 'cliente', width: 22 },
    { header: 'Cédula / RIF', key: 'cedula', width: 16 },
    { header: 'Producto Vendido', key: 'producto', width: 30 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Precio Unitario ($)', key: 'precioUnitario', width: 18 },
    { header: 'Total Venta ($)', key: 'totalUSD', width: 18 },
    { header: 'Total Venta (Bs)', key: 'totalBS', width: 20 },
    { header: 'Ganancia Neta ($)', key: 'gananciaNeta', width: 18 },
    { header: 'Método de Pago', key: 'metodoPago', width: 18 },
    { header: 'Estado', key: 'estado', width: 18 },
  ];

  aplicarEstilosEncabezado(worksheet);

  let totalUnidades = 0;
  let totalUSDVendido = 0;
  let totalBSVendido = 0;
  let totalGananciaNeta = 0;

  ventas.forEach((v) => {
    const esAnulada = !!v.anulada;

    const procesarFila = (
      nombreProducto: string,
      cantidad: number,
      precioUnitario: number,
      totalUSD: number,
      gananciaNeta: number
    ) => {
      const totalBS = totalUSD * tasa;

      if (!esAnulada) {
        totalUnidades += cantidad;
        totalUSDVendido += totalUSD;
        totalBSVendido += totalBS;
        totalGananciaNeta += gananciaNeta;
      }

      const row = worksheet.addRow({
        fecha: formatearFechaExcel(v.fecha),
        cliente: v.nombreCliente || 'Cliente General',
        cedula: v.cedulaCliente || 'N/A',
        producto: nombreProducto,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        totalUSD: totalUSD,
        totalBS: totalBS,
        gananciaNeta: gananciaNeta,
        metodoPago: v.metodoPago,
        estado: esAnulada ? 'ANULADA' : 'COMPLETADA',
      });

      row.getCell('precioUnitario').numFmt = '"$"#,##0.00';
      row.getCell('totalUSD').numFmt = '"$"#,##0.00';
      row.getCell('totalBS').numFmt = '"Bs. "#,##0.00';
      row.getCell('gananciaNeta').numFmt = '"$"#,##0.00';
      row.getCell('cantidad').numFmt = '#,##0';

      row.getCell('fecha').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('cantidad').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('metodoPago').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('estado').alignment = { horizontal: 'center', vertical: 'middle' };

      if (esAnulada) {
        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 10, strike: true, color: { argb: 'FF94A3B8' } };
        });
        row.getCell('estado').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
      }
    };

    if (esVentaMultiProducto(v)) {
      v.items!.forEach((item) => {
        procesarFila(
          item.nombreProducto,
          item.cantidadVendida,
          item.precioVentaFinal,
          item.precioVentaFinal * item.cantidadVendida,
          item.gananciaNeta
        );
      });
    } else {
      const cantidad = v.cantidadVendida || 1;
      const precio = v.precioVentaFinal || 0;
      procesarFila(
        v.nombreProducto,
        cantidad,
        precio,
        precio * cantidad,
        v.gananciaNeta || 0
      );
    }
  });

  aplicarEstilosFilas(worksheet);

  // Fila de Totales
  const totalRow = worksheet.addRow({
    fecha: 'TOTALES',
    cliente: `Ventas procesadas: ${ventas.filter(v => !v.anulada).length}`,
    cedula: '',
    producto: '',
    cantidad: totalUnidades,
    precioUnitario: '',
    totalUSD: totalUSDVendido,
    totalBS: totalBSVendido,
    gananciaNeta: totalGananciaNeta,
    metodoPago: `Tasa BCV: ${tasa.toFixed(2)}`,
    estado: '',
  });

  totalRow.getCell('totalUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('totalBS').numFmt = '"Bs. "#,##0.00';
  totalRow.getCell('gananciaNeta').numFmt = '"$"#,##0.00';
  totalRow.getCell('cantidad').numFmt = '#,##0';

  aplicarFilaTotales(totalRow);

  await descargarArchivo(workbook, nombreArchivo);
};

// ==========================================
// EXPORTACIÓN DE GASTOS OPERATIVOS
// ==========================================
export const exportarGastosExcel = async (
  gastos: GastoOperativo[],
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Gastos_Operativos_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlugZone Digital';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Gastos Operativos');

  worksheet.columns = [
    { header: 'ID Gasto', key: 'id', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 25 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Descripción / Concepto', key: 'descripcion', width: 42 },
    { header: 'Monto ($)', key: 'montoUSD', width: 18 },
    { header: 'Monto (Bs)', key: 'montoBS', width: 22 },
  ];

  aplicarEstilosEncabezado(worksheet);

  let totalGastosUSD = 0;
  let totalGastosBS = 0;

  gastos.forEach((g) => {
    const montoUSD = g.monto || 0;
    const montoBS = montoUSD * tasa;
    totalGastosUSD += montoUSD;
    totalGastosBS += montoBS;

    const desc = obtenerDescripcionGasto(g);

    const row = worksheet.addRow({
      id: g.id ? `#${g.id.slice(-6).toUpperCase()}` : 'N/A',
      fecha: formatearFechaExcel(g.fecha),
      categoria: g.categoria || 'Otros',
      descripcion: desc,
      montoUSD: montoUSD,
      montoBS: montoBS,
    });

    row.getCell('montoUSD').numFmt = '"$"#,##0.00';
    row.getCell('montoBS').numFmt = '"Bs. "#,##0.00';

    row.getCell('id').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('fecha').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('categoria').alignment = { horizontal: 'center', vertical: 'middle' };
  });

  aplicarEstilosFilas(worksheet);

  // Fila de Totales
  const totalRow = worksheet.addRow({
    id: 'TOTALES',
    fecha: '',
    categoria: `Gastos: ${gastos.length}`,
    descripcion: '',
    montoUSD: totalGastosUSD,
    montoBS: totalGastosBS,
  });

  totalRow.getCell('montoUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('montoBS').numFmt = '"Bs. "#,##0.00';

  aplicarFilaTotales(totalRow);

  await descargarArchivo(workbook, nombreArchivo);
};

// ==========================================
// EXPORTACIÓN DE REPORTE FINANCIERO SEMANAL
// ==========================================
export const exportarReporteFinancieroExcel = async (
  ventasSemana: Venta[],
  gastosSemana: GastoOperativo[],
  semanaTexto: string,
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Reporte_Financiero_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlugZone Digital';
  workbook.created = new Date();

  // ----------------------------------------------------
  // HOJA 1: RESUMEN Y BALANCE GENERAL
  // ----------------------------------------------------
  const wsResumen = workbook.addWorksheet('Resumen de Balance');

  const ventasValidas = ventasSemana.filter((v) => !v.anulada);
  const ingresosBrutos = ventasValidas.reduce(
    (acc, v) => acc + (v.precioVentaFinal || 0) * (v.cantidadVendida || 1),
    0
  );
  const gananciaOperativa = ventasValidas.reduce((acc, v) => acc + (v.gananciaNeta || 0), 0);
  const totalGastos = gastosSemana.reduce((acc, g) => acc + (g.monto || 0), 0);
  const balanceNeto = gananciaOperativa - totalGastos;

  wsResumen.columns = [
    { header: 'Métrica Financiera', key: 'metrica', width: 36 },
    { header: 'Monto ($)', key: 'montoUSD', width: 24 },
    { header: 'Monto en Bolívares (Bs)', key: 'montoBS', width: 28 },
  ];

  aplicarEstilosEncabezado(wsResumen);

  const metricas = [
    { metrica: `Período Evaluado`, montoUSD: semanaTexto, montoBS: `Tasa BCV: Bs. ${tasa.toFixed(2)}` },
    { metrica: 'Ingresos Brutos por Ventas', montoUSD: ingresosBrutos, montoBS: ingresosBrutos * tasa },
    { metrica: 'Ganancia Operativa Neta (Ventas)', montoUSD: gananciaOperativa, montoBS: gananciaOperativa * tasa },
    { metrica: 'Gastos Operativos Totales', montoUSD: totalGastos, montoBS: totalGastos * tasa },
    { metrica: 'BALANCE FINAL NETO', montoUSD: balanceNeto, montoBS: balanceNeto * tasa },
  ];

  metricas.forEach((m, idx) => {
    const row = wsResumen.addRow(m);
    if (idx > 0) {
      if (typeof m.montoUSD === 'number') {
        row.getCell('montoUSD').numFmt = '"$"#,##0.00';
        row.getCell('montoBS').numFmt = '"Bs. "#,##0.00';
      }
    }
  });

  aplicarEstilosFilas(wsResumen);

  // Destacar Fila de Balance Final
  const balanceRow = wsResumen.getRow(6);
  aplicarFilaTotales(balanceRow);

  // ----------------------------------------------------
  // HOJA 2: VENTAS DE LA SEMANA (DESGLOSADO)
  // ----------------------------------------------------
  const wsVentas = workbook.addWorksheet('Ventas de la Semana');
  wsVentas.columns = [
    { header: 'ID Venta', key: 'id', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 25 },
    { header: 'Cliente', key: 'cliente', width: 24 },
    { header: 'Producto', key: 'producto', width: 34 },
    { header: 'Cant.', key: 'cantidad', width: 12 },
    { header: 'Precio ($)', key: 'precio', width: 18 },
    { header: 'Total ($)', key: 'totalUSD', width: 18 },
    { header: 'Ganancia ($)', key: 'ganancia', width: 18 },
    { header: 'Método Pago', key: 'metodo', width: 18 },
  ];
  aplicarEstilosEncabezado(wsVentas);

  ventasValidas.forEach((v) => {
    if (esVentaMultiProducto(v)) {
      v.items!.forEach((item) => {
        const totalUSD = item.precioVentaFinal * item.cantidadVendida;
        const r = wsVentas.addRow({
          id: v.id ? `#${v.id.slice(-6).toUpperCase()}` : 'N/A',
          fecha: formatearFechaExcel(v.fecha),
          cliente: v.nombreCliente || 'Cliente General',
          producto: item.nombreProducto,
          cantidad: item.cantidadVendida,
          precio: item.precioVentaFinal,
          totalUSD: totalUSD,
          ganancia: item.gananciaNeta,
          metodo: v.metodoPago,
        });
        r.getCell('precio').numFmt = '"$"#,##0.00';
        r.getCell('totalUSD').numFmt = '"$"#,##0.00';
        r.getCell('ganancia').numFmt = '"$"#,##0.00';
      });
    } else {
      const totalUSD = (v.precioVentaFinal || 0) * (v.cantidadVendida || 1);
      const r = wsVentas.addRow({
        id: v.id ? `#${v.id.slice(-6).toUpperCase()}` : 'N/A',
        fecha: formatearFechaExcel(v.fecha),
        cliente: v.nombreCliente || 'Cliente General',
        producto: v.nombreProducto,
        cantidad: v.cantidadVendida || 1,
        precio: v.precioVentaFinal || 0,
        totalUSD: totalUSD,
        ganancia: v.gananciaNeta || 0,
        metodo: v.metodoPago,
      });
      r.getCell('precio').numFmt = '"$"#,##0.00';
      r.getCell('totalUSD').numFmt = '"$"#,##0.00';
      r.getCell('ganancia').numFmt = '"$"#,##0.00';
    }
  });
  aplicarEstilosFilas(wsVentas);

  // ----------------------------------------------------
  // HOJA 3: GASTOS DE LA SEMANA
  // ----------------------------------------------------
  const wsGastos = workbook.addWorksheet('Gastos de la Semana');
  wsGastos.columns = [
    { header: 'ID Gasto', key: 'id', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 25 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Descripción', key: 'descripcion', width: 42 },
    { header: 'Monto ($)', key: 'montoUSD', width: 18 },
  ];
  aplicarEstilosEncabezado(wsGastos);

  gastosSemana.forEach((g) => {
    const desc = obtenerDescripcionGasto(g);
    const r = wsGastos.addRow({
      id: g.id ? `#${g.id.slice(-6).toUpperCase()}` : 'N/A',
      fecha: formatearFechaExcel(g.fecha),
      categoria: g.categoria || 'Otros',
      descripcion: desc,
      montoUSD: g.monto || 0,
    });
    r.getCell('montoUSD').numFmt = '"$"#,##0.00';
  });
  aplicarEstilosFilas(wsGastos);

  await descargarArchivo(workbook, nombreArchivo);
};

// ==========================================
// EXPORTACIÓN DE CIERRE DE CAJA SEMANAL
// ==========================================
export const exportarCierreExcel = async (
  cierre: CierreCaja,
  tasaBCV: number | null = 1,
  nombreArchivo: string = 'Cierre_Caja_PlugZone'
) => {
  const tasa = tasaBCV ?? 1;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlugZone Digital';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Cierre de Caja');

  ws.columns = [
    { header: 'Método de Pago', key: 'metodo', width: 24 },
    { header: 'Ventas ($)', key: 'ventasUSD', width: 16 },
    { header: 'Ventas (Bs)', key: 'ventasBS', width: 18 },
    { header: 'Retiros ($)', key: 'retirosUSD', width: 16 },
    { header: 'Gastos ($)', key: 'gastosUSD', width: 16 },
    { header: 'Saldo Esperado ($)', key: 'saldoUSD', width: 20 },
    { header: 'Contado Real ($)', key: 'arqueoUSD', width: 18 },
    { header: 'Diferencia ($)', key: 'diferenciaUSD', width: 18 },
  ];

  aplicarEstilosEncabezado(ws);

  METODOS_PAGO.forEach(({ value, label }) => {
    const ventas = cierre.montosVentas?.[value] ?? 0;
    const retiros = cierre.montosRetiros?.[value] ?? 0;
    const gastos = cierre.montosGastos?.[value] ?? 0;
    const saldo = cierre.saldoEsperado?.[value] ?? 0;
    const arqueo = cierre.arqueoReal?.[value] ?? 0;
    const diferencia = cierre.diferencia?.[value] ?? 0;
    if (ventas === 0 && retiros === 0 && gastos === 0 && arqueo === 0) return;

    const row = ws.addRow({
      metodo: label,
      ventasUSD: ventas,
      ventasBS: ventas * tasa,
      retirosUSD: retiros,
      gastosUSD: gastos,
      saldoUSD: saldo,
      arqueoUSD: arqueo,
      diferenciaUSD: diferencia,
    });

    row.getCell('ventasUSD').numFmt = '"$"#,##0.00';
    row.getCell('ventasBS').numFmt = '"Bs. "#,##0.00';
    row.getCell('retirosUSD').numFmt = '"$"#,##0.00';
    row.getCell('gastosUSD').numFmt = '"$"#,##0.00';
    row.getCell('saldoUSD').numFmt = '"$"#,##0.00';
    row.getCell('arqueoUSD').numFmt = '"$"#,##0.00';
    row.getCell('diferenciaUSD').numFmt = '"$"#,##0.00';
    row.getCell('metodo').alignment = { horizontal: 'left', vertical: 'middle' };
  });

  aplicarEstilosFilas(ws);

  // Fila de Totales
  const totalRow = ws.addRow({
    metodo: 'TOTALES',
    ventasUSD: cierre.totalVentas ?? 0,
    ventasBS: (cierre.totalVentas ?? 0) * tasa,
    retirosUSD: cierre.totalRetiros ?? 0,
    gastosUSD: cierre.totalGastos ?? 0,
    saldoUSD: cierre.totalEsperado ?? 0,
    arqueoUSD: cierre.totalArqueo ?? 0,
    diferenciaUSD: cierre.totalDiferencia ?? 0,
  });

  totalRow.getCell('ventasUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('ventasBS').numFmt = '"Bs. "#,##0.00';
  totalRow.getCell('retirosUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('gastosUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('saldoUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('arqueoUSD').numFmt = '"$"#,##0.00';
  totalRow.getCell('diferenciaUSD').numFmt = '"$"#,##0.00';

  aplicarFilaTotales(totalRow);

  await descargarArchivo(workbook, nombreArchivo);
};
