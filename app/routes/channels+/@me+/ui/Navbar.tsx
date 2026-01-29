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
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus } from '@tabler/icons-react'
import { useEffect } from 'react'
import { Form, Link, useNavigate, useNavigation } from 'react-router'
import { SecondaryNavbar } from '../../../_shared/ui/SecondaryNavbar'
import type { Channel } from '../model/channel'
import { NewChannelFormSchema } from '../model/newChannelForm'

type Props = {
  channels: Channel[]
  lastResult: (SubmissionResult<string[]> & { channelId?: string }) | null
}

export function Navbar({ channels, lastResult }: Props) {
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
      <SecondaryNavbar>
        <Group
          justify="space-between"
          align="center"
          mih="48"
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

        <ScrollArea type="hover" scrollHideDelay={0}>
          <Stack gap="sm" h="100%">
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
        </ScrollArea>
      </SecondaryNavbar>

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
