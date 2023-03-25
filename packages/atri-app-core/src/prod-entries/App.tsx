import { useContext } from "react";
import { RouterProvider } from "react-router-dom";
import { RouterContext } from "../contexts/RouterContext";
import { ComponentTreeContext } from "../prod-contexts/ComponentTreeContext";
import { AliasCompMapContext } from "../prod-contexts/AliasCompContext";

export default function App() {
  const router = useContext(RouterContext).getRouter();
  return (
    <>
      {router !== null ? (
        <AliasCompMapContext.Provider value={{}}>
          <ComponentTreeContext.Provider value={{}}>
            <RouterProvider router={router} />
          </ComponentTreeContext.Provider>
        </AliasCompMapContext.Provider>
      ) : null}
    </>
  );
}
