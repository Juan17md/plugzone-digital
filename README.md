<div align="center">
  <h1>📱 PlugZone Digital</h1>
  <p><strong>Sistema Administrativo y PWA de Inventario, Ventas y Finanzas</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  </p>
</div>

<br />

## 🌟 Visión General

**PlugZone Digital** es una Progressive Web App (PWA) de alto rendimiento diseñada específicamente para el control administrativo de una tienda de tecnología móvil. Desarrollada con un enfoque "Mobile-First", ofrece una experiencia fluida tanto en dispositivos de escritorio como en terminales de mostrador (smartphones y tablets).

El sistema consolida la gestión de inventario, el registro atómico de ventas y el seguimiento del flujo de caja bajo una interfaz "Quiet Luxury", garantizando operaciones rápidas y seguras en el punto de venta.

## ✨ Características Principales

*   **📦 Gestión de Inventario Inteligente**: Control de stock con segmentación dinámica (Hot Segmented Control) para teléfonos y accesorios.
*   **💸 Finanzas y Caja Registradora**: Registro atómico de ventas y gastos. Dashboard con KPIs financieros en tiempo real (ingresos brutos, gastos operativos y ganancia neta).
*   **📱 Arquitectura PWA Instalable**: Experiencia nativa en iOS y Android con íconos personalizados, splash screens, soporte offline (IndexedDB) y manejo dinámico de áreas seguras (*Safe Areas*).
*   **🎨 Diseño "Quiet Luxury" y Glassmorphism**: Interfaz moderna, minimalista y libre de distracciones. Implementa un sistema de diseño propio con soporte perfecto para Modo Claro y Modo Oscuro, utilizando variables CSS dinámicas y modales tipo "Bottom Sheet".
*   **🔒 Seguridad y Sincronización**: Autenticación centralizada y base de datos en tiempo real mediante Firebase, protegida con Reglas de Seguridad (Firestore Rules) para acceso exclusivo del propietario.

## 🛠️ Stack Tecnológico

*   **Frontend**: Next.js (App Router), React 19, TypeScript.
*   **Estilos**: Tailwind CSS v4 (utilizando paleta de colores personalizada y variables CSS fluidas).
*   **Backend as a Service (BaaS)**: Firebase (Authentication & Firestore).
*   **Arquitectura y Patrones**: Context API (`TiendaContext`) para sincronización de estado, Error Boundaries granulares (`error.tsx`, `global-error.tsx`).

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para desplegar el proyecto en tu entorno local:

1. **Clonar el repositorio**
   ```bash
   git clone git@github.com:Juan17md/plugzone-digital.git
   cd plugzone-digital
   ```

2. **Instalar las dependencias**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   ```

4. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📐 Decisiones de Diseño (UI/UX)

La aplicación implementa un diseño sumamente detallado pensando en el usuario final en mostrador:
- **Desktop**: Barra lateral (Sidebar) persistente que facilita la navegación entre múltiples pestañas, ideal para auditorías de finanzas.
- **Mobile**: Menú de navegación inferior (Bottom Navigation) táctil que respeta el espacio de la "Isla Dinámica" y los gestos de navegación modernos, complementado por Modales "Bottom Sheet" de altura dinámica adaptativa.

---
<div align="center">
  <p>Construido con pasión y precisión para la excelencia operativa.</p>
</div>
