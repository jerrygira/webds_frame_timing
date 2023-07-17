import React from 'react';

import Stack from '@mui/material/Stack';

import { Canvas } from './mui_extensions/Canvas';
import { Content } from './mui_extensions/Content';

import { FtStepper } from './FtStepper';

export const Landing = (props: any): JSX.Element => {
  return (
    <>
      <Canvas title={'Carme Frame Timing'} sx={{ width: 1100, height: '100%' }}>
        <Content sx={{ height: 600, alignItems: 'center' }}>
          <Stack direction="row" sx={{ height: '100%' }}>
            <FtStepper></FtStepper>
          </Stack>
        </Content>
      </Canvas>
    </>
  );
};

export default Landing;
