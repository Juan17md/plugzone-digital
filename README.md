<div align="center">
  <h1>⚡ PlugZone Admin</h1>
  <p><strong>Panel de Administración — Inventario, Ventas y Finanzas</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

---

## 🌟 Visión General

**PlugZone Admin** es un panel de administración completo para el control operativo de una tienda de tecnología móvil. Construido con **Next.js (App Router)**, **React 19** y **TypeScript**, centraliza la gestión de inventario, la registración de ventas y gastos, el seguimiento financiero y la administración de usuarios en una única interfaz moderna con estética *Midnight Titanium* y soporte total para modo claro y oscuro.

El sistema opera sobre **Firebase** (Authentication + Firestore), con autenticación por roles (admin / operador) y reglas de seguridad que restringen el acceso exclusivamente a usuarios autorizados.

## ✨ Características Principales

- **📊 Dashboard Ejecutivo**: KPIs en tiempo real — ventas del día, ganancia neta, transacciones, equipos registrados, alertas de stock y widget de la Tasa BCV.
- **📦 Inventario Inteligente**: Control de stock con estados visuales dinámicos (Disponible, Crítico, Agotado), búsqueda, edición y baja de productos.
- **💸 Finanzas**: KPIs financieros (balance neto, egresos), tabla de egresos de la semana y gráficas interactivas (Recharts) para el análisis de rentabilidad.
- **🛒 Ventas y Gastos**: Registro atómico con desglose de cuotas (Bs./USD), cálculo automático de ganancia y restauración de stock al anular operaciones.
- **📜 Historial Completo**: Trazabilidad de todas las operaciones con **exportación a Excel (.xlsx)** y **PDF** (ventas y gastos).
- **👥 Gestión de Usuarios**: Alta, edición y asignación de roles (admin / operador) con validación de permisos por módulo.
- **🔔 Notificaciones Toast**: Feedback inmediato y accesible (ARIA) para todas las operaciones críticas.
- **🎨 Sistema de Diseño Propio**: Paleta *Midnight Titanium* con tokens CSS, glassmorphism, modales tipo Bottom Sheet con animaciones fluidas y experiencia Mobile-First.
- **♿ Accesibilidad**: Roles ARIA, etiquetas descriptivas, foco visible y navegación por teclado en todos los modales y formularios.
- **🚀 Despliegue optimizado**: Configuración para Vercel con cabeceras de seguridad HTTP (CSP, frame y MIME protections).

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Estilos** | Tailwind CSS v4, tokens CSS fluidos (modo claro/oscuro) |
| **Backend** | Firebase Authentication + Cloud Firestore (SDK Admin) |
| **Gráficas** | Recharts |
| **Iconografía** | Lucide React |
| **Deploy** | Vercel (serverless, render estático + dinámico) |

## 🏗️ Arquitectura

- **App Router** con Server Components para páginas estáticas y rutas dinámicas bajo demanda.
- **Context API** (`TiendaContext`) como capa de sincronización de estado entre módulos.
- **Error Boundaries** granulares (`error.tsx`, `global-error.tsx`) para resiliencia de la interfaz.
- **Servicios Serverless** (`/api`) con `firebase-admin` para operaciones privilegiadas (creación de usuarios y roles).
- **PWA-ready**: manifest con íconos personalizados y metas móviles instalables.

## 📐 Decisiones de Diseño (UI/UX)

- **Desktop**: barra lateral persistente que agiliza la navegación entre módulos, ideal para auditorías de finanzas.
- **Mobile**: menú de navegación inferior táctil y modales *Bottom Sheet* adaptativos con *safe areas* para dispositivos con gestos modernos.
- **Consistencia visual**: patrón unificado de modales (cabecera, cuerpo y barra de acciones) en toda la aplicación.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── login/            # Autenticación de propietario
│   ├── dashboard/        # KPIs y resumen ejecutivo
│   ├── inventario/       # Gestión de productos y stock
│   ├── ventas/           # Registro de ventas con cuotas
│   ├── gastos/           # Registro de gastos operativos
│   ├── finanzas/         # KPIs financieros y gráficas
│   ├── historial/        # Trazabilidad y exportación
│   ├── usuarios/         # Administración de usuarios y roles
│   └── cambiar-contrasena/ # Seguridad de cuenta
├── components/           # UI modular (modales, tablas, toasts)
├── context/              # TiendaContext (estado global)
├── services/             # Clientes de Firebase
└── utils/                # Exportadores Excel/PDF y helpers
```

## 📄 Licencia

Proyecto de uso privado — **PlugZone**. Todos los derechos reservados.

---

<div align="center">
  <sub>Desarrollado con Next.js, TypeScript y mucho ☕ — PlugZone Digital</sub>
</div>
