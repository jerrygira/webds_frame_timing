import { FtStep1 } from './FtStep1';
import { FtStep2 } from './FtStep2';
import { FtStep3 } from './FtStep3';
import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ALERT_MESSAGE_READ_STATIC =
  'Failed to read static config and obtain frame timing information from device. Please ensure device and running firmware support Carme frame timing.';

export const CONTENT_FONTSIZE = 13;
export const STEP_LIST = [FtStep1, FtStep2, FtStep3];

export const FtTypography = styled(Typography)((props) => ({
  display: 'inline-block',
  whiteSpace: 'pre-line',
  fontSize: CONTENT_FONTSIZE
}));

export const InfoText = styled(FtTypography)((props) => ({
  padding: '0px 0px 16px 8px',
  minHeight: 50
}));

export type SelectDataMetricContent = [...(string | number)[]];
export type TuneDataContent = [string, string, ...number[]];
