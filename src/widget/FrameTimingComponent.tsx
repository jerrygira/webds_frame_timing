import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Landing from './Landing';
import { requestAPI, webdsService } from './local_exports';
import { ThemeProvider } from '@mui/material/styles';
import { ALERT_MESSAGE_READ_STATIC } from './constants';

export type FrameTimingData = {
  id: number;
  gear: number;
  tab: string;
  isFreqQuiet: boolean;
  isFreqMulti: boolean;
  isQfUsed: boolean;
  isMfUsed: boolean;
  bandwidth: number;
  burstSize1: number;
  burstSize2: number;
  burstPerCluster: number;
  frequency: number;
  reportRateQF: number;
  reportRateMF: number;
  intDur: number;
  resetDur: number;
  iStretchDur: number;
  rStretchDur: number;
};

let alertMessage = '';

export const FrameTimingComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [numGears, setNumGears] = useState<number>(0);

  const webdsTheme = webdsService.ui.getWebDSTheme();

  const showAlert = (message: string) => {
    alertMessage = message;
    setAlert(true);
  };

  const initialize = async () => {
    const dataToSend: any = {
      command: 'getStaticConfig'
    };
    try {
      const staticConfig = await requestAPI<any>('command', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      setNumGears(staticConfig['freqTable[0].rstretchDur'].length);
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      showAlert(ALERT_MESSAGE_READ_STATIC);
      return;
    }
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert && (
            <Alert
              severity="error"
              onClose={() => setAlert(false)}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {alertMessage}
            </Alert>
          )}
          {initialized && <Landing numGears={numGears} />}
        </div>
      </ThemeProvider>
    </>
  );
};

export default FrameTimingComponent;
