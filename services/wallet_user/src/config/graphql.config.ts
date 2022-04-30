import { join } from 'path'

export const graphQlConfig = {
    autoSchemaFile: join(process.cwd(), 'src/schemas/schema.gql'),
    sortSchema: true,
    playground: true,
}
