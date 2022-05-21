module.exports = {
    apps: [
        {
            name: 'wallet_user',
            script: './dist/main.js',
            exec_mode: 'cluster',
            cwd: './services/wallet_user/',
            env: {
                HOST: 'localhost',
                PORT: 7000,
                PSQL_HOST: 'localhost',
                PSQL_PORT: 5432,
                PSQL_DATABASE: 'Wallet_User',
                PSQL_USERNAME: 'user',
                PSQL_PASSWORD: 'user',
            },
            output: "./logs/wallet_user/output.log",
            error: "./logs/wallet_user/error.log",
            log: "./logs/wallet_user/combined.outerr.log"
        },
        {
            name: 'transaction',
            script: './dist/main.js',
            exec_mode: 'cluster',
            cwd: './services/transaction/',
            env: {
                HOST: 'localhost',
                PORT: 5000,
                PSQL_HOST: 'localhost',
                PSQL_PORT: 5432,
                PSQL_DATABASE: 'Transaction',
                PSQL_USERNAME: 'user',
                PSQL_PASSWORD: 'user',
            },
            output: "./logs/transaction/output.log",
            error: "./logs/transaction/error.log",
            log: "./logs/transaction/combined.outerr.log"
        },
    ],
}
