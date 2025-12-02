// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 把 'your-repo-name' 改成你在 GitHub 上面的專案名稱
  // 例如你的專案叫 'physics-lab'，這裡就填 '/physics-lab/'
  base: '/elec_n/', 
})
