type Route = {
  path: string
  element: Element
}

interface IRouter {
  push: (props: Pick<Route, 'path'>) => void
}

export const createRouter = (props: {
  onNavigated?: (props: Pick<Route, 'element'>) => void
  routes: Route[]
}): IRouter => {
  const routes: Map<Route['path'], Route> = props.routes.reduce((routes, r) => {
    routes.set(r.path, r)
    return routes
  }, new Map())

  return {
    push: ({ path }) => {
      const requestedRoute = routes.get(path)
      if (!requestedRoute) {
        throw ReferenceError(`no matching route with given path: ${path}`)
      }

      if (props.onNavigated !== undefined) {
        props.onNavigated({ element: requestedRoute.element })
      }
    },
  }
}
