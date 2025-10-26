import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import all the necessary modules from @apollo/client
import { 
  ApolloClient, 
  InMemoryCache, 
  ApolloProvider, 
  HttpLink, 
  ApolloLink 
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';


// Configure Apollo Client (for HTTP and WebSocket)
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql' 
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}));

// Distinguish between Query/Mutation and Subscription
const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

// Create an instance of Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
);
