'use client'

import { useMemo } from 'react'
import { Venta } from '@/types'
import { useTheme } from '@/components/providers/ThemeProvider'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, CartesianGrid,
} from 'recharts'

interface Props {
  ventas: Venta[]
}

const METODO_COLORS: Record<string, string> = {
  Efectivo: '#10B981',
  'Pago Móvil': '#00F2FE',
  Transferencia: '#FF9F43',
  Tarjeta: '#8B5CF6',
  Punto: '#F472B6',
  Zelle: '#6366F1',
}

export default function ChartsFinanzas({ ventas }: Props) {
  const { theme } = useTheme()

  const semanales = useMemo(() => {
    const semanas: Record<string, number> = {}
    const ahora = new Date()
    const hace8semanas = new Date(ahora.getTime() - 56 * 24 * 60 * 60 * 1000)

    ventas.forEach(v => {
      const f = new Date(v.fecha)
      if (f < hace8semanas) return
      const inicioSemana = new Date(f)
      inicioSemana.setDate(f.getDate() - f.getDay())
      const key = inicioSemana.toISOString().slice(0, 10)
      semanas[key] = (semanas[key] || 0) + v.cantidadVendida * v.precioVentaFinal
    })

    return Object.entries(semanas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, total], i) => ({
        semana: `Sem ${i + 1}`,
        total: Math.round(total * 100) / 100,
      }))
  }, [ventas])

  const metodosPago = useMemo(() => {
    const agrupado: Record<string, number> = {}
    ventas.forEach(v => {
      agrupado[v.metodoPago] = (agrupado[v.metodoPago] || 0) + v.cantidadVendida * v.precioVentaFinal
    })
    return Object.entries(agrupado)
      .map(([metodo, total]) => ({
        metodo,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)
  }, [ventas])

  const topProductos = useMemo(() => {
    const agrupado: Record<string, number> = {}
    ventas.forEach(v => {
      const key = v.nombreProducto
      agrupado[key] = (agrupado[key] || 0) + v.cantidadVendida
    })
    return Object.entries(agrupado)
      .map(([producto, total]) => ({ producto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [ventas])

  const tooltipStyle: React.CSSProperties = {
    background: 'var(--color-titanium-slate)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '8px 12px',
    boxShadow: 'var(--glass-shadow)',
  }

  const gridStroke = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const totalMetodos = useMemo(() => metodosPago.reduce((a, b) => a + b.total, 0), [metodosPago])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

      {/* Ventas Semanales — full width */}
      <div className="lg:col-span-2 glass-panel p-5 md:p-6 rounded-2xl">
        <h3 className="font-plus-jakarta font-bold text-lg text-polar-white mb-4">Ventas Semanales (últimas 8 semanas)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={semanales} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="semana" tick={{ fill: 'var(--color-muted-gray)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-muted-gray)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--color-polar-white)' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-electric-cyan)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--color-electric-cyan)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'var(--color-electric-cyan)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución por Método de Pago */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <h3 className="font-plus-jakarta font-bold text-lg text-polar-white mb-4">Distribución por Método de Pago</h3>
        <div className="h-72 flex items-center justify-center">
          {metodosPago.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metodosPago}
                  dataKey="total"
                  nameKey="metodo"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  labelLine={false}
                  label={({ payload, cx, x, y }) => {
                    const pct = ((payload.total / totalMetodos) * 100).toFixed(1)
                    return (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="var(--color-polar-white)" fontSize={12} fontWeight={700}>
                        {pct}%
                      </text>
                    )
                  }}
                >
                  {metodosPago.map(entry => (
                    <Cell key={entry.metodo} fill={METODO_COLORS[entry.metodo] || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--color-polar-white)' }}
                  formatter={(value) => {
                    const pct = ((Number(value) / totalMetodos) * 100).toFixed(1)
                    return [`$${Number(value).toFixed(2)} (${pct}%)`, 'Total']
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-gray text-sm">Sin datos de ventas</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {metodosPago.map(m => (
            <span key={m.metodo} className="flex items-center gap-1.5 text-xs text-muted-gray">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: METODO_COLORS[m.metodo] || '#6366F1' }} />
              {m.metodo}
            </span>
          ))}
        </div>
      </div>

      {/* Top Productos Más Vendidos */}
      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <h3 className="font-plus-jakarta font-bold text-lg text-polar-white mb-4">Productos Más Vendidos</h3>
        <div className="h-72">
          {topProductos.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--color-muted-gray)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="producto"
                  tick={{ fill: 'var(--color-polar-white)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--color-muted-gray)' }}
                  formatter={(value) => [`${value} und.`, 'Cantidad']}
                />
                <Bar dataKey="total" fill="var(--color-neon-amber)" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-gray text-sm">Sin datos de ventas</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
