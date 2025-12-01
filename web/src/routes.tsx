import { lazy } from 'react'

// 懒加载页面组件以提高性能
export const Home = lazy(() => 
  import('@/pages/Home').then(module => ({ 
    default: module.default 
  }))
)

export const Login = lazy(() => 
  import('@/pages/Login').then(module => ({ 
    default: module.default 
  }))
)

export const Register = lazy(() => 
  import('@/pages/Register').then(module => ({ 
    default: module.default 
  }))
)

export const Editor = lazy(() =>
  import('@/pages/Editor').then(module => ({
    default: module.default
  }))
)
