import { join } from 'path'

export const graphQlConfig = {
    autoSchemaFile: join(
        process.cwd(),
        'services/transaction/schemas/schema.gql',
    ),
    sortSchema: true,
    playground: true,
}
