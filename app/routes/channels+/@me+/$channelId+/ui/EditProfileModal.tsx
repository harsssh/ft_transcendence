import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  Alert,
  Box,
  Button,
  FileButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react'
import { Form, useNavigation } from 'react-router'
import { EditProfileSchema } from '../model/profile'
import { UserAvatar } from './UserAvatar'

type Props = {
  opened: boolean
  onClose: () => void
  name: string | null
  defaultValue: {
    displayName: string | null
    avatarUrl: string | null
  }
}

export const EditProfileContext = createContext<{
  lastResult: SubmissionResult<string[]> | null
}>({ lastResult: null })

export function EditProfileModal(props: Props) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const { lastResult } = useContext(EditProfileContext)

  useEffect(() => {
    if (!isSubmitting && lastResult?.status === 'success') {
      props.onClose()
    }
  }, [isSubmitting, lastResult, props.onClose])

  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      centered
      title={<Text fw={500}>Profile</Text>}
      size="xl"
    >
      <EditProfileForm {...props} />
    </Modal>
  )
}

function EditProfileForm({ defaultValue, onClose, name }: Props) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const { lastResult } = useContext(EditProfileContext)
  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      intent: 'edit-profile',
      avatarImage: null,
      ...defaultValue,
    },
    constraint: getZodConstraint(EditProfileSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditProfileSchema })
    },
  })

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    defaultValue.avatarUrl,
  )

  const handleAvatarChange = useCallback((file: File | null) => {
    setAvatarUrl(file ? URL.createObjectURL(file) : null)
  }, [])

  return (
    <Form method="post" encType="multipart/form-data" {...getFormProps(form)}>
      {form.errors && (
        <Alert variant="light" color="red">
          {form.errors}
        </Alert>
      )}
      <input
        {...getInputProps(fields.intent, { type: 'hidden' })}
        value="edit-profile"
      />
      <Stack>
        <Group justify="center" align="flex-start" gap={36}>
          <Stack flex={1}>
            <TextInput
              label="Display Name"
              labelProps={{ fw: 500, c: 'white' }}
              size="md"
              {...getInputProps(fields.displayName, { type: 'text' })}
              error={fields.displayName.errors}
            />
            <Group>
              <Stack>
                <FileButton
                  onChange={handleAvatarChange}
                  accept="image/*"
                  inputProps={getInputProps(fields.avatarImage, {
                    type: 'file',
                  })}
                >
                  {(props) => <Button {...props}>Change Avatar</Button>}
                </FileButton>
                {fields.avatarImage.errors && (
                  <Text size="sm" c="red" mt={4}>
                    {fields.avatarImage.errors}
                  </Text>
                )}
              </Stack>
            </Group>
          </Stack>
          <Stack gap={0}>
            <Text fw={500} size="md">
              Preview
            </Text>
            <UserProfile
              {...{
                name,
                displayName: fields.displayName.value ?? null,
                avatarUrl,
              }}
            />
          </Stack>
        </Group>
        <Group justify="end">
          <Button
            type="button"
            mt="md"
            variant="default"
            onClick={() => {
              form.reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" mt="md" loading={isSubmitting}>
            Save
          </Button>
        </Group>
      </Stack>
    </Form>
  )
}

function UserProfile(props: {
  name: string | null
  displayName: string | null
  avatarUrl: string | null
}) {
  const maskId = useId()

  return (
    <Stack
      w={300}
      h="100%"
      bdrs="8px"
      bg="oklab(0.262384 0.00252247 -0.00889932)"
      gap={8}
      pb="sm"
    >
      <Box mih={140} pos="relative">
        <svg
          viewBox="0 0 300 105"
          style={{
            minHeight: '105px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          <title>Profile header</title>
          <mask id={maskId}>
            <rect fill="white" x="0" y="0" width="100%" height="100%" />
            <circle fill="black" cx="56" cy="101" r="46" />
          </mask>
          <foreignObject width="100%" height="100%" mask={`url(#${maskId})`}>
            <Box h={105} bg="black" />
          </foreignObject>
        </svg>
        <Box top={61} left={16} pos="absolute">
          <UserAvatar {...props} src={props.avatarUrl} size={80} />
        </Box>
      </Box>
      <Stack pr="md" pl="md" pt={4}>
        <Box>
          <Text size="xl" fw={700} lh="24px" className="wrap-break-word">
            {props.displayName ?? props.name}
          </Text>
          <Text size="sm" lh="18px" className="wrap-break-word">
            {props.name}
          </Text>
        </Box>
        <Button onClick={() => {}}>Example Button</Button>
      </Stack>
    </Stack>
  )
}
