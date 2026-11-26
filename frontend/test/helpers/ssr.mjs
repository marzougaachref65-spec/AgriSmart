import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

export async function avecVite(callback) {
  const vite = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    return await callback(vite)
  } finally {
    await vite.close()
  }
}

export function contexteAuth(role) {
  return {
    user: {
      _id: 'test',
      name: 'Utilisateur test',
      email: 'test@agrismart.local',
      role,
    },
    token: 'test-token',
    isAuthenticated: true,
    loading: false,
    // identique à AuthContext.hasRole : API variadique, jamais de tableau.
    hasRole: (...roles) => Boolean(role && roles.includes(role)),
    login: async () => {},
    logout: () => {},
  }
}

export function decoderHtml(texte) {
  return texte
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
}

export async function rendrePage(vite, chemin, role) {
  const { AuthContext } = await vite.ssrLoadModule(
    '/src/context/AuthContext.jsx'
  )
  const module = await vite.ssrLoadModule(chemin)
  return renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: contexteAuth(role) },
      React.createElement(module.default)
    )
  )
}

export async function rendreRouteProtegee(vite, role) {
  const { AuthContext } = await vite.ssrLoadModule(
    '/src/context/AuthContext.jsx'
  )
  const { default: RoleBasedRoute } = await vite.ssrLoadModule(
    '/src/routes/RoleBasedRoute.jsx'
  )
  return renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: contexteAuth(role) },
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/rapports'] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            {
              element: React.createElement(RoleBasedRoute, {
                roles: ['ADMIN', 'MANAGER'],
              }),
            },
            React.createElement(Route, {
              path: '/rapports',
              element: React.createElement('div', null, 'PAGE_RAPPORTS_ATTEINTE'),
            })
          )
        )
      )
    )
  )
}
