import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./store";
import "./index.css";
import App from "./App.tsx";
import { StrictMode } from "react";
import { googleClientId, isGoogleAuthEnabled } from "./config/env";
import { CartProvider } from "./contexts/CartContext";
import { FlyToCartLayer } from "./components/cart/FlyToCartLayer";
import { queryClient } from "./lib/queryClient";

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <CartProvider>
          <App />
          <FlyToCartLayer />
        </CartProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);

createRoot(document.getElementById("root")!).render(
  isGoogleAuthEnabled ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  )
);
