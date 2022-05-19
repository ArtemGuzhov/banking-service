import { join } from 'path'

export const graphQlConfig = {
<<<<<<< Updated upstream
    autoSchemaFile: join(process.cwd(), 'src/schemas/schema.gql'),
=======
    autoSchemaFile: join(process.cwd(), 'schemas/schema.gql'),
>>>>>>> Stashed changes
    sortSchema: true,
    playground: true,
}
