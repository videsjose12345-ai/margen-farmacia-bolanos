# Dashboard Farmacia Bolaños

**Dashboard Inteligente de Control Comercial** — Análisis de margen bruto, costos, precios e inventario para Farmacia Bolaños.

## Stack

| Tecnología | Versión |
|---|---|
| React | 18 |
| TypeScript | 5 |
| Vite | 5 |
| Tailwind CSS | 3 |
| Firebase (Firestore) | 10 |
| Chart.js | 4 |
| SheetJS (XLSX) | 0.18 |
| React Router | 6 |

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/farmacia-bolanos-dashboard.git
cd farmacia-bolanos-dashboard
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

Crea un proyecto en [Firebase Console](https://console.firebase.google.com/):
1. Ve a **Project Settings → Your Apps → Add App → Web**
2. Copia las credenciales

Luego crea el archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Configurar Firestore

En Firebase Console:
1. Ve a **Firestore Database → Create database**
2. Selecciona modo **Production** o **Test** (para desarrollo usa Test)
3. La colección `historial` se crea automáticamente al cargar el primer archivo

**Reglas Firestore recomendadas para producción:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /historial/{doc} {
      allow read, write: if true;  // Ajusta según tus necesidades de auth
    }
  }
}
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### 6. Build para producción

```bash
npm run build
```

Los archivos de producción quedan en `/dist`.

---

## Despliegue en Vercel

### Opción A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Cuando Vercel pregunte por las variables de entorno, agrega las mismas del archivo `.env`.

### Opción B — GitHub + Vercel (recomendado)

1. Sube el proyecto a GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/farmacia-bolanos-dashboard.git
git push -u origin main
```

2. Ve a [vercel.com](https://vercel.com) → **New Project**
3. Importa el repositorio de GitHub
4. En **Environment Variables** agrega todas las variables de `.env`
5. Haz clic en **Deploy**

Vercel detecta automáticamente Vite y configura el build.

> El archivo `vercel.json` ya está configurado para que las rutas SPA funcionen correctamente.

---

## Estructura del proyecto

```
farmacia-bolanos/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── logo.ts              # Logo Farmacia Bolaños en base64
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.tsx       # Sidebar + topbar shell
│   │   ├── modules/
│   │   │   ├── ScatterChart.tsx # Mapa de márgenes (scatter plot)
│   │   │   └── TrendChart.tsx   # Tendencia histórica (3 líneas)
│   │   └── ui/
│   │       ├── KpiCard.tsx
│   │       ├── LoadingOverlay.tsx
│   │       └── UbicacionesMultiSelect.tsx
│   ├── firebase/
│   │   ├── config.ts            # Inicialización Firebase
│   │   └── historialService.ts  # CRUD Firestore
│   ├── hooks/
│   │   ├── useAppState.ts       # Estado global + persistencia
│   │   └── useFileUpload.ts     # Manejo de carga de Excel
│   ├── lib/
│   │   ├── constants.ts         # IVA, aliases de columnas
│   │   ├── excelParser.ts       # Parser Excel con SheetJS
│   │   ├── format.ts            # Helpers de formato
│   │   ├── kpis.ts              # Cálculo de KPIs
│   │   └── pdfExport.ts         # Generación de PDFs
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── AnalysisPage.tsx
│   │   ├── ComparativoPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

---

## Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Análisis de Margen Bruto** | KPIs, Mapa de márgenes (scatter), tabla con Precio Sugerido |
| **Comparativo de Márgenes** | Cruza dos archivos por código de producto |
| **Historial de Cargas** | Guardado en Firestore, persiste entre sesiones |
| **Reportes PDF** | Completo, críticos, filtrado y priorizado |
| **MultiSelect Ubicaciones** | Filtro dinámico con checkboxes por ubicación |
| **Tendencia histórica** | Gráfico de 3 líneas: promedio, mínimo, máximo |

## Lógica de negocio

- **IVA**: 13% — todos los valores del Excel vienen SIN IVA y se multiplican por 1.13
- **Filtro**: Solo productos con Saldo > 0
- **Margen**: `(Precio IVA − Costo IVA) / Precio IVA × 100`
- **Precio Sugerido**: `Costo IVA / 0.90`
- **Colores**: Rojo `< 8%` · Amarillo `8–10%` · Verde `≥ 10%`
- **Columnas del Excel**: Codigo Producto, Nombre Producto, Marca, Ubicación, Saldo, Costo Promedio, Precio de Lista

---

## Notas de seguridad

- Nunca subas el archivo `.env` al repositorio (está en `.gitignore`)
- Para producción, configura las reglas de Firestore para restringir acceso
- Las variables `VITE_*` son públicas en el bundle — no incluyas secretos sensibles

---

Desarrollado para **Farmacia Bolaños** · v2.2
