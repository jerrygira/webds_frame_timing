import React, { useEffect, useState } from 'react';

import Plot from 'react-plotly.js';

import { useTheme } from '@mui/material/styles';
import { TouchcommADCReport } from '@webds/service';
const PLOT_WIDTH = 0;
const PLOT_HEIGHT = 0;

let plotMargins = {
  l: 0,
  r: 0,
  t: 0,
  b: 0
};

let heatZ: number[][] | undefined;
let heatZMin: number | undefined;
let heatZMax: number | undefined;

const plotConfig = { displayModeBar: false };
const paperBgColor = 'rgba(0, 0, 0, 0)';

const transpose = (matrix: number[][]): number[][] => {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
};

const computePlot = (props: any, report: TouchcommADCReport[1]) => {
  heatZ = report.image;

  if (heatZ === undefined) {
    return;
  }

  if (props.swapXY) {
    heatZ = transpose(heatZ);
  }

  if (props.flip?.h) {
    if (props.swapXY) {
      heatZ = heatZ.map((item) => item.reverse());
    } else {
      heatZ = heatZ.reverse();
    }
  }

  if (props.flip?.v) {
    if (props.swapXY) {
      heatZ = heatZ.reverse();
    } else {
      heatZ = heatZ.map((item) => item.reverse());
    }
  }

  const minRow = heatZ.map((row: number[]) => {
    return Math.min.apply(Math, row);
  });
  heatZMin = Math.min.apply(Math, minRow);
  const maxRow = heatZ.map((row: number[]) => {
    return Math.max.apply(Math, row);
  });
  heatZMax = Math.max.apply(Math, maxRow);
};

export const ImagePlot = (props: any): JSX.Element | null => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [heatData, setHeatData] = useState<any>([]);
  const [heatConfig, setHeatConfig] = useState<any>({});
  const [heatLayout, setHeatLayout] = useState<any>({});
  const [heatFrames, setHeatFrames] = useState<any>([]);

  const theme = useTheme();

  const storeHeatState = (figure: any) => {
    setHeatData(figure.data);
    setHeatConfig(figure.config);
    setHeatLayout(figure.layout);
    setHeatFrames(figure.frames);
  };

  const renderPlot = (report: TouchcommADCReport[1]) => {
    computePlot(props, report);

    if (heatZ === undefined) {
      return;
    }

    const w = props.width !== undefined ? props.width : PLOT_WIDTH;
    const h = props.height !== undefined ? props.height : PLOT_HEIGHT;
    const m = props.margins !== undefined ? props.margins : plotMargins;

    setHeatLayout({
      width: w + m.l + m.r,
      height: h + m.t + m.b,
      margin: m,
      font: {
        color: theme.palette.text.primary
      },
      paper_bgcolor: paperBgColor,
      xaxis: {
        ticks: '',
        showticklabels: false
      },
      yaxis: {
        ticks: '',
        showticklabels: false
      }
    });
    setHeatData([
      {
        z: heatZ,
        zmin: props.zMin !== undefined ? props.zMin : heatZMin,
        zmax: props.zMax !== undefined ? props.zMax : heatZMax,
        type: 'heatmap',
        showscale: props.showScale !== undefined ? props.showScale : true,
        colorscale: 'Viridis',
        colorbar: {
          tickformat: '<-d',
          tickmode: 'array',
          tickvals: [
            props.zMin !== undefined ? props.zMin : heatZMin,
            props.zMax !== undefined ? props.zMax : heatZMax
          ]
        }
      }
    ]);

    setShowPlot(true);
  };

  useEffect(() => {
    if (props.report === undefined) {
      return;
    }
    if (!initialized) {
      setHeatConfig(plotConfig);
      setInitialized(true);
    }
    renderPlot(props.report);
    return () => {
      heatZ = undefined;
      heatZMin = undefined;
      heatZMax = undefined;
    };
  }, [props]);

  return showPlot ? (
    <Plot
      data={heatData}
      config={heatConfig}
      layout={heatLayout}
      frames={heatFrames}
      onInitialized={(figure) => storeHeatState(figure)}
      onUpdate={(figure) => storeHeatState(figure)}
    />
  ) : null;
};

export default ImagePlot;
