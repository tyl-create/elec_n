import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 把下面的 '你的專案名稱' 改成你 GitHub Repository 的名字
  // 例如你的網址是 github.com/user/electro-lab，這裡就填 '/electro-lab/'
  base: '/elec_n/', 
})
