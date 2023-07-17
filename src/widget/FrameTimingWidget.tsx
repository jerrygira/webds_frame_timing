import React from "react";

import { ReactWidget } from "@jupyterlab/apputils";

import FrameTimingComponent from "./FrameTimingComponent";

export class FrameTimingWidget extends ReactWidget {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + "_component"}>
        <FrameTimingComponent />
      </div>
    );
  }
}

export default FrameTimingWidget;
