import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NavBar from "./componentes/navbar";
import Order from "./pages/Order";

export function Routess() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route
        path="/"
        element={
          <NavBar>
            <Dashboard />
          </NavBar>
        }
      />
      <Route
        path="/Dashboard"
        element={
          <NavBar>
            <Dashboard />
          </NavBar>
        }
      />
      <Route
        path="/Order"
        element={
          <NavBar>
            <Order />
          </NavBar>
        }
      />
    </Routes>
  );
}
