import {
  BrowserForestManager,
  manifestRegistryController,
} from "@atrilabs/core";
import ReactComponentManifestSchemaId from "@atrilabs/react-component-manifest-schema?id";
import type { LinkUpdate, WireUpdate } from "@atrilabs/forest";
import ComponentTreeId from "@atrilabs/app-design-forest/src/componentTree?id";
import { ReactComponentManifestSchema } from "@atrilabs/react-component-manifest-schema";
import { createComponentFromNode } from "@atrilabs/core";
import { breakpointApi } from "./breakpointApi";
import { editorAppMachineInterpreter } from "./init";

BrowserForestManager.currentForest.subscribeForest((update) => {
  const compTree = BrowserForestManager.currentForest.tree(ComponentTreeId)!;
  const currentForest = BrowserForestManager.currentForest;
  if (update.type === "wire") {
    const wireUpdate = update as WireUpdate;
    // skip update if some other tree in the current forest is updated
    // for example, update may be in cssTree
    if (wireUpdate.treeId !== ComponentTreeId) {
      return;
    }
    const id = wireUpdate.id;
    const node = compTree.nodes[id]!;
    const createComponentPayload = createComponentFromNode(
      node,
      breakpointApi.getActiveBreakpoint()
    );
    if (createComponentPayload) {
      editorAppMachineInterpreter.machine.context.canvasWindow?.postMessage(
        { type: "CREATE_COMPONENT", payload: createComponentPayload },
        // @ts-ignore
        "*"
      );
    }
  }

  if (update.type === "link") {
    const linkUpdate = update as LinkUpdate;
    // updates prop from the tree that is newly linked
    if (linkUpdate.rootTreeId === ComponentTreeId) {
      const treeId = linkUpdate.treeId;
      const compId = linkUpdate.refId;
      const node = compTree.nodes[compId]!;
      /**
       * It might happen that the component has not been created yet in cases such as:
       * The component has been newly created. The props are created first because the
       * component require the props for their first render.
       */
      if (node === undefined) {
        return;
      }
      const meta = node.meta;
      const manifestSchemaId = meta.manifestSchemaId;
      const pkg = meta.pkg;
      const key = meta.key;
      if (manifestSchemaId === ReactComponentManifestSchemaId) {
        // find manifest from manifest registry
        const manifestRegistry =
          manifestRegistryController.readManifestRegistry();
        const fullManifest = manifestRegistry[manifestSchemaId].manifests.find(
          (curr) => {
            return curr.pkg === pkg && curr.manifest.meta.key === key;
          }
        );
        // use CanvasAPI to create component
        if (fullManifest) {
          const manfiest =
            fullManifest.manifest as ReactComponentManifestSchema;
          const propsKeys = Object.keys(manfiest.dev.attachProps);
          // only process a link event if the tree is present in attachProps
          const foundPropKey = propsKeys.find(
            (key) => manfiest.dev.attachProps[key].treeId !== treeId
          );
          if (foundPropKey) {
            const node = compTree.nodes[compId]!;
            const componentData = createComponentFromNode(
              node,
              breakpointApi.getActiveBreakpoint()
            );
            if (componentData?.props) {
              editorAppMachineInterpreter.machine.context.canvasWindow?.postMessage(
                { type: "UPDATE_PROPS", payload: componentData },
                // @ts-ignore
                "*"
              );
            }
          }
        }
      }
    }
  }

  if (update.type === "rewire") {
    editorAppMachineInterpreter.machine.context.canvasWindow?.postMessage(
      { type: "REWIRE_COMPONENT", payload: update },
      // @ts-ignore
      "*"
    );
  }

  if (update.type === "dewire") {
    editorAppMachineInterpreter.machine.context.canvasWindow?.postMessage(
      { type: "DELETE_COMPONENT", payload: update },
      // @ts-ignore
      "*"
    );
  }
  if (update.type === "change") {
    const updatedTree = BrowserForestManager.getForest(
      currentForest.forestPkgId,
      currentForest.forestId
    )?.tree(update.treeId);
    // TODO: check if the updatedTree is in dev.attachProps
    // similar to how we handle link update above in this file
    if (updatedTree) {
      const links = Object.values(updatedTree.links);
      const link = links.find((link) => {
        return link.childId === update.id;
      });
      if (link === undefined) {
        return;
      }
      const compId = link.refId;
      const node = compTree.nodes[compId]!;
      const componentData = createComponentFromNode(
        node,
        breakpointApi.getActiveBreakpoint()
      );
      if (componentData?.props) {
        editorAppMachineInterpreter.machine.context.canvasWindow?.postMessage(
          { type: "UPDATE_PROPS", payload: componentData },
          // @ts-ignore
          "*"
        );
      }
    }
  }
});
