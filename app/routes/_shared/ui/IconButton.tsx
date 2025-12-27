import { ActionIcon, Tooltip } from '@mantine/core'

type Props = {
  label?: string
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

export function IconButton({ label, children, onClick }: Props) {
  const actionIcon = (
    <ActionIcon
      variant="transparent"
      color="var(--ft-icon-muted)"
      size="lg"
      onClick={onClick}
    >
      {children}
    </ActionIcon>
  )

  return label ? (
    <Tooltip
      label={label}
      position="bottom"
      withArrow
      arrowSize={11}
      arrowRadius={2}
      c="white"
      bg="oklab(0.262384 0.00252247 -0.00889932)"
      h="34"
      bdrs="md"
      fw={500}
      styles={{
        tooltip: {
          boxShadow: '2px 12px 24px 0 hsl(none 0% 0% / 0.24)',
          border: '1px solid var(--ft-border-color)',
        },
        arrow: {
          border: '1px solid var(--ft-border-color)',
        },
      }}
    >
      {actionIcon}
    </Tooltip>
  ) : (
    actionIcon
  )
}
