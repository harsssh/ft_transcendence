import { Client } from '@elastic/elasticsearch'
import { createContext } from 'react-router'

if (
  !process.env.ELASTIC_ENDPOINT ||
  !process.env.ELASTIC_USER ||
  !process.env.ELASTIC_PASSWORD
) {
  console.error(
    'ElasticSearch environment variables are not set properly. Please set ELASTIC_ENDPOINT, ELASTIC_USER, and ELASTIC_PASSWORD.',
  )
  process.exit(1)
}

export const elasticClient = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASSWORD,
  },
})

try {
  const createIndex = async (index: string) => {
    if (!(await elasticClient.indices.exists({ index }))) {
      await elasticClient.indices.create({ index })
    }
  }

  await createIndex('messages')
} catch (error) {
  console.error(error)
  process.exit(1)
}

export const elasticClientContext = createContext(elasticClient)
