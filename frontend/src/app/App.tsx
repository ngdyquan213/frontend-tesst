import { RouterProvider } from 'react-router-dom'
import { RuntimeErrorReporter } from '@/app/RuntimeErrorReporter'
import { router } from '@/app/router'

export const App = () => (
  <>
    <RuntimeErrorReporter />
    <RouterProvider router={router} />
  </>
)

export default App
