import reactSchemaId from "@atrilabs/react-component-manifest-schema?id";
import type {
  AcceptsChildFunction,
  ReactComponentManifestSchema,
} from "@atrilabs/react-component-manifest-schema";
import {
  flexRowSort,
  flexColSort,
} from "@atrilabs/react-component-manifest-schema";
import iconSchemaId from "@atrilabs/component-icon-manifest-schema?id";
import CSSTreeId from "@atrilabs/app-design-forest/src/cssTree?id";
import { CSSTreeOptions } from "@atrilabs/app-design-forest";

const acceptsChild: AcceptsChildFunction = (info: any) => {
  if (info.childCoordinates.length === 0) {
    return 0;
  }
  const display: "block" | "inline-block" | "table" =
    info.props.styles["display"] || "block";
  let index = 0;
  // TODO: the logic is incorrect.
  switch (display) {
    case "inline-block":
      index = flexRowSort(info.loc, info.childCoordinates) || 0;
      break;
    case "block" || "block":
      index = flexColSort(info.loc, info.childCoordinates) || 0;
      break;
    default:
      index = flexColSort(info.loc, info.childCoordinates) || 0;
  }
  return index;
};

const cssTreeOptions: CSSTreeOptions = {
  boxShadowOptions: true,
  css2DisplayOptions: true,
  flexContainerOptions: false,
  flexChildOptions: true,
  positionOptions: true,
  typographyOptions: true,
  spacingOptions: true,
  sizeOptions: true,
  borderOptions: true,
  outlineOptions: true,
  backgroundOptions: true,
  miscellaneousOptions: true,
};

const compManifest: ReactComponentManifestSchema = {
  meta: { key: "Div", category: "Layout" },
  dev: {
    decorators: [],
    attachProps: {
      styles: {
        treeId: CSSTreeId,
        initialValue: {},
        treeOptions: cssTreeOptions,
        canvasOptions: { groupByBreakpoint: true },
      },
    },
    attachCallbacks: {
      onClick: [{ type: "do_nothing" }],
    },
    acceptsChild,
    defaultCallbackHandlers: {},
  },
};

const iconManifest = {
  panel: { comp: "CommonIcon", props: { name: "Div" } },
  drag: {
    comp: "CommonIcon",
    props: {
      name: "Div",
      containerStyle: { padding: "1rem" },
    },
  },
  renderSchema: compManifest,
};

export default {
  manifests: {
    [reactSchemaId]: compManifest,
    [iconSchemaId]: iconManifest,
  },
};
