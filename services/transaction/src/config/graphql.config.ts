import { join } from 'path'

export const graphQlConfig = {
    autoSchemaFile: join(process.cwd(), 'schemas/schema.gql'),
    sortSchema: true,
    playground: true,
}
