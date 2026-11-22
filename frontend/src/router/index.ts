import { createRouter, createWebHistory } from 'vue-router';
import { esGestor } from '../core/auth/roles';
import { leerSesion } from '../core/auth/authStorage';
import LoginPage from '../core/pages/LoginPage.vue';
import Shell from '../core/layout/Shell.vue';
import NotFoundPage from '../core/pages/NotFoundPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    {
      path: '/',
      component: Shell,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: { template: '<div></div>' } },
        {
          path: 'empleados',
          name: 'empleados',
          component: () => import('../modules/empleados/presentation/pages/EmpleadosPage.vue'),
        },
        {
          path: 'planilla/procesar-pago',
          name: 'procesar-pago',
          component: () => import('../modules/planilla/presentation/pages/ProcesarPagoPage.vue'),
        },
        {
          path: 'planilla/boletas',
          name: 'boletas',
          component: () => import('../modules/planilla/presentation/pages/BoletasPage.vue'),
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../modules/dashboard/presentation/pages/DashboardPage.vue'),
        },
        {
          path: 'configuracion',
          name: 'configuracion',
          meta: { requiresGestor: true },
          component: () => import('../modules/configuracion/presentation/pages/ConfiguracionPage.vue'),
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          meta: { requiresGestor: true },
          component: () => import('../modules/usuarios/presentation/pages/UsuariosPage.vue'),
        },
        { path: ':pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const sesion = leerSesion();
  const isAuthenticated = sesion != null;

  if (to.meta.public) {
    if (isAuthenticated && to.path === '/login') return { path: '/' };
    return true;
  }

  if (to.meta.requiresAuth !== false && to.matched.some((r) => r.meta.requiresAuth)) {
    if (!isAuthenticated) {
      return { path: '/login', query: { from: to.fullPath } };
    }
  }

  if (to.matched.some((r) => r.meta.requiresGestor)) {
    if (!esGestor(sesion?.rol)) {
      return { path: '/' };
    }
  }

  return true;
});
