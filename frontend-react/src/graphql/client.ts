// src/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // 从 localStorage 获取认证 token
  const token = localStorage.getItem('authToken');
  
  console.log(`[ApolloClient] 正在设置 Auth Header (Token: ${token ? '...' : 'null'})`);
  
  // 返回 headers
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});