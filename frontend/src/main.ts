import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { aplicarTemaDom, leerTema } from './core/theme/themeStorage';
import './styles/index.css';
import './styles/charts.css';
import './styles/theme-toggle.css';
import './styles/theme-transition.css';
import './styles/welcome.css';

aplicarTemaDom(leerTema());

createApp(App).use(router).mount('#app');
