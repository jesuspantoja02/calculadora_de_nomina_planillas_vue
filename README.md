# Nómina — Gestión de Planillas

Calculadora y gestión de planillas para el curso **JavaScript Avanzado** (UTP). El mismo producto de negocio — empleados,
pagos y boletas — se desarrolla por unidades para mostrar cómo escala de un prototipo en el navegador a un sistema
**full stack** mantenible.

| Unidad | Rol en el curso | Stack resumido |
|---|---|---|
| **Unidad 1** | Fundamentos de JavaScript, DOM y persistencia local | HTML, CSS, JavaScript (sin frameworks) |
| **Unidad 2** | Semanas 6–9: Node.js, TypeScript, Angular y API REST | Node ≥ 22.18, Express 5, TS, Angular 22, SQLite, Bootstrap 5.3 |
| **Unidad 3** | Semanas 11–14: React, hooks, enrutamiento e integración REST *(ya entregada)* | Node ≥ 22.18, Express 5, TS, React 19, Vite, React Router 7, SQLite, Bootstrap 5.3 |
| **Unidad 3 Final** | Cierre de la unidad (semanas 15–16+): Vue.js, mejoras de producto e integración | Node ≥ 22.18, Express 5, TS, **Vue 3**, Vite, Vue Router 4, SQLite, Bootstrap 5.3 |

En el árbol actual del repositorio vive la **Unidad 3 Final**: **`backend/`** (hexagonal + **auth**, usuarios y **asistente IA**) y
**`frontend/`** (SPA en **Vue 3** con Vite). La Unidad 3 (React) quedó documentada abajo como referencia de lo ya cursado; las
Unidades 1 y 2 (y el frontend React) se conservan en el **historial de git** para comparar versiones.

### Evolución por unidad (qué se gana en cada paso)

| Aspecto | Unidad 1 | Unidad 2 | Unidad 3 (React) | Unidad 3 Final (Vue) |
|---|---|---|---|---|
| **Ejecución** | Abrir `index.html` en el navegador | API en Node + SPA Angular | API en Node + SPA React (`vite`) | API en Node + SPA **Vue 3** (`vite`, puerto **5174**) |
| **Datos** | `localStorage` (solo ese equipo/navegador) | SQLite + API REST (`/api/v1`) | Igual + auth JWT | Igual + auth JWT + módulo **asistente** |
| **Código** | Un solo `js/app.js` (+ HTML/CSS) | Hexagonal (backend) + features Angular | Frontend hexagonal en React | Mismo enfoque hexagonal; SFCs `.vue` + Composition API |
| **Cálculo de planilla** | Tasas simplificadas en clases JS | Normativa peruana (oct. 2026) en `calculo-planilla.ts` | Sin cambios en el dominio | Sin cambios en el dominio |
| **Validación** | En el DOM al escribir | Zod (API) + Reactive Forms + `appEntrada` | Zod + formularios controlados + `EntradaInput` | Zod + `v-model` + `EntradaInput.vue` |
| **Navegación** | Vistas con `data-view` y JS | Rutas Angular con lazy loading | React Router 7 + `React.lazy` | **Vue Router 4** + `() => import(...)` + guards |
| **Menú (misma idea de negocio)** | Registrar · Pago · Boletas · Dashboard · Configuración | Empleados · Procesar pago · Boletas · Dashboard · Configuración | + login, inicio (`/`) y usuarios | Igual + **exportaciones**, **PDF**, **asistente IA**, foto de perfil |
| **Identidad visual** | Ink + ámbar (`#0a0c11`, `#e0b04a`) | Tokens en `frontend/src/styles/tokens.css` | Tokens + tema claro/oscuro; Geist; marca CNJ | Misma línea visual en Vue; paneles laterales (perfil / asistente) |
| **Acceso** | Sin login (solo cliente) | Sin login en la Unidad 2 documentada | JWT, roles, rutas protegidas | JWT, roles; **configuración** y **usuarios** solo gestores |

---

## 🔹 Unidad 1 — JavaScript en el navegador

**Objetivo:** demostrar lógica de nómina, interfaz y manejo de estado **sin frameworks**, como base del dominio que luego se
refina en la Unidad 2.

### Estructura (commit de referencia `dda68cd`)

```
calculadora_de_nomina_planillas/   ← Unidad 1 en git (no en el árbol actual de la Unidad 2)
├── index.html                     SPA: sidebar + área de contenido + zona de impresión
├── css/style.css                  Estilos (tema Ink + ámbar)
└── js/app.js                      Toda la lógica: modelos, vistas, localStorage, cálculos
```

### Pantallas (equivalentes funcionales a la Unidad 2)

| Vista (`data-view`) | Función |
|---|---|
| `registrar` | Alta de empleados (DNI, nombre, cargo, sueldo, AFP/ONP), lista, filtros por cargo y rango salarial |
| `pago` | Procesar pago y emitir boleta (adelanto quincenal y fin de mes) |
| `boletas` | Historial de boletas con filtros por fecha y búsqueda |
| `dashboard` | Totales, distribución AFP/ONP, mayor y menor sueldo |
| `configuracion` | Tasas (AFP, ONP, etc.), datos de empresa, exportar/importar `.json` |

### Persistencia y modelo

- Claves en **`localStorage`**: empleados, boletas y configuración (`CONFIG_DEFAULT` editable desde la UI).
- Clase **`Empleado`**: sueldo base, régimen, métodos `calcularDescuentos` / `calcularNeto` con porcentajes de configuración
  (modelo didáctico, no la normativa completa de la Unidad 2).

### Conceptos de JavaScript aplicados

Tipos y control de flujo, `Math`, cadenas y expresiones regulares, **clases**, arreglos (`map`, `filter`, `reduce`),
`Map`/`Set`, `JSON`, eventos del DOM y manipulación de nodos sin recargar la página.

### Cómo ver o recuperar la Unidad 1

```bash
# Solo lectura de un archivo histórico
git show dda68cd:index.html

# Copiar la Unidad 1 al directorio de trabajo (crea index.html, css/, js/)
git checkout dda68cd -- index.html css js
# Abrir index.html en el navegador (o servir la carpeta con un servidor estático ligero)
```

### Límites que motivan la Unidad 2

Sin servidor ni base de datos no hay API compartida, respaldo centralizado ni reglas legales detalladas; el cálculo y la
seguridad dependen solo del cliente. La Unidad 2 resuelve eso manteniendo el mismo flujo de pantallas y la misma marca visual.

---

## 🔹 Unidad 2 — Node.js, TypeScript y Angular

**Logro:** escalar la Unidad 1 a una solución web integral (temario semanas 6–9 / proyecto integrador): persistencia,
API REST, tipado, pruebas y normativa laboral peruana en el dominio.

| | Tecnología |
|---|---|
| Backend | Node.js ≥ 22.18, Express 5, TypeScript 6, Zod 4, Helmet 8, SQLite (`node:sqlite`, sin dependencias nativas) |
| Frontend | Angular 22 (standalone components, signals, control flow), RxJS 7.8, Bootstrap 5.3, tipografías Manrope y Source Serif 4 |
| Pruebas | `node:test` (backend) y Vitest vía `ng test` (frontend) |

### Flujo de usuario (continuidad con la Unidad 1)

| Ruta Angular | Equivalente Unidad 1 |
|---|---|
| `/empleados` | Vista `registrar` |
| `/planilla/procesar-pago` | Vista `pago` |
| `/planilla/boletas` | Vista `boletas` |
| `/dashboard` | Vista `dashboard` |
| `/configuracion` | Vista `configuracion` |

### Estructura del repositorio

```
calculadora_de_nomina_planillas/
├── backend/                         API REST
│   ├── src/
│   │   ├── main.ts                  Arranque (config, BD, servidor, apagado ordenado)
│   │   ├── app.ts                   Fábrica de Express: seguridad, rutas, errores
│   │   ├── container.ts             Raíz de composición (conecta puertos con adaptadores)
│   │   ├── shared/                  Núcleo compartido: config, errores, HTTP, SQLite, utilidades
│   │   └── modules/
│   │       ├── empleados/           ┐
│   │       ├── planilla/            │  cada módulo = 4 capas:
│   │       ├── configuracion/       │  domain · application · infrastructure · presentation
│   │       └── dashboard/           ┘
│   ├── tests/                       Pruebas
│   └── scripts/seed.ts              Datos de ejemplo
├── frontend/                        SPA Angular
│   └── src/
│       ├── styles/                  Tokens de diseño, tema de Bootstrap, layout, componentes, impresión
│       └── app/
│           ├── core/                Infraestructura única: layout, interceptor HTTP, toasts, token de API
│           ├── shared/              Reutilizable y sin lógica de negocio: ui, pipes, validadores, tipos
│           └── features/            Una carpeta por funcionalidad (carga diferida)
│               └── <feature>/       data-access · components · pages · <feature>.routes.ts
└── docs/nomina-api.postman_collection.json
```

### Backend — arquitectura hexagonal (puertos y adaptadores)

```
presentation  →  application  →  domain  ←  infrastructure
(HTTP, rutas)    (casos de uso,   (reglas,    (SQLite)
                  DTOs Zod)        puertos)
```

- **domain**: entidades y reglas de negocio puras (por ejemplo `calculo-planilla.ts`) y los *puertos* (`*.repository.ts`, interfaces). No importa Express, Zod ni la base de datos.
- **application**: casos de uso (`*.service.ts`) y validación de entradas (`*.dto.ts`, esquemas Zod). Dependen solo de los puertos.
- **infrastructure**: adaptadores que implementan los puertos (`sqlite-*.repository.ts`).
- **presentation**: controladores y rutas Express; traducen HTTP ↔ casos de uso.
- `container.ts` es el único lugar donde se instancian los adaptadores: **cambiar de SQLite a PostgreSQL implica escribir nuevos repositorios y modificar esa sola función**.
- Las migraciones de esquema están versionadas (`shared/infrastructure/sqlite/migraciones.ts`, `PRAGMA user_version`): para evolucionar la base de datos se agrega un elemento nuevo, sin editar los anteriores.

**Cómo agregar un módulo nuevo (por ejemplo «asistencia»)**

1. Crear `backend/src/modules/asistencia/{domain,application,infrastructure,presentation}`.
2. Definir la entidad y el puerto en `domain`, el caso de uso y los DTOs en `application`, el adaptador SQLite en `infrastructure` y el router en `presentation`.
3. Agregar la migración (tabla) en `migraciones.ts`, instanciarlo en `container.ts` y montar su router en `app.ts`.

### Frontend — arquitectura por funcionalidades

- **`core/`** se carga una vez (shell, interceptor, notificaciones). **`shared/`** contiene piezas genéricas sin conocimiento del dominio. **`features/`** agrupa todo lo de una funcionalidad.
- Cada feature se divide en: `data-access/` (modelos, cliente HTTP `*.api.ts` y **store con signals** `*.store.ts`), `components/` (presentación: reciben `input()` y emiten `output()`), `pages/` (contenedores que orquestan) y `*.routes.ts` (rutas con *lazy loading*; el store se provee a nivel de ruta).
- **Reglas de dependencia:** `shared` no importa de `features`; una feature solo puede usar el `data-access` de otra (p. ej. `planilla` consulta empleados a través de `EmpleadosApi`); nunca sus componentes.
- La URL de la API se inyecta mediante el token `API_BASE_URL`, y el estado de servidor vive en los stores, no en los componentes.

### Diseño visual

Se conservan los colores y las tipografías de la primera versión: paneles `#12161f` sobre fondo `#0a0c11`, acento ámbar `#e0b04a`,
éxito `#3dbe8c`, peligro `#e86b5a`; títulos en *Source Serif 4* y texto en *Manrope* (autoalojadas con `@fontsource`, sin pedir nada a
Google). Los tokens están en `frontend/src/styles/tokens.css` y se mapean a las variables de Bootstrap en `bootstrap-theme.css`,
de modo que cambiar la marca para un cliente implica editar un solo archivo.

### Cumplimiento del temario

| Tema | Dónde se aplica |
|---|---|
| Node.js (concepto, instalación, ejecución por consola) | `backend/`: `npm run dev` / `npm start`; Node ≥ 22.18 |
| TypeScript | Backend y frontend en modo `strict`; compilación con `tsc` (`npm run build`); `tsconfig` con `nodenext` |
| Angular: proyecto modular | `frontend/` con componentes *standalone* por feature, carga diferida con `loadChildren` / `loadComponent` |
| Directivas de atributo | `[ngClass]` (validación, badges, estados) y `[ngStyle]` (barras del dashboard) |
| Directivas estructurales | `@if / @for / @switch` en plantillas y layout |
| Bootstrap | 5.3 (última estable; Bootstrap 6 sigue en alfa): grid, formularios, botones, badges, progress, re-tematizado con tokens |
| Navegación / rutas | `provideRouter`, `loadChildren`, `routerLink`, `routerLinkActive`, `<router-outlet>`, `title` por ruta, comodín `**`, query params enlazados a inputs (`/empleados?regimen=AFP`) |
| Componentes | `shell`, `sidebar`, `page-header`, `icon`, `boleta`, `empleado-form/filtros/lista`, `pago-form` … |
| Pipes | Nativos: `currency` (PEN), `date`, `percent`, `uppercase`, `titlecase`. Propios: `iniciales`, `enmascararDni`, `modalidadLabel` (con pruebas). Locale `es-PE` |
| Formularios | *Reactive Forms* tipados (`NonNullableFormBuilder`), validadores, validador de grupo, mensajes por campo |
| Back-end REST en JSON | Express 5 con `GET/POST/PUT/DELETE`, `{ "data": … }` / `{ "error": … }`, códigos 200/201/204/400/404/409 |
| Herramientas de prueba | `docs/nomina-api.postman_collection.json` (Postman / Insomnia) |
| Servicios + HttpClient + RxJS | Clientes `*.api.ts`, stores con `toObservable` + `switchMap`, `debounceTime`, `combineLatest`, `catchError`, `finalize`; interceptor funcional de errores |
| Integración | «Procesar pago»: formulario reactivo + vista previa en vivo (`POST /pagos/simular`) + boleta + rutas |

### Reglas de negocio

Cálculo en `backend/src/modules/planilla/domain/calculo-planilla.ts`, con la normativa vigente en octubre de 2026.
Los parámetros (RMV, UIT, tasas AFP, tope asegurable) se editan en *Configuración*.

| Concepto | Regla |
|---|---|
| Hora ordinaria | `(sueldo + asignación familiar) / 30 / 8` |
| Hora extra 25 % / 35 % | D.S. 007-2002-TR: 125 % las dos primeras horas del día y 135 % desde la tercera |
| Descanso o feriado | Sobretasa del 100 %; el día ya está incluido en el sueldo mensual |
| Tardanza / falta | Minuto = ordinaria / 60. Falta = un treintavo. Reducen la base de pensión |
| Asignación familiar | Ley 25129: 10 % de la RMV (S/ 1 230 desde el 1 de octubre de 2026) si tiene hijos |
| AFP | 10 % de aporte + prima 1,37 % + comisión por flujo, hasta la remuneración máxima asegurable (S/ 12 732,70). La comisión sobre saldo no sale del sueldo |
| ONP | 13 % de la remuneración, sin ese tope |
| EsSalud | 9 % a cargo del empleador. No se descuenta al trabajador |
| Adelanto quincenal | Porcentaje de la empresa (por defecto 40 %). La ley no lo fija y no lleva descuentos |
| Gratificación | Ley 27735: `(sueldo + asignación) × meses/6`, sin AFP ni ONP. Bonificación Ley 30334: 9 %, o 6,75 % si está en EPS |
| CTS | `(básico + asignación + un sexto de la gratificación) × meses/12`, más el treintavo diario. Es un depósito |
| 5.ª categoría | 12 remuneraciones + 2 gratificaciones − 7 UIT (UIT 2026 = S/ 5 500) − aporte obligatorio a la pensión. Tramos 8/14/17/20/30 %. Retención = impuesto anual / 12 |

### API REST (`/api/v1`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET · POST | `/empleados` | Listar (filtros `cargo`, `regimen`, `min`, `max`) · Crear (201) |
| GET · PUT · DELETE | `/empleados/:id` | Detalle · Actualizar · Eliminar (204) |
| GET · POST | `/pagos` | Historial (`fecha`, `q`) · Calcular y emitir boleta (201) |
| POST | `/pagos/simular` | Calcular sin guardar |
| GET · DELETE | `/pagos/:id` | Detalle · Eliminar boleta (204) |
| GET · PUT | `/configuracion` | Leer · Actualizar tasas y datos de empresa |
| GET | `/dashboard` | Totales, distribución por régimen, mayor/menor sueldo |
| DELETE | `/datos` | Borra empleados y boletas (204) |

Errores: `{ "error": { "code": "VALIDACION", "message": "…", "details": [{ "campo": "dni", "mensaje": "…" }] } }`.

### Seguridad y calidad

- **Entradas:** Zod con `strictObject` (rechaza campos desconocidos; valida tipos, rangos, UUID y fechas ISO) y sanitización de texto libre.
- **SQL:** consultas parametrizadas (nunca se concatenan datos del usuario); comodines de `LIKE` escapados; restricciones `CHECK`/`UNIQUE` en la base.
- **Errores:** manejador central; los errores inesperados devuelven un mensaje genérico y el detalle solo se registra en el servidor.
- **HTTP:** Helmet, `x-powered-by` desactivado, CORS con lista de orígenes, límite de peticiones por IP, cuerpo JSON ≤ 10 kB, log de accesos sin query string.
- **Datos:** SQLite en modo WAL con `busy_timeout`, transacciones para operaciones multi-tabla, apagado ordenado que cierra la base.
- **Frontend:** Angular escapa toda interpolación; el DNI se muestra enmascarado; no hay secretos en el cliente.
- **Dependencias:** versiones estables recientes con rangos `^`; verifica con `npm audit` y `npm outdated` antes de cada entrega.

### Instalación y ejecución

**Requisitos:** Node.js ≥ 22.18 (Angular 22 exige Node 22, 24 o 26 y TypeScript 6) y npm.

```bash
# 1) Dependencias (desde la raíz)
npm run install:all

# 2) Backend — terminal 1
cd backend
cp .env.example .env            # Windows: copy .env.example .env
npm run seed                    # opcional: 3 empleados de ejemplo
npm run dev                     # http://localhost:3000/api/v1/health

# 3) Frontend — terminal 2
cd frontend
npm start                       # http://localhost:4200  (ng serve con proxy /api → :3000)
```

Producción:

```bash
cd backend  && npm run build && npm start     # compila a dist/ y ejecuta
cd frontend && npm run build                  # genera dist/ para un servidor estático
```

Sirve el frontend y la API bajo el mismo dominio (proxy inverso), o cambia `apiUrl` en `frontend/src/environments/environment.ts`
y agrega el origen en `CORS_ORIGINS`. La base de datos es el archivo `backend/data/nomina.db` (respáldalo con `.backup` de SQLite o copiando el archivo con el servidor detenido).

**Pruebas y auditoría**

```bash
cd backend  && npm test && npm run typecheck && npm run audit:prod
cd frontend && npm test -- --watch=false && npm run audit:prod
```

**Probar la API:** importa `docs/nomina-api.postman_collection.json` en Postman o Insomnia (`baseUrl = http://localhost:3000/api/v1`).

> La sección anterior describe la **Unidad 2 (Angular)** tal como quedó documentada en el curso. La **Unidad 3 (React)** ya se
> entregó (semanas 11–14). El código **actual** del repositorio es la **Unidad 3 Final (Vue)** más abajo.

---

## 🔹 Unidad 3 — React, Vite e integración REST *(entregada)*

> Documentación de la entrega React (semanas 11–14). El árbol actual del repo ya no es React: ver **Unidad 3 Final** para
> ejecutar y desplegar lo que hay hoy.

**Logro:** reimplementar el frontend de la Unidad 2 con **React 19** (semanas 11–14, ver `Java_Script_Avanzado_Semanas_11_al_14.md`),
conservando el mismo flujo de pantallas, **arquitectura hexagonal** en backend y frontend, y la normativa de planilla peruana.

| | Tecnología |
|---|---|
| Backend | Arquitectura hexagonal (Express 5, SQLite) + módulo **`auth`** (JWT, usuarios, roles) |
| Frontend | React 19, Vite 8, React Router 7, TypeScript 6, Bootstrap 5.3, **Geist Sans / Geist Mono** (`@fontsource`) |
| Pruebas | `node:test` (backend) y Vitest (frontend, validadores de entrada) |
| Despliegue | Guía en [`docs/DESPLIEGUE-RENDER.md`](docs/DESPLIEGUE-RENDER.md) (API + SPA en Render, CORS, `VITE_API_URL`) |

### Flujo de usuario (continuidad con las unidades anteriores)

| Ruta React | Equivalente Unidad 1 | Notas |
|---|---|---|
| `/login` | — | Pantalla de acceso (pública) |
| `/` | — | Panel de bienvenida (logo, nombre y eslogan; imagen en `public/empresa/`) |
| `/empleados` | Vista `registrar` | Requiere sesión |
| `/planilla/procesar-pago` | Vista `pago` | Requiere sesión |
| `/planilla/boletas` | Vista `boletas` | Requiere sesión |
| `/dashboard` | Vista `dashboard` | Gráficos por régimen/AFP (ONP, Integra, Prima, etc.) |
| `/configuracion` | Vista `configuracion` | Tasas, datos de empresa, logo (subida en base64) |
| `/usuarios` | — | Gestión de usuarios; listado/edición solo **admin**, alta para gestores |

### Estructura del repositorio (Unidad 3)

```
calculadora_de_nomina_planillas/
├── backend/                         API REST hexagonal
│   └── src/modules/
│       ├── auth/                    Login JWT, usuarios, roles (SQLite)
│       ├── empleados/ · planilla/ · configuracion/ · dashboard/
│       └── …                        domain · application · infrastructure · presentation
├── frontend/                        SPA React hexagonal + Vite
│   ├── public/empresa/              Assets de marca (p. ej. `cnj-panel-hero.jpg`, logo)
│   ├── vite.config.ts               Proxy /api → :3000 en desarrollo
│   └── src/
│       ├── composition/container.ts Raíz de composición (puertos ↔ adaptadores HTTP)
│       ├── config/                  `environment.ts`, `empresaBranding.ts` (valores por defecto CNJ)
│       ├── shared/                  Infra HTTP (`fetch`), UI, validadores, formateadores
│       ├── core/                    Auth, tema, layout (`Shell`, `WelcomePanel`, `LoginPage`), toasts
│       └── modules/                 Un módulo por funcionalidad (como el backend)
│           └── <modulo>/            domain · application · infrastructure · presentation
└── docs/
    ├── nomina-api.postman_collection.json
    └── DESPLIEGUE-RENDER.md         Publicación en Render (plan Free)
```

### Backend — hexagonal + autenticación

Se conservan empleados, planilla, configuración y dashboard (misma normativa en `calculo-planilla.ts`, Zod, SQLite). La Unidad 3
**añade** el módulo `auth`:

- **`POST /api/v1/auth/login`** — credenciales → token JWT (público).
- **`GET /api/v1/auth/me`**, **`POST /api/v1/auth/cambiar-password`** — con token.
- **`/api/v1/usuarios`** — CRUD y roles (protegido; reglas por rol en el backend).
- El resto de rutas de negocio van bajo el mismo router protegido (`requiereAuth`); solo `/health` y login quedan públicos.
- Variables en `backend/.env.example`: `AUTH_SECRET`, `AUTH_TOKEN_TTL_HOURS`, `CORS_ORIGINS`.
- Al arrancar, si no hay administrador, se crea uno inicial (`seed-usuarios.ts`); en producción cambia el secreto y las credenciales.

### Frontend — arquitectura hexagonal (puertos y adaptadores)

```
presentation  →  application  →  domain  ←  infrastructure
(React UI)       (servicios)      (puertos)   (Http*Repository + fetch)
```

- **domain:** modelos del módulo y puertos (`*.repository.ts`). No importa React ni `fetch`.
- **application:** casos de uso (`*.service.ts`) que dependen solo de los puertos.
- **infrastructure:** adaptadores `Http*Repository` que implementan los puertos usando **`fetch`** (`shared/infrastructure/http/apiClient.ts`).
- **presentation:** páginas, componentes y hooks (`useEmpleadosStore`) que llaman a los servicios vía `composition/container.ts`.
- **`composition/container.ts`** es el único lugar donde se instancian adaptadores y servicios (análogo a `backend/src/container.ts`).
- **`core/`** — `AuthContext` (token en `sessionStorage`, cabecera `Authorization`), `ThemeContext` (claro/oscuro con transición),
  `RequireAuth` / `RequireGestor`, shell con sidebar y panel de bienvenida.
- **`shared/`** — UI genérica, `apiClient` con manejo de errores, formateadores y colores de gráficos (`pensiones.ts`).

### Autenticación y roles (frontend)

| Rol | Acceso típico |
|---|---|
| `usuario` | Planilla, empleados, boletas, dashboard, configuración (según política del curso/cliente) |
| `jefe` / `gerente` | Lo anterior + ruta **`/usuarios`** (alta de usuarios con roles asignables) |
| `admin` | Todo lo anterior + listar, editar y eliminar usuarios |

Rutas en `routes.tsx`: árbol bajo `RequireAuth`; `usuarios` además bajo `RequireGestor`. Perfil y cambio de contraseña en el sheet del sidebar.

### Diseño visual

Tokens en `frontend/src/styles/tokens.css` (paletas **light** y **dark**), tema Bootstrap en `bootstrap-theme.css`, gráficos en
`charts.css`, panel de inicio en `welcome.css`. Interruptor de tema en el sidebar (`ThemeToggle`). Marca por defecto CNJ en
`config/empresaBranding.ts`; la configuración de la API puede sobrescribir nombre, eslogan y logo.

### Cumplimiento del temario (semanas 11–14)

Referencia: [`Java_Script_Avanzado_Semanas_11_al_14.md`](Java_Script_Avanzado_Semanas_11_al_14.md).

| Semana | Tema del curso | Dónde se aplica |
|---|---|---|
| **11** | Introducción a React, JSX/TSX, Bootstrap, componentes y `useState` | Vite + React 19, TSX en `modules/*/presentation`, Bootstrap 5.3, Todo-list de nómina |
| **12** | React Router, componentes, props, formularios controlados | `routes.tsx`, `Shell`, formularios en empleados/planilla/configuración |
| **13** | Hooks: `useState`, `useContext`, `useRef`, `useEffect` | Stores, `ToastProvider`, refs de formulario, carga y vista previa con efectos |
| **14** | Servicios REST: **Fetch API** (Axios/Alova como alternativas del curso) | Puertos + `Http*Repository` con `fetch`; consumo de `/api/v1` |

| Tema transversal | Dónde se aplica |
|---|---|
| Bootstrap | Grid, formularios, badges, progress (dashboard), re-tematizado con tokens |
| Validación de entrada | `EntradaInput` + `formularios.ts` (misma lógica que la directiva `appEntrada`) |
| Formateo | Funciones en `shared/formatters/` (antes pipes de Angular) |
| Integración «Procesar pago» | Formulario + `POST /pagos/simular` en vivo + emisión + boleta imprimible |
| Sesión y API | Login con `fetch`, token JWT en peticiones protegidas; módulo `usuarios` en React |

Las reglas de negocio y `calculo-planilla.ts` son las de la Unidad 2. La tabla de API de abajo **amplía** la de la Unidad 2 con
auth; el resto de endpoints de empleados/pagos/configuración/dashboard **requieren** `Authorization: Bearer <token>` salvo `/health`
y `POST /auth/login`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión (público) |
| GET | `/auth/me` | Usuario actual |
| POST | `/auth/cambiar-password` | Cambiar contraseña |
| GET · POST | `/usuarios` | Listar (admin) · Crear (gestor+) |
| PUT · DELETE | `/usuarios/:id` | Actualizar · Eliminar (admin) |
| GET | `/usuarios/roles-asignables` | Roles que puede asignar quien crea usuarios |

### Instalación y ejecución (referencia histórica — React)

> Estos comandos describen la entrega React (puerto **5173**). Para el monorepo **actual**, usa la sección
> **Unidad 3 Final** (Vue, puerto **5174**).

**Requisitos:** Node.js ≥ 22.18 y npm.

```bash
# 1) Dependencias (desde la raíz)
npm run install:all

# 2) Backend — terminal 1
cd backend
cp .env.example .env            # Windows: copy .env.example .env
# Revisa AUTH_SECRET y CORS_ORIGINS (incluye http://localhost:5173)
npm run seed                    # opcional: empleados de ejemplo
npm run dev                     # http://localhost:3000/api/v1/health

# 3) Frontend — terminal 2
cd frontend
npm start                       # http://localhost:5173  (Vite con proxy /api → :3000)
# Desde la raíz también: npm run dev:backend  |  npm run dev:frontend
```

Abre `http://localhost:5173/login`. Tras el primer arranque del backend existe un administrador por defecto (ver
`backend/src/modules/auth/infrastructure/seed-usuarios.ts`); cámbialo en entornos reales.

---

## 🔹 Unidad 3 Final — Vue.js, mejoras de producto e integración

**Logro:** cerrar la Unidad 3 reimplementando el cliente en **Vue 3** (temario semanas 15–16: Vue.js / comparación con Next.js;
ver `S16_s1_semana_16_JSA.md`) y sumando mejoras operativas sobre la misma API hexagonal, auth JWT y normativa de planilla.

Es la versión que vive en el **árbol actual** del repositorio (`calculadora_de_nomina_planillas_vue`).

| | Tecnología |
|---|---|
| Backend | Hexagonal (Express 5, SQLite) + **`auth`** + módulo **`asistente`** (Gemini / OpenAI / Ollama / motor local) |
| Frontend | **Vue 3.5**, Vite 7, Vue Router 4, TypeScript, Bootstrap 5.3, Geist Sans / Mono; **exceljs** y **jspdf** |
| Pruebas | `node:test` (backend); auditoría `npm run audit:prod` en ambos paquetes |
| Despliegue | [`docs/DESPLIEGUE-RENDER.md`](docs/DESPLIEGUE-RENDER.md) (API + SPA Vue en Render, CORS, `VITE_API_URL`) |

### Qué mejora respecto a la Unidad 3 (React)

| Área | Unidad 3 (React) | Unidad 3 Final (Vue) |
|---|---|---|
| **Framework UI** | React 19 + React Router 7 | **Vue 3** (SFC `.vue`, Composition API) + **Vue Router 4** |
| **Dev server** | Vite en `:5173` | Vite en **`:5174`** (`CORS_ORIGINS` y proxy alineados) |
| **Guards** | `RequireAuth` / `RequireGestor` | `beforeEach` + `meta.requiresAuth` / `meta.requiresGestor` |
| **Configuración** | Acceso de sesión según política previa | Ruta **`/configuracion`** restringida a **gestores** (junto con `/usuarios`) |
| **Exportación** | — | Empleados a **CSV** y **Excel** (`shared/export/empleadosExport.ts`) |
| **Boletas** | Impresión HTML | Impresión + descarga **PDF** (`shared/export/boletasPdf.ts`, jsPDF) |
| **Perfil** | Cambio de contraseña en sheet | Sheet de perfil + **foto de avatar** (subida/procesado en cliente) |
| **UX** | Toasts | Toasts + **diálogos de confirmación** (`useConfirm` / `ConfirmDialog`) |
| **Asistente** | — | FAB + panel de chat (`AsistenteIaFab`) contra `/api/v1/asistente/*` |

### Flujo de usuario (continuidad)

| Ruta Vue | Equivalente Unidad 1 | Notas |
|---|---|---|
| `/login` | — | Pública; credenciales recordables opcionales |
| `/` | — | Panel de bienvenida (marca CNJ / datos de empresa) |
| `/empleados` | Vista `registrar` | CRUD + filtros + export CSV/Excel |
| `/planilla/procesar-pago` | Vista `pago` | Simulación en vivo + emisión |
| `/planilla/boletas` | Vista `boletas` | Historial, impresión y PDF |
| `/dashboard` | Vista `dashboard` | Totales y distribución por régimen/AFP |
| `/configuracion` | Vista `configuracion` | Solo **gestor+**; tasas, empresa, logo |
| `/usuarios` | — | Solo **gestor+**; listado/edición admin |

### Estructura del repositorio (árbol actual)

```
calculadora_de_nomina_planillas/
├── backend/                         API REST hexagonal
│   └── src/modules/
│       ├── auth/                    Login JWT, usuarios, roles, foto de perfil
│       ├── asistente/               Chat IA (LLM o respuestas locales con conocimiento del sistema)
│       ├── empleados/ · planilla/ · configuracion/ · dashboard/
│       └── …                        domain · application · infrastructure · presentation
├── frontend/                        SPA Vue 3 hexagonal + Vite
│   ├── public/empresa/              Assets de marca
│   ├── vite.config.ts               Puerto 5174; proxy /api → :3000
│   └── src/
│       ├── main.ts · App.vue
│       ├── router/index.ts          Rutas + guards de sesión/rol
│       ├── composition/container.ts Puertos ↔ adaptadores HTTP
│       ├── config/                  environment, branding
│       ├── shared/                  apiClient (fetch), UI, validadores, export CSV/Excel/PDF
│       ├── core/                    auth, tema, layout, toasts, confirm, asistente
│       └── modules/                 Un módulo por funcionalidad (SFC + composables)
│           └── <modulo>/            domain · application · infrastructure · presentation
└── docs/
    ├── nomina-api.postman_collection.json
    └── DESPLIEGUE-RENDER.md         Publicación en Render (plan Free) — SPA Vue
```

### Backend — auth + asistente

Se mantienen empleados, planilla, configuración, dashboard y auth de la Unidad 3. La Unidad 3 Final **añade** `asistente`:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/asistente/estado` | Proveedor activo (`gemini` · `openai` · `ollama` · `local`) y si está listo |
| POST | `/asistente/chat` | Mensaje + historial → respuesta (protegido con JWT) |

Prioridad de proveedor (variables en `backend/.env.example`): **Gemini → OpenAI → Ollama → motor local** (`asistente-local.ts` +
`conocimiento-sistema.ts`). Sin API key, el asistente sigue respondiendo con el motor local orientado al producto.

El resto de la API (`/auth`, `/usuarios`, empleados, pagos, etc.) es el de la Unidad 3; las rutas de negocio siguen exigiendo
`Authorization: Bearer <token>` salvo `/health` y `POST /auth/login`.

### Frontend — Vue 3 hexagonal

```
presentation  →  application  →  domain  ←  infrastructure
(SFC Vue)        (servicios)      (puertos)   (Http*Repository + fetch)
```

- **domain / application / infrastructure:** mismo contrato que en React; solo cambia la capa de presentación.
- **presentation:** páginas y componentes `.vue`, composables (`useEmpleadosStore`, `useBoletasStore`, …) y `container`.
- **router:** `createRouter` + `createWebHistory`; lazy `import()` por página; `beforeEach` para login y roles.
- **core:** `useAuth` (token en `sessionStorage`), `useTheme`, `Shell` / `Sidebar` / `WelcomePanel` / `LoginPage`, toasts,
  confirmaciones y panel del asistente.
- **Directivas y reactividad del curso:** `v-if` / `v-for` / `v-model` / `:class` / `@click`, `ref` / `computed` / `watch`,
  y composables propios (`useDebouncedValue`, `useApiAction`).

### Cumplimiento del temario (Vue · semanas 15–16)

Referencia: [`S16_s1_semana_16_JSA.md`](S16_s1_semana_16_JSA.md).

| Tema del curso | Dónde se aplica |
|---|---|
| Vue.js: conceptos, reactividad, componentes `.vue` | SPA en `frontend/`; Composition API + `<script setup>` |
| Instalación y proyecto con Vite | `npm create` / monorepo; `npm run dev` → `:5174` |
| Directivas y formularios | Empleados, pago, configuración, usuarios (`v-model`, validación con `EntradaInput`) |
| Vue Router | `router/index.ts`, `RouterLink` / `RouterView`, guards |
| Consumo REST | `fetch` vía `apiClient` + repositorios HTTP (equivalente didáctico a Axios del temario) |
| Comparación Vue vs Next (curso) | Cliente SPA Vue sobre Express propio (no Next); la API sigue en `backend/` |

Las reglas de negocio siguen en `calculo-planilla.ts` (Unidad 2). Auth y usuarios como en la Unidad 3.

### Instalación y ejecución (Unidad 3 Final — árbol actual)

**Requisitos:** Node.js ≥ 22.18 y npm.

```bash
# 1) Dependencias (desde la raíz)
npm run install:all

# 2) Backend — terminal 1
cd backend
cp .env.example .env            # Windows: copy .env.example .env
# Revisa AUTH_SECRET y CORS_ORIGINS (incluye http://localhost:5174)
# Opcional: GEMINI_API_KEY (u OpenAI / Ollama) para el asistente
npm run seed                    # opcional: empleados de ejemplo
npm run dev                     # http://localhost:3000/api/v1/health

# 3) Frontend — terminal 2
cd frontend
npm start                       # http://localhost:5174  (Vite con proxy /api → :3000)
# Desde la raíz: npm run dev:backend  |  npm run dev:frontend
```

Abre `http://localhost:5174/login`. Tras el primer arranque del backend existe un administrador por defecto (ver
`backend/src/modules/auth/infrastructure/seed-usuarios.ts`); cámbialo en entornos reales.

Producción:

```bash
cd backend  && npm run build && npm start
cd frontend && npm run build                  # salida en frontend/dist/
```

Sirve el frontend y la API bajo el mismo dominio (proxy inverso), o define `VITE_API_URL` al hacer `npm run build` del frontend
(ver `frontend/src/config/environment.ts` y `frontend/.env.example`) y agrega el origen del Static Site en `CORS_ORIGINS`.
Pasos detallados: [`docs/DESPLIEGUE-RENDER.md`](docs/DESPLIEGUE-RENDER.md).

**Pruebas y auditoría**

```bash
cd backend  && npm test && npm run typecheck && npm run audit:prod
cd frontend && npm run audit:prod
# Desde la raíz: npm test  |  npm run audit:all
```

### Próximos pasos sugeridos para escalar

Multiempresa, migración a PostgreSQL (nuevos adaptadores de repositorio), documentación OpenAPI, ampliar la colección Postman con
flujos de login y asistente, CI con `npm audit` y pruebas, y despliegue en contenedores u otros hosts (Render ya documentado en
`docs/`).
