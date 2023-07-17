import React, { useEffect, useState } from 'react';

import { TouchcommADCReport } from '@webds/service';

import HybridXPlot from '../adc_plots/HybridXPlot';
import HybridYPlot from '../adc_plots/HybridYPlot';
import ImagePlot from '../adc_plots/ImagePlot';
import { requestAPI } from '../local_exports';

const SSE_CLOSED = 2;
const REPORT_FPS = 120;
const RENDER_FPS = 30;

const REPORT_DELTA = 18;
const REPORT_RAW = 19;
const REPORT_BASELINE = 20;

const RECORDED_DATA_FILE_NAME = 'adc_data.json';

const IMAGE_LENGTH = 550;
const HYBRID_HEIGHT = 60;

const HYBRIDY_L_MARGIN = 40;
const HYBRIDY_R_MARGIN = 40;
const HYBRIDY_T_MARGIN = 24;
const HYBRIDY_B_MARGIN = 32;

const HYBRIDY_L_MARGIN_TIGHT = 32;
const HYBRIDY_R_MARGIN_TIGHT = 32;
const HYBRIDY_B_MARGIN_TIGHT = 16;

const IMAGE_L_MARGIN = 0;
const IMAGE_R_MARGIN = 112;
const IMAGE_T_MARGIN = HYBRIDY_T_MARGIN;

const HYBRIDX_R_MARGIN = IMAGE_R_MARGIN;
const HYBRIDX_T_MARGIN = 10;
const HYBRIDX_B_MARGIN = 10;

let renderInterval = 1000 / RENDER_FPS;

type Margins = {
  l: number;
  r: number;
  t: number;
  b: number;
};

const zeroMargins: Margins = {
  l: 0,
  r: 0,
  t: 0,
  b: 0
};

let running: boolean;
let recording: boolean;
let saving: boolean;

let reportType: number;
let originalReport: TouchcommADCReport;
let computedReport: TouchcommADCReport | undefined;
let recordedData: TouchcommADCReport[] = [];

let eventSource: EventSource | undefined;
let eventError: boolean;
let eventCount: number;
let requestID: number | undefined;

let t0: number;
let t1: number;
let t00: number;
let t11: number;
let tThen: number;
let fps: number;

const bufferSize = 1000;
let buffer: TouchcommADCReport[];
let subBuffer: TouchcommADCReport[] | undefined;
let statistics: string;
let samples: number;
let index: number;
let filled: boolean;

let numRows: number;
let numCols: number;

const saveRecordedData = () => {
  saving = true;
  let blob = new Blob([JSON.stringify({ data: recordedData })], {
    type: 'application/json'
  });
  recordedData = [];
  saving = false;
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = RECORDED_DATA_FILE_NAME;
  link.click();
};

const updateSubBuffer = () => {
  const end = index;
  const start = index - samples;
  if (start < 0) {
    subBuffer = [...buffer.slice(start), ...buffer.slice(0, end)];
  } else {
    subBuffer = buffer.slice(start, end);
  }
};

const eventHandler = (event: any) => {
  const data = JSON.parse(event.data);
  if (!data || !data.report) {
    return;
  }

  if (
    (reportType === REPORT_DELTA && data.report[0] === 'delta') ||
    (reportType === REPORT_RAW && data.report[0] === 'raw') ||
    (reportType === REPORT_BASELINE && data.report[0] === 'baseline')
  ) {
    originalReport = data.report;
  } else {
    return;
  }

  if (
    originalReport[1].image === undefined ||
    originalReport[1].hybridx === undefined ||
    originalReport[1].hybridy === undefined ||
    buffer === undefined
  ) {
    return;
  }

  if (recording) {
    recordedData.push(originalReport);
  } else {
    if (recordedData.length > 0 && !saving) {
      saveRecordedData();
      return;
    }
  }

  eventCount++;
  t11 = Date.now();
  if (t11 - t00 >= 1000) {
    t00 = t11;
    fps = eventCount;
    eventCount = 0;
  }

  index = (index + 1) % bufferSize;
  buffer[index] = [
    originalReport[0],
    {
      image: originalReport[1].image,
      hybridx: originalReport[1].hybridx,
      hybridy: originalReport[1].hybridy
    }
  ];

  if (!filled) {
    if (index + 1 >= samples) {
      updateSubBuffer();
    } else {
      subBuffer = undefined;
    }
    if (index + 1 === bufferSize) {
      filled = true;
    }
  } else {
    updateSubBuffer();
  }
};

const errorHandler = (error: any) => {
  eventError = true;
  console.error(`Error on GET /webds/report\n${error}`);
};

const removeEvent = () => {
  if (eventSource && eventSource.readyState !== SSE_CLOSED) {
    eventSource.removeEventListener('report', eventHandler, false);
    eventSource.removeEventListener('error', errorHandler, false);
    eventSource.close();
    eventSource = undefined;
  }
};

const addEvent = () => {
  if (eventSource) {
    return;
  }
  eventError = false;
  eventSource = new window.EventSource('http://localhost:8889/webds/report');
  eventSource.addEventListener('report', eventHandler, false);
  eventSource.addEventListener('error', errorHandler, false);
};

const setReportTypes = async (
  enable: number[],
  disable: number[]
): Promise<void> => {
  const dataToSend = { enable, disable, fps: REPORT_FPS };
  try {
    await requestAPI<any>('report', {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
  } catch (error) {
    console.error(`Error - POST /webds/report\n${error}`);
    return Promise.reject('Failed to enable/disable report types');
  }
  return Promise.resolve();
};

const enableReport = async (enable: boolean) => {
  if (reportType === undefined) {
    return;
  }
  try {
    await setReportTypes(
      enable ? [reportType] : [],
      enable ? [] : [reportType]
    );
    if (enable) {
      addEvent();
    }
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};

const getMean = (): TouchcommADCReport | undefined => {
  if (subBuffer === undefined) {
    return undefined;
  }
  try {
    const mean: TouchcommADCReport = subBuffer.reduce(
      function (mean, cur) {
        if (cur === undefined) {
          return mean;
        }
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            mean[1].image[i][j] += cur[1].image[i][j] / samples;
          }
        }
        for (let i = 0; i < numCols; i++) {
          mean[1].hybridx[i] += cur[1].hybridx[i] / samples;
        }
        for (let i = 0; i < numRows; i++) {
          mean[1].hybridy[i] += cur[1].hybridy[i] / samples;
        }
        return mean;
      },
      [
        subBuffer[0][0],
        {
          image: [...Array(numRows)].map((e) => Array(numCols).fill(0)),
          hybridx: [...Array(numCols)].map((e) => 0),
          hybridy: [...Array(numRows)].map((e) => 0)
        }
      ]
    );
    return mean;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const getMax = (): TouchcommADCReport | undefined => {
  if (subBuffer === undefined) {
    return undefined;
  }
  try {
    const max: TouchcommADCReport = subBuffer.reduce(
      function (max, cur) {
        if (cur === undefined) {
          return max;
        }
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            max[1].image[i][j] =
              cur[1].image[i][j] > max[1].image[i][j]
                ? cur[1].image[i][j]
                : max[1].image[i][j];
          }
        }
        for (let i = 0; i < numCols; i++) {
          max[1].hybridx[i] =
            cur[1].hybridx[i] > max[1].hybridx[i]
              ? cur[1].hybridx[i]
              : max[1].hybridx[i];
        }
        for (let i = 0; i < numRows; i++) {
          max[1].hybridy[i] =
            cur[1].hybridy[i] > max[1].hybridy[i]
              ? cur[1].hybridy[i]
              : max[1].hybridy[i];
        }
        return max;
      },
      [
        subBuffer[0][0],
        {
          image: [...Array(numRows)].map((e) => Array(numCols).fill(-Infinity)),
          hybridx: [...Array(numCols)].map((e) => -Infinity),
          hybridy: [...Array(numRows)].map((e) => -Infinity)
        }
      ]
    );
    return max;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const getMin = (): TouchcommADCReport | undefined => {
  if (subBuffer === undefined) {
    return undefined;
  }
  try {
    const min: TouchcommADCReport = subBuffer.reduce(
      function (min, cur) {
        if (cur === undefined) {
          return min;
        }
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            min[1].image[i][j] =
              cur[1].image[i][j] < min[1].image[i][j]
                ? cur[1].image[i][j]
                : min[1].image[i][j];
          }
        }
        for (let i = 0; i < numCols; i++) {
          min[1].hybridx[i] =
            cur[1].hybridx[i] < min[1].hybridx[i]
              ? cur[1].hybridx[i]
              : min[1].hybridx[i];
        }
        for (let i = 0; i < numRows; i++) {
          min[1].hybridy[i] =
            cur[1].hybridy[i] < min[1].hybridy[i]
              ? cur[1].hybridy[i]
              : min[1].hybridy[i];
        }
        return min;
      },
      [
        subBuffer[0][0],
        {
          image: [...Array(numRows)].map((e) => Array(numCols).fill(Infinity)),
          hybridx: [...Array(numCols)].map((e) => Infinity),
          hybridy: [...Array(numRows)].map((e) => Infinity)
        }
      ]
    );
    return min;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const getRange = (): TouchcommADCReport | undefined => {
  if (subBuffer === undefined) {
    return undefined;
  }
  try {
    const max = getMax();
    const min = getMin();
    if (max === undefined || min === undefined) {
      return undefined;
    }
    const range: TouchcommADCReport = [
      subBuffer[0][0],
      {
        image: [...Array(numRows)].map((e) => Array(numCols)),
        hybridx: [...Array(numCols)],
        hybridy: [...Array(numRows)]
      }
    ];
    range[1].image = max[1].image.map(function (rArray, rIndex) {
      return rArray.map(function (maxElement, cIndex) {
        return maxElement - min[1].image[rIndex][cIndex];
      });
    });
    range[1].hybridx = max[1].hybridx.map(function (maxElement, index) {
      return maxElement - min[1].hybridx[index];
    });
    range[1].hybridy = max[1].hybridy.map(function (maxElement, index) {
      return maxElement - min[1].hybridy[index];
    });
    return range;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const stopAnimation = () => {
  if (requestID) {
    cancelAnimationFrame(requestID);
    requestID = undefined;
  }
};

const computePlot = () => {
  if (buffer === undefined) {
    computedReport = undefined;
    return;
  }

  switch (statistics) {
    case 'Single':
      computedReport = buffer[index];
      break;
    case 'Mean':
      computedReport = getMean();
      break;
    case 'Max':
      computedReport = getMax();
      break;
    case 'Min':
      computedReport = getMin();
      break;
    case 'Range':
      computedReport = getRange();
      break;
    default:
      computedReport = buffer[index];
      break;
  }
};

export const ADCLive = (props: any): JSX.Element | null => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [report, setReport] = useState<TouchcommADCReport[1]>();
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [imageMargins, setImageMargins] = useState<Margins>(zeroMargins);
  const [hybridHeight, setHybridHeight] = useState<number>(0);
  const [hybridXMargins, setHybridXMargins] = useState<Margins>(zeroMargins);
  const [hybridYMargins, setHybridYMargins] = useState<Margins>(zeroMargins);
  const [swapXY, setSwapXY] = useState<boolean>(false);

  const setWidthHeight = () => {
    if (originalReport === undefined) {
      return;
    }
    numRows = originalReport[1].image.length;
    numCols = originalReport[1].image[0].length;
    let imageWidth: number;
    let imageHeight: number;
    if (numCols > numRows) {
      imageWidth = props.length !== undefined ? props.length : IMAGE_LENGTH;
      if (props.width !== undefined) {
        imageHeight = props.width;
      } else {
        imageHeight = Math.floor((imageWidth * numRows) / numCols);
        if (props.setWidth) {
          props.setWidth(imageHeight);
        }
      }
    } else {
      imageHeight = props.length !== undefined ? props.length : IMAGE_LENGTH;
      if (props.width !== undefined) {
        imageWidth = props.width;
      } else {
        imageWidth = Math.floor((imageHeight * numCols) / numRows);
        if (props.setWidth) {
          props.setWidth(imageHeight);
        }
      }
    }
    if (props.portrait && imageWidth > imageHeight) {
      setSwapXY(true);
      setImageWidth(imageHeight);
      setImageHeight(imageWidth);
    } else {
      setSwapXY(false);
      setImageWidth(imageWidth);
      setImageHeight(imageHeight);
    }
    const hybridHeight =
      props.hybridHeight !== undefined ? props.hybridHeight : HYBRID_HEIGHT;
    setHybridHeight(hybridHeight);
    if (props.imageOnly) {
      setImageMargins(zeroMargins);
    } else {
      const hybridYLMargin = props.tight
        ? HYBRIDY_L_MARGIN_TIGHT
        : HYBRIDY_L_MARGIN;
      const hybridYRMargin = props.tight
        ? HYBRIDY_R_MARGIN_TIGHT
        : HYBRIDY_R_MARGIN;
      const hybridYTMargin = HYBRIDY_T_MARGIN;
      const hybridYBMargin = props.tight
        ? HYBRIDY_B_MARGIN_TIGHT
        : HYBRIDY_B_MARGIN;
      const hybridXLMargin =
        hybridHeight + hybridYLMargin + hybridYRMargin + IMAGE_L_MARGIN;
      const imageBMargin = hybridYBMargin;
      setImageMargins({
        l: IMAGE_L_MARGIN,
        r: IMAGE_R_MARGIN,
        t: IMAGE_T_MARGIN,
        b: imageBMargin
      });
      setHybridXMargins({
        l: hybridXLMargin,
        r: HYBRIDX_R_MARGIN,
        t: HYBRIDX_T_MARGIN,
        b: HYBRIDX_B_MARGIN
      });
      setHybridYMargins({
        l: hybridYLMargin,
        r: hybridYRMargin,
        t: hybridYTMargin,
        b: hybridYBMargin
      });
    }
  };

  const animatePlot = () => {
    if (eventError) {
      removeEvent();
      requestID = undefined;
      enableReport(true);
      requestID = requestAnimationFrame(animatePlot);
      return;
    }

    requestID = requestAnimationFrame(animatePlot);

    if (!running) {
      return;
    }

    const tNow = window.performance.now();
    const elapsed = tNow - tThen;
    if (elapsed <= renderInterval) {
      return;
    }
    tThen = tNow - (elapsed % renderInterval);

    if (!initialized) {
      if (
        originalReport === undefined ||
        originalReport[1].image === undefined ||
        originalReport[1].hybridx === undefined ||
        originalReport[1].hybridy === undefined
      ) {
        return;
      }
      setWidthHeight();
      setInitialized(true);
    }

    computePlot();
    if (computedReport === undefined) {
      return;
    }

    t1 = Date.now();
    if (t1 - t0 >= 1000) {
      t0 = t1;
      if (props.updateSampleRate) {
        props.updateSampleRate(fps);
      }
    }

    setReport(computedReport[1]);
    setShowPlot(true);
    if (props.setPlotReady) {
      props.setPlotReady(true);
    }
  };

  const startAnimation = () => {
    t0 = Date.now();
    t00 = Date.now();
    eventCount = 0;
    buffer = new Array(bufferSize);
    filled = false;
    index = bufferSize - 1;
    subBuffer = undefined;
    tThen = window.performance.now();
    requestID = requestAnimationFrame(animatePlot);
  };

  const newPlot = async () => {
    if (reportType === undefined) {
      return;
    }
    try {
      await enableReport(running);
    } catch (error) {
      console.error(error);
      return;
    }
    startAnimation();
  };

  useEffect(() => {
    if (props.renderRate !== undefined) {
      renderInterval = 1000 / props.renderRate;
    }
  }, [props.renderRate]);

  useEffect(() => {
    setWidthHeight();
  }, [props.length, props.width]);

  useEffect(() => {
    statistics = props.statistics;
  }, [props.statistics]);

  useEffect(() => {
    samples = props.samples;
  }, [props.samples]);

  useEffect(() => {
    recording = props.record;
  }, [props.record]);

  useEffect(() => {
    running = !props.halt;
    enableReport(running);
    if (props.halt) {
      removeEvent();
    }
  }, [props.halt]);

  useEffect(() => {
    running = props.run;
  }, [props.run]);

  useEffect(() => {
    const changeReportTyep = async () => {
      if (reportType !== undefined) {
        await enableReport(false);
      }
      reportType = props.reportType;
      enableReport(true);
    };
    changeReportTyep();
  }, [props.reportType]);

  useEffect(() => {
    reportType = props.reportType;
    newPlot();
    return () => {
      enableReport(false);
      stopAnimation();
      removeEvent();
    };
  }, []);

  return showPlot ? (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
        {!props.imageOnly && (
          <HybridYPlot
            width={hybridHeight}
            height={imageHeight}
            margins={hybridYMargins}
            swapXY={swapXY}
            report={report}
          />
        )}
        <ImagePlot
          width={imageWidth}
          height={imageHeight}
          margins={imageMargins}
          swapXY={swapXY}
          flip={props.flip}
          zMin={props.zMin}
          zMax={props.zMax}
          showScale={!props.imageOnly}
          report={report}
        />
      </div>
      {!props.imageOnly && (
        <HybridXPlot
          width={imageWidth}
          height={hybridHeight}
          margins={hybridXMargins}
          swapXY={swapXY}
          report={report}
        />
      )}
    </div>
  ) : null;
};

export default ADCLive;
