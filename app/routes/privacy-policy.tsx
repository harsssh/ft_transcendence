import { Container, ScrollArea, Space, Text, Title } from '@mantine/core'

export default function PrivacyPolicy() {
  return (
    <Container>
      <ScrollArea h="100vh" type="always">
        <Space h="xl" />
        <Title order={1}>Privacy Policy</Title>
        <Space h="lg" />
        <Text>
          This Privacy Policy outlines how we handle users' personal information
          within the services provided by us.
        </Text>
        <Space h="lg" />
        <Title order={2}>1. Information We Collect</Title>
        <Text>The Service may collect the following information:</Text>
        <ul>
          <li>
            <Text>Account Information: Username, email address.</Text>
          </li>
          <li>
            <Text>
              Message Content: Text and other content sent within the Service.
            </Text>
          </li>
          <li>
            <Text>
              Log Information: IP address, browser information, and access
              timestamps.
            </Text>
          </li>
        </ul>
        <Space h="lg" />
        <Title order={2}>2. Purpose of Use</Title>
        <Text>
          The collected information will be used exclusively for the following
          purposes:
        </Text>
        <ul>
          <li>
            <Text>
              Provision of the Service (authentication, sending/receiving
              messages, etc.).
            </Text>
          </li>
          <li>
            <Text>Service improvement and bug fixes.</Text>
          </li>
          <li>
            <Text>Prevention of unauthorized or fraudulent use.</Text>
          </li>
        </ul>
        <Space h="lg" />
        <Title order={2}>3. Third-Party Disclosure</Title>
        <Text>
          We will not provide personal information to third parties without the
          user's consent, except as required by law.
        </Text>
        <Text>
          Note: This does not include disclosure to infrastructure providers
          (hosting servers, databases, etc.) necessary for the operation of the
          Service.
        </Text>
        <Space h="lg" />
        <Title order={2}>4. Data Deletion</Title>
        <Text>
          If a user requests account deletion or if the Service's operation is
          terminated, we will delete the associated data within a reasonable
          timeframe.
        </Text>
        <Space h="lg" />
        <Title order={2}>5. Disclaimer</Title>
        <Text>
          This Service is a clone site developed for learning and development
          purposes. While we strive to implement security measures, we do not
          guarantee the absolute integrity or security of the information.
          Please refrain from providing sensitive personal information or using
          passwords that are reused from other services.
        </Text>
        <Space h="lg" />
        <Title order={2}>6. Contact Information</Title>
        <Text>
          For inquiries regarding this Policy, please contact: hirosuzu (Discord
          ID: 746779966657659031).
        </Text>
        <Space h="xl" />
      </ScrollArea>
    </Container>
  )
}
