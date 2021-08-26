const mongoose = require('mongoose')
const { MONGODB } = require('./config.js')
const { createServer } = require("http");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { ApolloServer } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const typeDefs = require('./graphql/typeDefs.js');
const resolvers = require('./graphql/resolvers');

(async () => {
  const PORT = process.env.port || 5000;
  const pubsub = new PubSub();
  const app = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, pubsub })
  });
  await server.start();
  server.applyMiddleware({ app });

  SubscriptionServer.create(
    { schema, execute, subscribe,},
    { server: httpServer, path: server.graphqlPath }
  );

  mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Mongodb Connected")
        return httpServer.listen(PORT)
    })
    .then(res => {
        console.log(`🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`)
        console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`)
    })
    .catch(err => {
      console.error(err)
    })

})();
