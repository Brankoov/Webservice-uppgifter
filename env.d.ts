declare namespace NodeJS {
    interface ProcessEnv{
        PORT?: string;
        MY_GLOBAL_TEST_SECRET?: string;
        DB_CONNECTION_STRING?: string;
        DB_NAME?: string;
    }
}