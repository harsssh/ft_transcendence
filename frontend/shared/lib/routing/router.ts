type Route = {
  path: string
  element: Node
}

interface IRouter {
  push: (props: Pick<Route, 'path'>) => void
}

export const createRouter = (routes: Route[]) => {
  const routingTable = new Map(routes.map((r) => [r.path, r]))

  const outlet = document.createElement('main')

  const router: IRouter = {
    push: ({ path }) => {
      const requestedRoute = routingTable.get(path)
      if (!requestedRoute) {
        outlet.replaceChildren(document.createTextNode('Not Found'))
        return
      }

      outlet.replaceChildren(requestedRoute.element)
    },
  }

  return {
    outlet,
    router,
  }
}
