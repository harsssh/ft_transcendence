export type ChannelsHandle<LoaderData = unknown> = {
  navbar: (data: LoaderData) => React.ReactNode
  navbarWidth: number
}
