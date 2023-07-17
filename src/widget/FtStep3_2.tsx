import React, { useState } from 'react';

import CircularProgress from '@mui/material/CircularProgress';

import ADCLive from './adc_plots/ADCLive';

const REPORT_RAW = 19;

export const FtStep3_2 = (props: any): JSX.Element => {
  const [plotReady, setPlotReady] = useState<boolean>(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <ADCLive
        portrait
        length={320}
        hybridHeight={48}
        run={true}
        reportType={REPORT_RAW}
        imageOnly={false}
        showScale={true}
        setPlotReady={setPlotReady}
      />
      {!plotReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CircularProgress color="primary" />
        </div>
      )}
    </div>
  );
};

export default FtStep3_2;
