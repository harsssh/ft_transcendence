import { Container, Space, Text, Title } from '@mantine/core'

export default function TermsOfService() {
  return (
    <Container>
      <Space h="xl" />
      <Title order={1}>Terms of Service</Title>
      <Space h="lg" />
      <Title order={2}>1. Introduction</Title>
      <Text>
        These Terms of Service (hereinafter referred to as the "Terms") define
        the conditions for using ft_transcendence (hereinafter referred to as
        the "Service"). By using the Service, users are deemed to have agreed to
        all provisions of these Terms.
      </Text>
      <Space h="lg" />
      <Title order={2}>2. Eligibility</Title>
      <Text>
        The Service is intended for individuals who can agree to these Terms on
        their own responsibility. Minors must obtain the consent of a parent or
        legal guardian before using the Service.
      </Text>
      <Space h="lg" />
      <Title order={2}>3. Account Management</Title>
      <Text>
        Users shall be responsible for managing their own login information.
      </Text>
      <ul>
        <li>
          <Text>
            The Service provider assumes no liability for any damages resulting
            from the use of an account by a third party.
          </Text>
        </li>
      </ul>
      <Space h="lg" />
      <Title order={2}>4. Prohibited Actions</Title>
      <Text>
        Users are prohibited from engaging in the following activities:
      </Text>
      <ul>
        <li>
          <Text>
            Actions that violate laws, regulations, or public order and morals.
          </Text>
        </li>
        <li>
          <Text>
            Actions that place an excessive load on the Service's servers or
            networks (e.g., DoS attacks).
          </Text>
        </li>
        <li>
          <Text>Harassment, defamation, or spamming of other users.</Text>
        </li>
        <li>
          <Text>
            Unauthorized operations that intentionally exploit bugs within the
            Service.
          </Text>
        </li>
      </ul>
      <Space h="lg" />
      <Title order={2}>5. Modification or Suspension of Service</Title>
      <Text>
        The Service provider reserves the right to modify, suspend, or interrupt
        the Service at any time without prior notice. The Service provider shall
        not be held liable for any damages incurred by users as a result of such
        actions.
      </Text>
      <Space h="lg" />
      <Title order={2}>6. Disclaimer of Warranties</Title>
      <Text>
        The Service is provided on an "as-is" and "as-available" basis. We make
        no warranties, express or implied, regarding its accuracy or usefulness.
      </Text>
      <ul>
        <li>
          <Text>
            The Service provider is under no obligation to intervene in any
            disputes arising between users in connection with the Service.
          </Text>
        </li>
      </ul>
      <Space h="lg" />
      <Title order={2}>7. Changes to the Terms</Title>
      <Text>
        The Service provider reserves the right to modify these Terms at any
        time without prior notice to the users, whenever deemed necessary.
      </Text>
    </Container>
  )
}
