import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus } from '@tabler/icons-react'
import { useEffect } from 'react'
import { Form, Link, useNavigate, useNavigation } from 'react-router'
import type { Channel } from '../model/channel'
import { NewChannelFormSchema } from '../model/newChannelForm'

type Props = {
  channels: Channel[]
  lastResult: (SubmissionResult<string[]> & { channelId?: string }) | null
}

const NAVBAR_WIDTH = 300

export const Navbar = Object.assign(NavbarRoot, {
  width: NAVBAR_WIDTH,
})

function NavbarRoot({ channels, lastResult }: Props) {
  const [opened, { open, close }] = useDisclosure(false)
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(NewChannelFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NewChannelFormSchema })
    },
  })
  const navigation = useNavigation()
  const navigate = useNavigate()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (lastResult?.status === 'success' && lastResult.channelId) {
      close()
      navigate(`/channels/@me/${lastResult.channelId}`)
    }
  }, [lastResult, close, navigate])

  return (
    <>
      <Stack
        gap="sm"
        w={NAVBAR_WIDTH}
        h="100%"
        style={{
          borderInlineStart: '1px solid var(--ft-border-color)',
          borderStartStartRadius: '12px',
          borderTop: '1px solid var(--ft-border-color)',
        }}
      >
        <Group
          justify="space-between"
          align="center"
          h="48"
          pl="sm"
          pr="sm"
          className="border-b"
        >
          <Text fw="bold" size="sm">
            Direct Messages
          </Text>
          <ActionIcon
            variant="transparent"
            color="gray"
            aria-label="Start a new direct message"
            onClick={open}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
        {channels.map((ch) => (
          <Box key={ch.id} pl="sm" pr="sm" w="100%">
            <Link to={`/channels/@me/${ch.id}`}>
              <Text c="text-muted" truncate="end">
                {ch.name}
              </Text>
            </Link>
          </Box>
        ))}
      </Stack>

      <Modal opened={opened} onClose={close} title="Create DM Channel" centered>
        <Form method="post" action="/channels/@me" {...getFormProps(form)}>
          <Stack gap="sm">
            {form.errors && (
              <Alert variant="light" color="red">
                {form.errors}
              </Alert>
            )}
            <TextInput
              {...getInputProps(fields.name, { type: 'text' })}
              label="Participant's name"
              error={fields.name.errors}
            />
            <Button type="submit" loading={isSubmitting} fullWidth>
              Create an channel
            </Button>
          </Stack>
        </Form>
      </Modal>
    </>
  )
}
