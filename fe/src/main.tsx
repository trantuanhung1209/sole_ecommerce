import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./store";
import "./index.css";
import App from "./App.tsx";
import { StrictMode } from "react";
import { googleClientId, isGoogleAuthEnabled } from "./config/env";
import { CartProvider } from "./contexts/CartContext";
import { FlyToCartLayer } from "./components/cart/FlyToCartLayer";

const app = (
  <StrictMode>
    <Provider store={store}>
      <CartProvider>
        <App />
        <FlyToCartLayer />
      </CartProvider>
    </Provider>
  </StrictMode>
);

createRoot(document.getElementById("root")!).render(
  isGoogleAuthEnabled ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  )
);
