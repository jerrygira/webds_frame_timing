import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { WidgetTracker } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { WebDSService, WebDSWidget } from "@webds/service";

import { defaultIcon } from "./icons";

import FrameTimingWidget from "./widget/FrameTimingWidget";

namespace Attributes {
  export const command = "webds_frame_timing:open";
  export const id = "webds_frame_timing_widget";
  export const label = "Frame Timing";
  export const caption = "Frame Timing";
  export const category = "Device - Config Library";
  export const rank = 60;
}

export let webdsService: WebDSService;

/**
 * Initialization data for the @webds/frame_timing extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/frame_timing:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log("JupyterLab extension @webds/frame_timing is activated!");

    webdsService = service;

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;
    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? defaultIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new FrameTimingWidget(Attributes.id);
          widget = new WebDSWidget<FrameTimingWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.icon = defaultIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, "main");

        shell.activateById(widget.id);
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: Attributes.id
    });
    restorer.restore(tracker, {
      command,
      name: () => Attributes.id
    });
  }
};

export default plugin;
