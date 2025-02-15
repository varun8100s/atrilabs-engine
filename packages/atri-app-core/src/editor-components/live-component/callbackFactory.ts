import { Callback } from "@atrilabs/react-component-manifest-schema";
import { componentStoreApi, liveApi } from "../../api";
import {
  callInternalNavigationSubscribers,
  navigateExternally,
  sendEventDataFn,
} from "./callbackHandlers";

type NavigationCallbackHandlerDef = {
  type: "internal" | "external";
  url: string;
  target?: "_blank" | "_self";
};

type CallbackHandler = {
  navigate?: NavigationCallbackHandlerDef;
  sendFile?: ({ self: boolean } | { alias: string }) & {
    props: string[];
  };
  sendEventData?: boolean;
};

function callCallbacks(id: string, callbacks: Callback[], value: any) {
  callbacks.forEach((callbackDef: Callback) => {
    if (callbackDef?.type === "controlled" && callbackDef.selector) {
      liveApi.updateProps(id, callbackDef.selector, value);
    } else if (callbackDef?.type === "file_input" && callbackDef.selector) {
      liveApi.updateProps(id, callbackDef.selector, value);
    }
  });
}

function callHandlers(
  id: string,
  callbackName: string,
  value: any,
  repeating?: {
    // repeating component alias name in sequence
    comps: string[];
    // data of component that was clicked and it's ancestor repeating component
    data: any[];
  }
) {
  /**
   * Either one sendEventData job or multiple sendFiles job can be performed.
   * Both cannot be performed in a single request.
   *
   * A navigate job is always preformed at last. A job that has been run prior
   * to navigate can be either of sendEventData or sendFiles.
   */
  const handlers: CallbackHandler[] =
    liveApi.getComponentCallbackHandlers(id)[callbackName];
  if (!Array.isArray(handlers)) {
    return;
  }
  const jobs: {
    // only one send event data
    sendEventData?: CallbackHandler;
    // many sendfiles
    sendFiles?: CallbackHandler[];
    // only one navigation
    navigate?: CallbackHandler;
  } = {};

  handlers.forEach((handler) => {
    if (handler["sendEventData"]) {
      jobs["sendEventData"] = handler;
    }
    if (handler["sendFile"]) {
      if (jobs["sendFiles"]) {
        jobs["sendFiles"].push(handler);
      } else {
        jobs["sendFiles"] = [handler];
      }
    }
    if ("navigate" in handler) {
      jobs["navigate"] = handler;
    }
  });

  if (jobs["sendFiles"]) {
    // TODO: send request with form data
  } else if (jobs["sendEventData"]) {
    const pageState = liveApi.getPageState();
    const pageRoute = liveApi.getActivePageRoute();
    const alias = liveApi.getComponentAlias(id);
    sendEventDataFn(
      alias,
      pageState,
      pageRoute,
      callbackName,
      value,
      repeating
    );
  } else if (jobs["navigate"]) {
    const options = {
      urlPath: jobs["navigate"].navigate!.url,
      target: jobs["navigate"].navigate!.target,
    };
    if (jobs["navigate"]!.navigate!.type === "internal")
      callInternalNavigationSubscribers(options);
    else navigateExternally(options);
  }
}

export function callbackFactory(props: {
  id: string;
  repeating?: {
    // repeating component alias name in sequence
    comps: string[];
    // data of component that was clicked and it's ancestor repeating component
    data: any[];
  };
}) {
  const callbackObject: { [callbackName: string]: Function } = {};
  const callbacks = componentStoreApi.getComponent(props.id)?.callbacks;
  if (callbacks) {
    const callbackNames = Object.keys(callbacks);
    callbackNames.forEach((callbackName) => {
      if (Array.isArray(callbacks[callbackName])) {
        callbackObject[callbackName] = (value: any) => {
          callCallbacks(props.id, callbacks[callbackName], value);
          callHandlers(props.id, callbackName, value, props.repeating);
        };
      }
    });
  }
  return callbackObject;
}
