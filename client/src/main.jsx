import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/app/store";
import { injectStore } from "@/api/api.js";
import "@/index.css";

// Inject the store into our axios instance to avoid circular dependencies
injectStore(store);

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
