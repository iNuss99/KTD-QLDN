const { Client } = require('pg');
const client = new Client('postgres://techretail_owner:8U3H4W9MkqYt@ep-curly-recipe-a1a1z8n3.ap-southeast-1.aws.neon.tech/techretail?sslmode=require');
client.connect().then(() => {
  return client.query('SELECT count(*) FROM "Users" WHERE "Email" != LOWER("Email")');
}).then(res => {
  console.log('Uppercase emails:', res.rows[0].count);
}).catch(console.error).finally(() => client.end());
