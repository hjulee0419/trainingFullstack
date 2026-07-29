'use strict';

const env = require('./config/env');
const app = require('./app');

app.listen(env.PORT, () => {
  console.log(`[server] TodoList backend listening on port ${env.PORT} (env: ${env.NODE_ENV})`);
});
