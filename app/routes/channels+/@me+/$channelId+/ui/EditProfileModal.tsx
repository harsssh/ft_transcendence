import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  unstable_useControl,
  useForm,
  useInputControl,
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
import { createContext, useCallback, useContext, useEffect } from 'react'
import { Form, useNavigation } from 'react-router'
import { EditProfileSchema } from '../model/profile'

type Props = {
  opened: boolean
  onClose: () => void
  defaultValue: {
    displayName?: string | null
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
    >
      <EditProfileForm {...props} />
    </Modal>
  )
}

function EditProfileForm({ defaultValue, onClose }: Props) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const { lastResult } = useContext(EditProfileContext)
  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      intent: 'edit-profile',
      ...defaultValue,
    },
    constraint: getZodConstraint(EditProfileSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: EditProfileSchema })
    },
  })

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
        <TextInput
          label="Display Name"
          labelProps={{ fw: 500 }}
          size="md"
          {...getInputProps(fields.displayName, { type: 'text' })}
          error={fields.displayName.errors}
        />
        <Box>
          <FileButton
            onChange={() => {}}
            accept="image/*"
            inputProps={getInputProps(fields.avatarImage, { type: 'file' })}
          >
            {(props) => (
              <Button {...props} variant="outline" size="md">
                Change Avatar
              </Button>
            )}
          </FileButton>
          {fields.avatarImage.errors && (
            <Text size="sm" c="red" mt={4}>
              {fields.avatarImage.errors}
            </Text>
          )}
        </Box>
        <Group justify="end">
          <Button type="button" mt="md" variant="default" onClick={onClose}>
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
