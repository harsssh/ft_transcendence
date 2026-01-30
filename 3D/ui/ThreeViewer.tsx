import {
  ActionIcon,
  Box,
  Loader,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import {
  IconCameraRotate,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconSparkles,
} from '@tabler/icons-react'
import { lazy, Suspense, useEffect, useState } from 'react'

const ThreeViewerCanvas = lazy(() => import('./ThreeViewerCanvas'))

type Props = {
  status: 'queued' | 'generating' | 'ready' | 'failed' | 'refined' | 'timeout'
  modelUrl: string | null
  channelId?: number | undefined
  messageId?: number | undefined
  precedingTasks?: number | undefined
}

type BackgroundMode = 'dark' | 'light' | 'hdri'

const PRESETS = [
  { value: 'city', label: 'City' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'dawn', label: 'Dawn' }, // Replacing 'dawn' with 'boulder' as dawn isn't standard in older drei versions sometimes
  { value: 'night', label: 'Night' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'forest', label: 'Forest' },
  { value: 'studio', label: 'Studio' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'park', label: 'Park' },
  { value: 'lobby', label: 'Lobby' },
]

export function ThreeViewer({
  status,
  modelUrl,
  channelId,
  messageId,
  precedingTasks,
}: Props) {
  const [key, setKey] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isRefining, setIsRefining] = useState(false)

  // Local Preference State
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark')
  const [hdriPreset, setHdriPreset] = useState<string>('city')

  useEffect(() => {
    setIsMounted(true)
    // Load preferences from localStorage
    try {
      const storedBg = localStorage.getItem('three-viewer-bg-mode')
      const storedPreset = localStorage.getItem('three-viewer-hdri-preset')
      if (storedBg) setBgMode(storedBg as BackgroundMode)
      if (storedPreset) setHdriPreset(storedPreset)
    } catch (e) {
      console.warn('Failed to load preferences via localStorage', e)
    }
  }, [])

  // Persist preferences
  const handleBgChange = (val: string) => {
    setBgMode(val as BackgroundMode)
    localStorage.setItem('three-viewer-bg-mode', val)
  }

  const handlePresetChange = (val: string | null) => {
    if (val) {
      setHdriPreset(val)
      localStorage.setItem('three-viewer-hdri-preset', val)
    }
  }

  // Force re-mount when modelUrl changes (e.g. Refine complete) to refresh texture
  useEffect(() => {
    if (modelUrl) {
      setKey((prev) => prev + 1)
      setIsRefining(false) // Reset refining state on new URL
    }
  }, [modelUrl])

  const handleRefine = async () => {
    if (!channelId || !messageId) return

    if (!confirm('Generating texture will cost 10 credits. Continue?')) return

    setIsRefining(true)
    try {
      const res = await fetch(
        `/api/channels/${channelId}/messages/${messageId}/asset/refine`,
        {
          method: 'POST',
        },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Refine request failed')
      }
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : 'Refine failed'
      alert(`Error: ${message}`)
      setIsRefining(false)
    }
  }

  if (status === 'queued') {
    return (
      <Box
        w={300}
        h={200}
        bg="#222"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <Loader size="sm" type="dots" />
        <Text size="sm" mt="xs" c="dimmed">
          Queued...
        </Text>
        {precedingTasks !== undefined && (
          <Text size="xs" c="dimmed" mt={4}>
            Queue Position: {precedingTasks}
          </Text>
        )}
      </Box>
    )
  }

  if (status === 'generating') {
    return (
      <Box
        w={300}
        h={200}
        bg="#222"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <Loader size="md" variant="bars" />
        <Text size="sm" mt="xs" c="blue">
          Generating 3D Mesh...
        </Text>
        {precedingTasks !== undefined && (
          <Text size="xs" c="dimmed" mt={4}>
            Queue Position: {precedingTasks}
          </Text>
        )}
      </Box>
    )
  }

  if (status === 'timeout') {
    return (
      <Box
        w={300}
        h={200}
        bg="#222"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          padding: 16,
        }}
      >
        <Text size="sm" c="yellow" ta="center">
          Waiting in queue...
        </Text>
        <Text size="xs" c="dimmed" ta="center" mt={4}>
          Generation halted due to timeout.
        </Text>
        {precedingTasks !== undefined && (
          <Text size="xs" c="dimmed" mt={2}>
            Queue Position: {precedingTasks}
          </Text>
        )}
        <ActionIcon
          variant="light"
          color="yellow"
          size="lg"
          mt="md"
          onClick={async () => {
            if (!channelId || !messageId) return
            await fetch(
              `/api/channels/${channelId}/messages/${messageId}/asset/resume`,
              { method: 'POST' },
            )
          }}
        >
          <IconRefresh size={20} />
        </ActionIcon>
        <Text size="xs" c="dimmed" mt={4}>
          Check Status
        </Text>
      </Box>
    )
  }

  if (status === 'failed') {
    return (
      <Box
        w={300}
        h={200}
        bg="#311"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <Text size="sm" c="red" fw="bold">
          Generation Failed
        </Text>
        {modelUrl && (
          <ActionIcon
            variant="light"
            color="gray"
            size="sm"
            mt="sm"
            onClick={async () => {
              if (!channelId || !messageId) return
              await fetch(
                `/api/channels/${channelId}/messages/${messageId}/asset/revert`,
                { method: 'POST' },
              )
            }}
          >
            <Text size="xs">Show Original</Text>
          </ActionIcon>
        )}
      </Box>
    )
  }

  // Render if ready or refined
  if ((status === 'ready' || status === 'refined') && modelUrl) {
    return (
      <Box w="100%" h="100%" style={{ display: 'flex', overflow: 'hidden' }}>
        {/* Canvas Area: Filling the remaining width */}
        <Box
          style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}
          bg="#111"
        >
          {isMounted && (
            <Suspense fallback={<Box w="100%" h="100%" bg="#000" />}>
              <ThreeViewerCanvas
                key={key}
                modelUrl={modelUrl}
                channelId={channelId}
                messageId={messageId}
                bgMode={bgMode}
                hdriPreset={hdriPreset}
              />
            </Suspense>
          )}
          {isRefining && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <Loader size="lg" color="grape" variant="dots" />
              <Text c="white" mt="sm" size="sm">
                Refining...
              </Text>
            </Box>
          )}
        </Box>

        {/* Controls Bar: Vertical Column on Right */}
        <Box
          w={48}
          bg="#1a1a1a"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 8,
            borderLeft: '1px solid #444',
            position: 'relative',
            zIndex: 10,
            flexShrink: 0, // Prevent compression
            minWidth: 48, // Ensure fixed width
          }}
        >
          {/* Settings Popover */}
          <Popover
            width={200}
            position="left-start"
            withArrow
            shadow="md"
            withinPortal
            zIndex={1001}
          >
            <Popover.Target>
              <Tooltip
                label="Viewer Settings"
                position="left"
                withArrow
                withinPortal
                zIndex={1000}
              >
                <ActionIcon
                  variant="default"
                  color="gray"
                  size="lg"
                  radius="md"
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown bg="#25262b" style={{ border: '1px solid #444' }}>
              <Stack gap="xs">
                <Text size="xs" fw={500} c="dimmed">
                  Background
                </Text>
                <SegmentedControl
                  size="xs"
                  fullWidth
                  value={bgMode}
                  onChange={handleBgChange}
                  data={[
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                    { label: 'HDRI', value: 'hdri' },
                  ]}
                />

                {bgMode === 'hdri' && (
                  <>
                    <Text size="xs" fw={500} c="dimmed" mt={4}>
                      Environment
                    </Text>
                    <Select
                      size="xs"
                      data={PRESETS}
                      value={hdriPreset}
                      onChange={handlePresetChange}
                      allowDeselect={false}
                    />
                  </>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>

          <Tooltip
            label="Reset Camera"
            position="left"
            withArrow
            withinPortal
            zIndex={1000}
          >
            <ActionIcon
              variant="default"
              color="gray"
              size="lg"
              radius="md"
              onClick={() => setKey((k) => k + 1)}
            >
              <IconCameraRotate size={20} />
            </ActionIcon>
          </Tooltip>

          {/* Only show Refine button if status is 'ready' (not yet refined) */}
          {status === 'ready' && (
            <Tooltip
              label="Refine Texture"
              position="left"
              withArrow
              withinPortal
              zIndex={1000}
            >
              <ActionIcon
                variant="light"
                color="grape"
                size="lg"
                radius="md"
                loading={isRefining}
                onClick={handleRefine}
              >
                <IconSparkles size={20} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip
            label="Download GLB"
            position="left"
            withArrow
            withinPortal
            zIndex={1000}
          >
            <ActionIcon
              component="a"
              href={`/api/proxy/model?url=${encodeURIComponent(modelUrl)}`}
              download="model.glb"
              variant="default"
              color="gray"
              size="lg"
              radius="md"
            >
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
        </Box>
      </Box>
    )
  }

  return null
}
