export type ChannelsHandle<LoaderData = unknown, ActionData = unknown> = {
  navbar: (loadData: LoaderData, actionData: ActionData) => React.ReactNode
  navbarWidth: number
}
