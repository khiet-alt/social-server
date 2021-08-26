const mongoose = require('mongoose')
const { MONGODB } = require('./config.js')
const { ApolloServer } = require("apollo-server");

const typeDefs = require('./graphql/typeDefs.js');
const resolvers = require('./graphql/resolvers'); // it will automatically choose index file

const PORT = process.env.PORT || 5000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req})
});

mongoose
  .connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB Connected');
    return server.listen({ port: PORT });
  })
  .then(({ url }) => {
    console.log(`Server running at ${url}`);
  })
  .catch(err => {
    console.error(err)
  })
