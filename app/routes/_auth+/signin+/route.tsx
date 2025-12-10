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
  TextInput,
  Title,
  Text,
} from '@mantine/core'
import { Form, Link, useNavigation } from 'react-router'
import type { Route } from './+types/route'
import { SigninFormSchema } from './model/signinForm'

export { action } from './api/action.server'
export { loader } from './api/loader.server'

export default function Signin({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getZodConstraint(SigninFormSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SigninFormSchema })
    },
  })

  return (
    <Center mih="100vh">
      <Container size="md" miw="30vw">
        <Paper shadow="md" p="lg" radius="md">
          <Stack gap="md">
            <Title order={2}>Welcome back!</Title>

            <Form method="post" {...getFormProps(form)}>
              {form.errors && (
                <Alert variant="light" color="red">
                  {form.errors}
                </Alert>
              )}
              <Stack gap="sm">
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
                  Sign in
                </Button>
                <Text>
                  New to ft_transcendence?{' '}
                  <Link to="/signup">
                    <Anchor>Sign up</Anchor>
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
