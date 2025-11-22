import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from "@apollo/client";

/**
 * Authentication Middleware (AuthLink):
 * Intercepts every outgoing GraphQL request to inject the JWT token from local storage.
 * This ensures that the backend (Context API) can identify and authorize the user.
 */
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("token");

  // Log the operation for debugging security context in development
  console.log(
    "[AuthLink] Operation:", 
    operation.operationName, 
    "| Sending token:", 
    token ? `Yes (...${token.slice(-6)})` : "No"
  );
  
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : "",
    },
  });

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

/**
 * Apollo Client Instance:
 * Configures the client with the auth middleware chain and an in-memory cache
 * to optimize performance by reducing redundant network requests.
 */
const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;