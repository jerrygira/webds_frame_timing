import React, { useEffect, useState } from 'react';

import Plot from 'react-plotly.js';

import { useTheme } from '@mui/material/styles';
import { TouchcommADCReport } from '@webds/service';

const PLOT_WIDTH = 0;
const PLOT_HEIGHT = 60;

let plotMargins = {
  l: 0,
  r: 0,
  t: 0,
  b: 0
};

let barX: number[] | undefined;
let barXMin: number | undefined;
let barXMax: number | undefined;

const plotConfig = { displayModeBar: false };
const plotBgColor = 'rgba(0.75, 0.75, 0.75, 0.1)';
const paperBgColor = 'rgba(0, 0, 0, 0)';
const axisLineColor = 'rgba(128, 128, 128, 0.5)';

const computePlot = (swapXY: boolean, report: TouchcommADCReport[1]) => {
  barX = swapXY ? report.hybridy : report.hybridx;

  if (barX === undefined) {
    return;
  }

  barXMin = Math.min.apply(Math, barX);
  barXMax = Math.max.apply(Math, barX);
};

export const HybridXPlot = (props: any): JSX.Element | null => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [barXData, setBarXData] = useState<any>([]);
  const [barXConfig, setBarXConfig] = useState<any>({});
  const [barXLayout, setBarXLayout] = useState<any>({});
  const [barXFrames, setBarXFrames] = useState<any>([]);

  const theme = useTheme();

  const storeBarXState = (figure: any) => {
    setBarXData(figure.data);
    setBarXConfig(figure.config);
    setBarXLayout(figure.layout);
    setBarXFrames(figure.frames);
  };

  const renderPlot = (report: TouchcommADCReport[1]) => {
    computePlot(props.swapXY, report);

    if (barX === undefined) {
      return;
    }

    const w = props.width !== undefined ? props.width : PLOT_WIDTH;
    const h = props.height !== undefined ? props.height : PLOT_HEIGHT;
    const m = props.margins !== undefined ? props.margins : plotMargins;

    setBarXLayout({
      width: w + m.l + m.r,
      height: h + m.t + m.b,
      margin: m,
      font: {
        color: theme.palette.text.primary
      },
      plot_bgcolor: plotBgColor,
      paper_bgcolor: paperBgColor,
      xaxis: {
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: '',
        tickformat: '>-d',
        tickmode: 'array',
        tickvals: [],
        linecolor: axisLineColor
      },
      yaxis: {
        mirror: true,
        showline: true,
        showgrid: false,
        ticks: '',
        tickformat: '>-d',
        tickmode: 'array',
        tickvals: [barXMin, barXMax],
        range: [barXMin, barXMax],
        linecolor: axisLineColor,
        zerolinecolor: axisLineColor
      }
    });
    setBarXData([
      {
        y: barX,
        type: 'bar',
        width: 0.5
      }
    ]);

    setShowPlot(true);
  };

  useEffect(() => {
    if (props.report === undefined) {
      return;
    }
    if (!initialized) {
      setBarXConfig(plotConfig);
      setInitialized(true);
    }
    renderPlot(props.report);
    return () => {
      barX = undefined;
      barXMin = undefined;
      barXMax = undefined;
    };
  }, [props]);

  return showPlot ? (
    <Plot
      data={barXData}
      config={barXConfig}
      layout={barXLayout}
      frames={barXFrames}
      onInitialized={(figure: any) => storeBarXState(figure)}
      onUpdate={(figure: any) => storeBarXState(figure)}
    />
  ) : null;
};

export default HybridXPlot;
