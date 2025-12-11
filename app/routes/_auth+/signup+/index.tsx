import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Form, Link, useNavigation } from 'react-router'
import type { Route } from './+types/route'
import { SignupFormSchema } from './model/signupForm'

export { action } from './api/action.server'

export default function Signup({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getZodConstraint(SignupFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupFormSchema })
    },
  })

  return (
    <Center mih="100vh">
      <Container size="md" miw="30vw">
        <Paper shadow="md" p="lg" radius="md">
          <Stack gap="md">
            <Title order={2}>Create an account</Title>

            <Form method="post" {...getFormProps(form)}>
              {form.errors && (
                <Alert variant="light" color="red">
                  {form.errors}
                </Alert>
              )}
              <Stack gap="sm">
                <TextInput
                  {...getInputProps(fields.name, { type: 'text' })}
                  label="Name"
                  error={fields.name.errors}
                />
                <TextInput
                  {...getInputProps(fields.email, { type: 'email' })}
                  label="Email"
                  error={fields.email.errors}
                />
                <PasswordInput
                  {...getInputProps(fields.password, { type: 'password' })}
                  label="Password"
                  error={fields.password.errors}
                />
                <Button type="submit" loading={isSubmitting} fullWidth>
                  Create an account
                </Button>
                <Text>
                  Already have an account?{' '}
                  <Link to="/signin">
                    <Anchor>Sign in</Anchor>
                  </Link>
                </Text>
              </Stack>
            </Form>
          </Stack>
        </Paper>
      </Container>
    </Center>
  )
}
