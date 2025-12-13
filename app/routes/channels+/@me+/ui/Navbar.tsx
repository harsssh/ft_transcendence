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
import { Form, Link, useNavigation } from 'react-router'
import type { Channel } from '../model/channel'
import { NewChannelFormSchema } from '../model/newChannelForm'

type Props = {
  channels: Channel[]
  lastResult: SubmissionResult<string[]> | null
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
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    console.log(lastResult)
    if (lastResult?.status === 'success') {
      close()
    }
  }, [lastResult, close])

  return (
    <>
      <Stack gap="sm" w="100%" p="sm" h="100%">
        <Group justify="space-between" align="center">
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
          <Link key={ch.id} to={`/channels/@me/${ch.id}`}>
            <Text>{ch.name}</Text>
          </Link>
        ))}
      </Stack>

      <Modal opened={opened} onClose={close} title="Create DM Channel" centered>
        <Form method="post" action="/channels" {...getFormProps(form)}>
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
