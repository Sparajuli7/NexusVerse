import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';

import './index.css';
import App from './App';
import { store } from './store';
import { client } from './services/apollo';
import { getLibrary } from './services/web3';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ApolloProvider client={client}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Web3ReactProvider>
      </ApolloProvider>
    </Provider>
  </React.StrictMode>
); 