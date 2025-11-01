// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { client } from './graphql/client';
import App from './App';
import './App.css';
import { RouterProvider } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <RouterProvider router={router}>
    </ApolloProvider>
  </React.StrictMode>
);