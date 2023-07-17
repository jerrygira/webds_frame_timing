import React, { useEffect, useState } from 'react';

import { Button, Divider, Stack } from '@mui/material';
import { VerticalStepper } from './mui_extensions/Navigation';
import { requestAPI } from '../local_exports';
import { ProgressButton } from './mui_extensions/Buttons';
import { CONTENT_FONTSIZE, InfoText } from './constants';
import FtStep1 from './FtStep1';
import FtStep2 from './FtStep2';
import FtStep3 from './FtStep3';
import Typography from '@mui/material/Typography';

export const FtStepper = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [calcInitialized, setCalcInitialized] = useState<boolean>(false);
  const [calcFailed, setCalcFailed] = useState<boolean>(false);
  const [applyFailed, setApplyFailed] = useState<boolean>(false);
  const [applyResult, setApplyResult] = useState<string>('');
  const [step, setStep] = useState(1);
  const [carouselStep, setCarouselStep] = useState(1);
  const [disableApply, setDisableApply] = useState<boolean>(true);
  const [maxFreqTransQf, setMaxFreqTransQf] = useState(0);
  const [maxFreqHybrid, setMaxFreqHybrid] = useState(0);
  const [defaultFreqTransQf, setDefaultFreqTransQf] = useState([0, 0, 0, 0]);
  const [defaultFreqTransMf, setDefaultFreqTransMf] = useState([0, 0, 0, 0]);
  const [defaultFreqHybrid, setDefaultFreqHybrid] = useState([0, 0, 0, 0]);
  const [targetFreqTrans, setTargetFreqTrans] = useState([0, 0, 0, 0]);
  const [targetFreqHybrid, setTargetFreqHybrid] = useState([0, 0, 0, 0]);
  const [tuningStrategy, setTuningStrategy] = useState(1);
  const [targetReportRate, setTargetReportRate] = useState(120);
  const [frameTimingResult, setFrameTimingResult] = useState({});
  const [progress1, setProgress1] = useState<number | undefined>(undefined);

  const SendCalculateRequest = async (): Promise<void> => {
    const dataToSend = {
      function: 'frame_timing_calculate',
      arguments: [
        targetFreqTrans,
        targetFreqHybrid,
        targetReportRate,
        tuningStrategy
      ]
    };
    try {
      const reply = await requestAPI<any>('tutor/FrameTiming', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      return Promise.resolve(reply);
    } catch (error) {
      console.error(
        `Error - POST /webds/tutor/FrameTiming\n${dataToSend}\n${error}`
      );
      return Promise.reject('Failed to calculate frame timing results');
    }
  };

  const sendSetTimingVariablesRequest = async (
    commit: boolean
  ): Promise<void> => {
    const dataToSend = {
      function: 'set_timing_variables',
      arguments: [commit]
    };
    try {
      await requestAPI<any>('tutor/FrameTiming', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      return Promise.resolve();
    } catch (error) {
      console.error(
        `Error - POST /webds/tutor/FrameTiming\n${dataToSend}\n${error}`
      );
      return Promise.reject('Failed to set frame timing variables');
    }
  };

  const handleCalcButtonClick = async () => {
    try {
      setProgress1(0);
      SendCalculateRequest().then(
        (reply) => {
          setFrameTimingResult(JSON.parse(JSON.stringify(reply)));
          setCalcInitialized(true);
          setProgress1(100);
          setCalcFailed(false);
          setApplyResult('');
          console.log(JSON.parse(JSON.stringify(reply)));
        },
        () => {
          setProgress1(undefined);
          setCalcFailed(true);
        }
      );
    } catch (error) {
      console.error(error);
      setCalcInitialized(false);
    }
  };

  const handleCalcResetButtonClick = () => {
    setProgress1(undefined);
  };

  const handleCalcDoneButtonClick = () => {
    setStep(2);
  };

  const handleApplyButtonClick = (commit: boolean) => {
    try {
      sendSetTimingVariablesRequest(commit).then(
        () => {
          setApplyFailed(false);
          setApplyResult('Success');
        },
        () => {
          setApplyFailed(true);
          setApplyResult('Failed to apply frame timing variables.');
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const CalculateStep = () => {
    return (
      <Stack direction="column" spacing={0}>
        <div></div>
        <Stack direction="row" spacing={0}>
          <ProgressButton
            progress={progress1}
            variant="contained"
            disabled={!initialized}
            onClick={() => handleCalcButtonClick()}
            onDoneClick={() => {
              handleCalcDoneButtonClick();
            }}
            onResetClick={() => {
              handleCalcResetButtonClick();
            }}
            size="small"
          >
            Calculate
          </ProgressButton>
        </Stack>
      </Stack>
    );
  };

  const ApplyStep = () => {
    return (
      <Stack direction="column">
        <div>
          <InfoText
            sx={{
              display: 'inline-block',
              whiteSpace: 'pre-line',
              fontSize: CONTENT_FONTSIZE
            }}
          >
            Review all changes in the validation panel on the right. Write them
            to RAM for temporary usage or flash for permanent usage.
          </InfoText>
        </div>
        <Stack direction="row" spacing={6}>
          <Button
            disabled={disableApply}
            variant="contained"
            onClick={(e) => handleApplyButtonClick(false)}
            sx={{ height: '40px', fontSize: '12px' }}
          >
            Write to RAM
          </Button>
          <Button
            disabled={disableApply}
            variant="contained"
            onClick={(e) => handleApplyButtonClick(true)}
            sx={{ height: '40px', fontSize: '12px' }}
          >
            {' '}
            Write to Flash
          </Button>
        </Stack>
      </Stack>
    );
  };

  const steps = [
    {
      label: 'Choose Frequencies and Desired Report Rate',
      content: (
        <>
          <InfoText>
            Frame timing tutor gathers information about the sensing frequencies
            and report rate to create the gear tables.
            <br />
            In order to achieve good noise performance, it is crucial that
            proper sensing frequencies are used.
            <br />
            Press the "Calculate" button, and frame timing tutor will populate
            the gear tables using the initial tuning strategy.
          </InfoText>
          <CalculateStep />
          {calcFailed ? (
            <Typography
              variant="body2"
              color="red"
              fontSize="13px"
              sx={{ mt: 1 }}
            >
              {'Failed to calculate frame timing'}
            </Typography>
          ) : null}
        </>
      )
    },
    {
      label: 'Select Gears'
    },
    {
      label: 'Apply Changes',
      content: (
        <>
          <ApplyStep />{' '}
          <Typography
            variant="body2"
            color={applyFailed ? 'red' : '#303f9f'}
            fontSize="13px"
            sx={{ mt: 1 }}
            align="center"
          >
            {applyResult}
          </Typography>
        </>
      )
    }
  ];

  const rightPanel: (JSX.Element | null)[] = [
    <FtStep1
      initialized={initialized}
      setInitialized={setInitialized}
      targetFreqTrans={targetFreqTrans}
      setTargetFreqTrans={setTargetFreqTrans}
      targetFreqHybrid={targetFreqHybrid}
      setTargetFreqHybrid={setTargetFreqHybrid}
      defaultFreqTransQf={defaultFreqTransQf}
      setDefaultFreqTransQf={setDefaultFreqTransQf}
      defaultFreqTransMf={defaultFreqTransMf}
      setDefaultFreqTransMf={setDefaultFreqTransMf}
      defaultFreqHybrid={defaultFreqHybrid}
      setDefaultFreqHybrid={setDefaultFreqHybrid}
      maxFreqTransQf={maxFreqTransQf}
      setMaxFreqTransQf={setMaxFreqTransQf}
      maxFreqHybrid={maxFreqHybrid}
      setMaxFreqHybrid={setMaxFreqHybrid}
      tuningStrategy={tuningStrategy}
      setTuningStrategy={setTuningStrategy}
      targetReportRate={targetReportRate}
      setTargetReportRate={setTargetReportRate}
    />,
    <FtStep2
      frameTimingResult={frameTimingResult}
      calcInitialized={calcInitialized}
      setFrameTimingResult={setFrameTimingResult}
    />,
    <FtStep3
      frameTimingResult={frameTimingResult}
      carouselStep={carouselStep}
      setCarouselStep={setCarouselStep}
      calcInitialized={calcInitialized}
    />
  ];

  useEffect(() => {
    setApplyResult('');
  }, [step]);

  useEffect(() => {
    if (!calcInitialized || carouselStep === 2) {
      setDisableApply(true);
      setApplyResult('');
    } else {
      setDisableApply(false);
    }
  }, [calcInitialized, carouselStep]);

  return (
    <Stack direction="row" sx={{ width: '100%', height: '100%' }}>
      <VerticalStepper
        steps={steps}
        activeStep={step}
        onStepClick={(s: any) => {
          setStep(s);
        }}
        sx={{ width: '40%', overflow: 'auto' }}
      />
      <Divider orientation="vertical" flexItem />

      <Stack sx={{ width: '100%', p: 1 }}>{rightPanel[step - 1]}</Stack>
    </Stack>
  );
};

export default FtStepper;
