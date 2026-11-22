<script setup lang="ts">
import ConfirmDialog from './core/confirm/ConfirmDialog.vue';
import { provideConfirm } from './core/confirm/useConfirm';
import ToastContainer from './core/notifications/ToastContainer.vue';
import { provideAuth } from './core/auth/useAuth';
import { provideTheme } from './core/theme/useTheme';
import { provideToast } from './core/notifications/useToast';

provideTheme();
provideAuth();
provideToast();
provideConfirm();
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
</template>
