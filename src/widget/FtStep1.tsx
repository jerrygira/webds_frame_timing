import React, { useState, useEffect } from 'react';
import {
  FormControl,
  OutlinedInput,
  InputAdornment,
  Stack,
  Input
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import { ALERT_MESSAGE_READ_STATIC, FtTypography } from './constants';
import Alert from '@mui/material/Alert';

import { styled } from '@mui/material/styles';
import { requestAPI } from '../local_exports';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

let alertMessage = '';

const SectionComponent = (props: any): JSX.Element => {
  const theme = useTheme();
  const TitleText = styled(FtTypography)((props) => ({
    width: 220,
    fontSize: 12
  }));

  const LoadDefault = () => {
    return (
      <>
        <TitleText>Current/Default Sensing Frequencies</TitleText>
        {props.defaultFreqList?.map((c: any, index: any) => (
          <Input
            key={`input-${index}`}
            disabled={true}
            size="small"
            defaultValue={c}
            inputProps={{
              style: { fontSize: '12px', textAlign: 'center' } // Set the font size here
            }}
            sx={{
              m: 0.4,
              width: '7ch',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}
          />
        ))}
      </>
    );
  };

  const LoadTarget = () => {
    return (
      <>
        {props.targetFreqList != null ? (
          <>
            <TitleText>Target Sensing Frequencies</TitleText>
            {props.targetFreqList?.map((c: any, index: any) => (
              <Input
                key={`input-${index}`}
                size="small"
                defaultValue={c}
                onBlur={(e) => {
                  if (!isNaN(e.target.value as any)) {
                    let targetArr = [...props.targetFreqList];
                    targetArr[index] = Number(e.target.value);
                    props.setTargetFreqList(targetArr);
                  } else {
                    let targetArr = [...props.targetFreqList];
                    e.target.value = targetArr[index];
                  }
                }}
                inputProps={{
                  style: { fontSize: '12px', textAlign: 'center' } // Set the font size here
                }}
                sx={{
                  m: 0.4,
                  width: '7ch',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              />
            ))}
          </>
        ) : null}
      </>
    );
  };

  const LoadMax = () => {
    return (
      <>
        {props.maxFreq != null ? (
          <>
            <TitleText>Maximum Sensing Frequencies</TitleText>
            <Input
              disabled={true}
              size="small"
              defaultValue={props.maxFreq}
              inputProps={{
                style: { fontSize: '12px', textAlign: 'center' } // Set the font size here
              }}
              sx={{
                m: 0.2,
                width: '7ch',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1
              }}
            />
          </>
        ) : null}
      </>
    );
  };

  const section: any = [LoadDefault, LoadTarget, LoadMax];
  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{
        border: '1px solid',
        borderColor: theme.palette.divider,
        pb: 1
      }}
    >
      <Stack alignItems="center" sx={{ backgroundColor: 'divider' }}>
        <FtTypography variant="button" display="block">
          {props.for}{' '}
        </FtTypography>
      </Stack>
      {section.map((Component: any, index: any) => (
        <Stack
          key={`section-stack-${index}`}
          direction="column"
          sx={{
            width: '100%'
          }}
          justifyContent="flext-start"
        >
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              width: '100%',
              px: 2
            }}
            key={index}
          >
            <Component />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

export const FtStep1 = (props: any): JSX.Element => {
  const [alert, setAlert] = useState<boolean>(false);
  const theme = useTheme();

  const showAlert = (message: string) => {
    alertMessage = message;
    setAlert(true);
  };

  const sendInitRequest = async (): Promise<void> => {
    const dataToSend = {
      function: 'frame_timing_init',
      arguments: []
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
      showAlert(ALERT_MESSAGE_READ_STATIC);
      return Promise.reject('Failed to init frame timing');
    }
  };

  const handleStrategyChange = (event: SelectChangeEvent) => {
    props.setTuningStrategy(event.target.value);
  };

  const handleReportRateChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (!isNaN(event.target.value as any)) {
      props.setTargetReportRate(event.target.value);
    } else {
      props.setTargetReportRate(props.targetReportRate);
    }
  };

  const TitleText = styled(FtTypography)((props) => ({
    width: 180,
    fontSize: 12
  }));

  const LoadAdvancedSettings = () => {
    return (
      <Stack
        direction="column"
        sx={{
          width: '100%',

          border: '1px solid',
          borderColor: theme.palette.divider
        }}
        justifyContent="flext-start"
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            width: '100%',
            px: 2
          }}
        >
          <TitleText
            sx={{
              width: '18%'
            }}
          >
            Target Report Rate
          </TitleText>
          <FormControl
            size="small"
            sx={{ width: '12%', m: 1 }}
            variant="outlined"
          >
            <OutlinedInput
              id="outlined-adornment-weight"
              endAdornment={<InputAdornment position="end">Hz</InputAdornment>}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                'aria-label': 'weight',
                style: { fontSize: '12px' }
              }}
              onChange={handleReportRateChange}
              value={props.targetReportRate}
            />
          </FormControl>
          <TitleText
            sx={{
              width: '15%',
              ml: 10
            }}
          >
            Tuning Strategy
          </TitleText>
          <FormControl variant="standard" sx={{ minWidth: 150, ml: 1 }}>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={props.tuningStrategy}
              onChange={handleStrategyChange}
              label="Prioritize Report Rate"
              sx={{ fontSize: '12px' }}
            >
              <MenuItem value={0} sx={{ fontSize: '12px' }}>
                Prioritize Power
              </MenuItem>
              <MenuItem value={1} sx={{ fontSize: '12px' }}>
                Prioritize Report Rate
              </MenuItem>
              <MenuItem value={2} sx={{ fontSize: '12px' }}>
                Prioritize Filtering
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    );
  };

  useEffect(() => {
    if (!props.initialized) {
      try {
        sendInitRequest().then(
          (reply) => {
            const data = JSON.parse(JSON.stringify(reply));
            props.setMaxFreqTransQf(data?.maxFreqTransQf);
            props.setMaxFreqHybrid(data?.maxFreqHybrid);
            props.setDefaultFreqTransQf(data?.defaultFreqTransQf);
            props.setDefaultFreqTransMf(data?.defaultFreqTransMf);
            props.setDefaultFreqHybrid(data?.defaultFreqHybrid);
            props.setTargetFreqTrans(data?.defaultFreqTransQf);
            props.setTargetFreqHybrid(data?.defaultFreqHybrid);
            props.setInitialized(true);
          },
          () => {
            showAlert(ALERT_MESSAGE_READ_STATIC);
          }
        );
      } catch (error) {
        showAlert(ALERT_MESSAGE_READ_STATIC);
      }
    }
  }, []);

  return (
    <>
      {alert ? (
        <Alert
          severity="error"
          onClose={() => setAlert(false)}
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      {props.initialized ? (
        <>
          <Stack direction="column" spacing={3}>
            <Stack direction="row">{LoadAdvancedSettings()}</Stack>{' '}
            <SectionComponent
              maxFreq={props.maxFreqTransQf}
              defaultFreqList={props.defaultFreqTransQf}
              targetFreqList={props.targetFreqTrans}
              setTargetFreqList={props.setTargetFreqTrans}
              for={'Trans QF'}
            />
            <SectionComponent
              defaultFreqList={props.defaultFreqTransMf}
              for={'Trans MF'}
            />
            <SectionComponent
              maxFreq={props.maxFreqHybrid}
              defaultFreqList={props.defaultFreqHybrid}
              targetFreqList={props.targetFreqHybrid}
              setTargetFreqList={props.setTargetFreqHybrid}
              for={'Abs(Hybrid)'}
            />
          </Stack>
        </>
      ) : null}
    </>
  );
};

export default FtStep1;
