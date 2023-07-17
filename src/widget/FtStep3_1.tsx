import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

const GearNum = 4;

enum FreqTableStates {
  STATE_TRANS_QF,
  STATE_HYBRID_X_QF,
  STATE_HYBRID_Y_QF,
  STATE_TRANS_MF,
  STATE_HYBRID_X_MF,
  STATE_HYBRID_Y_MF
}

export const FtStep3_1 = (props: any): JSX.Element => {
  const generateVarsTable = (): JSX.Element => {
    const output: JSX.Element[] = [];
    try {
      const states = Object.keys(FreqTableStates).filter((v) =>
        isNaN(Number(v))
      );
      states.forEach((state) => {
        let freqType: string = '';
        let stretchDur: string = '';
        let rstretchDur: string = '';
        let burstSize1: string = '';
        let burstSize2: string = '';
        let filtBW: string = '';
        let disableFreq: string = '';
        let varsTable: any = {};
        let carmeStateIdx: number = 0;
        let carmeStateKey: string = '';
        switch (state) {
          case 'STATE_TRANS_QF':
            carmeStateIdx = 0;
            carmeStateKey = state;
            break;
          case 'STATE_TRANS_MF':
            carmeStateIdx = 1;
            carmeStateKey = state;
            break;
          // Abs gears are the same in QF and MF modes.
          case 'STATE_HYBRID_X_QF':
          case 'STATE_HYBRID_X_MF':
            carmeStateIdx = 2;
            carmeStateKey = state.substring(0, state.length - 3);
            break;
          case 'STATE_HYBRID_Y_QF':
          case 'STATE_HYBRID_Y_MF':
            carmeStateIdx = 3;
            carmeStateKey = state.substring(0, state.length - 3);
            break;
          default:
            carmeStateIdx = 0;
            carmeStateKey = 'STATE_TRANS_QF';
        }
        let gearResults = props.frameTimingResult[carmeStateKey];
        if (state.substr(state.length - 2) === 'QF') {
          freqType = 'gear_quiet';
        } else {
          freqType = 'gear_multi';
        }
        for (let gearIdx = 0; gearIdx < GearNum; gearIdx++) {
          varsTable =
            gearResults[gearIdx][freqType]['variables_table'][carmeStateIdx];
          stretchDur = stretchDur.concat(varsTable['stretch_dur'] + ',');
          rstretchDur = rstretchDur.concat(varsTable['rstretch_dur'] + ',');
          burstSize1 = burstSize1.concat(varsTable['burst_size1'] + ',');
          burstSize2 = burstSize2.concat(varsTable['burst_size2'] + ',');
          filtBW = filtBW.concat(varsTable['filter_bandwidth'] + ',');
          disableFreq = disableFreq.concat(
            varsTable['disable_frequency'] + ','
          );
        }

        output.push(
          <TableRow key={`${state}-vars`}>
            <TableCell key={`${state}-prefix`}>
              <Typography fontSize="13px" variant="body2">
                {varsTable['str_name_prefix']}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-stretchDur`}>
              <Typography fontSize="13px" variant="body2">
                {stretchDur.replace(/,*$/, '')}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-rstretchDur`}>
              <Typography fontSize="13px" variant="body2">
                {rstretchDur.replace(/,*$/, '')}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-burstSize1`}>
              <Typography fontSize="13px" variant="body2">
                {burstSize1.replace(/,*$/, '')}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-burstSize2`}>
              <Typography fontSize="13px" variant="body2">
                {burstSize2.replace(/,*$/, '')}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-filtBW`}>
              <Typography fontSize="13px" variant="body2">
                {filtBW.replace(/,*$/, '')}
              </Typography>
            </TableCell>
            <TableCell key={`${state}-disableFreq`}>
              <Typography fontSize="13px" variant="body2">
                {disableFreq}
              </Typography>
            </TableCell>
          </TableRow>
        );
      });
    } catch (error) {
      console.error(error);
    }
    return <>{output}</>;
  };

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {props.calcInitialized ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'divider' }}>
                    <TableCell
                      key={`head-prefix`}
                      sx={{
                        fontSize: 13
                      }}
                    ></TableCell>
                    <TableCell
                      key={`head-stretchDur`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      stretchDur
                    </TableCell>
                    <TableCell
                      key={`head-rstretchDur`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      rstretchDur
                    </TableCell>
                    <TableCell
                      key={`head-burstSize1`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      burstSize1
                    </TableCell>
                    <TableCell
                      key={`head-burstSize2`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      burstSize2
                    </TableCell>
                    <TableCell
                      key={`head-filtBW`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      filtBW
                    </TableCell>
                    <TableCell
                      key={`head-disableFreq`}
                      sx={{
                        fontSize: 13
                      }}
                    >
                      disableFreq
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{generateVarsTable()}</TableBody>
              </Table>
            </TableContainer>
          </>
        ) : null}
      </div>
    </>
  );
};

export default FtStep3_1;
