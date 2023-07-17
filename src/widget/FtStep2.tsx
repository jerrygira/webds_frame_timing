import React, { useEffect, useState, useReducer } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Checkbox } from '@mui/material';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import Grid from '@mui/material/Grid';
import { requestAPI } from '../local_exports';
import { FrameTimingData } from './FrameTimingComponent';

enum CarmeStates {
  'STATE_TRANS_QF' = 0,
  'STATE_TRANS_MF',
  'STATE_HYBRID_X',
  'STATE_HYBRID_Y'
}

enum GearsStateTabs {
  'QF:Trans' = 0,
  'QF:HybridX',
  'QF:HybridY',
  'MF:Trans',
  'MF:HybridX',
  'MF:HybridY'
}

type GearTable = FrameTimingData[];

const GearTables: GearTable[] = [];

const GearNum = 4;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component={'span'}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export const FtStep2 = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [selectTabValue, setSelectTabValue] = React.useState(0);
  const [anchorVars, setAnchorVars] = useState<HTMLSpanElement | null>();
  const [anchorFreq, setAnchorFreq] = useState<HTMLSpanElement | null>();
  const [gearNum, setGearNum] = useState<number>(0);
  const [selectTab, setSelectTab] = useState<string>('STATE_TRANS_QF');
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const varsPopOverOpen = Boolean(anchorVars);
  const freqPopOverOpen = Boolean(anchorFreq);

  const SendUsageUpdateRequest = async (
    state: string,
    gear: number,
    freqType: string,
    usage: boolean
  ): Promise<void> => {
    const dataToSend = {
      function: 'update_gear_usage',
      arguments: [state, gear, freqType, usage]
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
      return Promise.reject('Failed to update frame timing usage');
    }
  };

  const getResultState = (tabName: string) => {
    let state: string = '';
    switch (tabName) {
      case 'QF:Trans':
        state = 'STATE_TRANS_QF';
        break;
      case 'MF:Trans':
        state = 'STATE_TRANS_MF';
        break;
      // Abs gears are the same in QF and MF modes.
      case 'QF:HybridX':
      case 'MF:HybridX':
        state = 'STATE_HYBRID_X';
        break;
      case 'QF:HybridY':
      case 'MF:HybridY':
        state = 'STATE_HYBRID_Y';
        break;
      default:
        state = 'STATE_TRANS_QF';
        break;
    }
    return state;
  };

  const generateTabs = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    const tabs = Object.keys(GearsStateTabs).filter((v) => isNaN(Number(v)));
    tabs.forEach((key) => {
      output.push(
        <Tab
          key={key}
          label={key}
          sx={{
            fontSize: 12
          }}
        />
      );
    });
    return output;
  };

  const generateGearsTable = (tabValue: number) => {
    let gearsTable = [];
    if (initialized) {
      for (let idx = 0; idx < GearNum; idx++) {
        gearsTable.push(GearTables[tabValue][idx]);
      }
    }
    return gearsTable;
  };

  const generateVarsPopOver = (): JSX.Element => {
    const output: JSX.Element[] = [];
    try {
      const varsData = {
        'Filter Bandwidth': GearTables[selectTabValue][gearNum]['bandwidth'],
        'Integration Duration': GearTables[selectTabValue][gearNum]['intDur'],
        'Reset Duration': GearTables[selectTabValue][gearNum]['resetDur'],
        'iStretch Duration': GearTables[selectTabValue][gearNum]['iStretchDur'],
        'rStretch Duration': GearTables[selectTabValue][gearNum]['rStretchDur']
      };
      output.push(
        <Grid item xs={12} key="grid-vars-title">
          Gear {gearNum} - {selectTab}
        </Grid>
      );
      for (let [k, v] of Object.entries(varsData)) {
        output.push(
          <Grid item xs={10} key={`grid-vars-key-${k}`}>
            {k}
          </Grid>
        );
        output.push(
          <Grid item xs={2} key={`grid-vars-value-${k}`}>
            {v}
          </Grid>
        );
      }
    } catch (error) {
      console.error(error);
    }
    return (
      <Box
        sx={{
          width: 150,
          fontSize: '12px',
          fontFamily: 'Arial',
          marginLeft: '5px'
        }}
      >
        <Grid container spacing={1}>
          {output}
        </Grid>
      </Box>
    );
  };

  const generateFreqPopOver = (): JSX.Element => {
    const output: JSX.Element[] = [];
    try {
      let state: string = getResultState(selectTab);
      let results = props.frameTimingResult;
      let stateResults = results[state];
      const varsData = {
        'Sensing Frequency (KHz)': 'actual_freq',
        'Calculated Report Rate (Hz)': 'frame_report_rate',
        'Report Rate w/ Multi-Burst (Hz)': 'frame_rate',
        'Maximum Report Rate (Hz)': 'actual_report_rate',
        'Frame Time (µs)': 'frame_time',
        'Frame Period (µs)': 'frame_period',
        'Frame Acquisition': 'frame_acquisition'
      };
      output.push(
        <Grid item xs={6} key="grid-freq-title-gear">
          Gear {gearNum}
        </Grid>
      );
      output.push(
        <Grid item xs={3} key="grid-freq-title-qf">
          QF
        </Grid>
      );
      output.push(
        <Grid item xs={3} key="grid-freq-title-mf">
          MF
        </Grid>
      );
      for (let [k, v] of Object.entries(varsData)) {
        let quietVal = stateResults[gearNum]['gear_quiet'][v];
        let multiVal = stateResults[gearNum]['gear_multi'][v];
        output.push(
          <Grid item xs={6} key={`grid-freq-key-${k}`}>
            {k}
          </Grid>
        );
        output.push(
          <Grid item xs={3} key={`grid-freq-quiet-${k}`}>
            {quietVal}
          </Grid>
        );
        output.push(
          <Grid item xs={3} key={`grid-freq-multi-${k}`}>
            {multiVal}
          </Grid>
        );
      }
    } catch (error) {
      console.error(error);
    }
    return (
      <Box
        sx={{
          width: 320,
          fontSize: '12px',
          fontFamily: 'Arial',
          marginLeft: '5px'
        }}
      >
        <Grid container spacing={1}>
          {output}
        </Grid>
      </Box>
    );
  };

  const handleQfConfirmChange = (row: FrameTimingData) => {
    let state: string = getResultState(row.tab);
    let usage: boolean = !row.isQfUsed;
    try {
      SendUsageUpdateRequest(state, row.gear, 'quiet', usage).then(
        (reply) => {
          props.setFrameTimingResult(JSON.parse(JSON.stringify(reply)));
        },
        () => {
          console.error('Failed to update frame timing usage');
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMfConfirmChange = (row: FrameTimingData) => {
    let state: string = getResultState(row.tab);
    let checked: boolean = !row.isMfUsed;
    try {
      SendUsageUpdateRequest(state, row.gear, 'multi', checked).then(
        (reply) => {
          props.setFrameTimingResult(JSON.parse(JSON.stringify(reply)));
        },
        () => {
          console.error('Failed to update frame timing usage');
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleVarsPopoverOpen = (
    event: React.MouseEvent<HTMLSpanElement>,
    id: number
  ) => {
    setAnchorVars(event.currentTarget);
    if (id !== undefined) {
      setGearNum(id - 1);
    }
  };

  const handleVarsPopoverClose = (event: React.MouseEvent<HTMLSpanElement>) => {
    setAnchorVars(null);
  };

  const handleFreqPopoverOpen = (
    event: React.MouseEvent<HTMLSpanElement>,
    id: number
  ) => {
    setAnchorFreq(event.currentTarget);
    setGearNum(id - 1);
  };

  const handleFreqPopoverClose = (event: React.MouseEvent<HTMLSpanElement>) => {
    setAnchorFreq(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectTabValue(newValue);
    setSelectTab(GearsStateTabs[newValue]);
  };

  const tableHeads = (): JSX.Element => {
    return (
      <>
        <TableCell
          sx={{ fontSize: 11, whiteSpace: 'normal' }}
          style={{ maxWidth: '5px' }}
        >
          Gear #
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '5px' }}
        >
          Use QF
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '5px' }}
        >
          Use MF
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '50px' }}
        >
          Filter Bandwidth
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '50px' }}
        >
          Cycles per Burst
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '60px' }}
        >
          Cycles per Additional Burst
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '50px' }}
        >
          Bursts per Cluster
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '70px' }}
        >
          Sensing Frequency(kHz)
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '40px' }}
        >
          QF Report Rate(Hz)
        </TableCell>
        <TableCell
          sx={{ fontSize: 12, whiteSpace: 'normal' }}
          style={{ maxWidth: '40px' }}
        >
          MF Report Rate(Hz)
        </TableCell>
      </>
    );
  };

  const generateTableRows = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    const rows = generateGearsTable(selectTabValue);
    rows.map((row) =>
      output.push(
        <TableRow key={row.id}>
          <TableCell align="center">
            <Typography
              fontSize="13px"
              onMouseOver={(e) => handleVarsPopoverOpen(e, row.id)}
              onMouseOut={handleVarsPopoverClose}
              sx={{ textDecoration: 'underline' }}
            >
              {row.id}
            </Typography>
          </TableCell>
          <TableCell component="th" scope="row" align="center">
            <Checkbox
              style={{
                transform: 'scale(0.7)',
                width: '10px',
                padding: 5
              }}
              checked={row.isQfUsed}
              onChange={(event) => handleQfConfirmChange(row)}
            />
          </TableCell>
          <TableCell component="th" scope="row" align="center">
            <Checkbox
              style={{
                transform: 'scale(0.7)',
                width: '10px',
                padding: 5
              }}
              checked={row.isMfUsed}
              onChange={(event) => handleMfConfirmChange(row)}
            />
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.bandwidth}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.burstSize1}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.burstSize2}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.burstPerCluster}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            <Typography
              sx={{ textDecoration: 'underline' }}
              fontSize="12px"
              onMouseOver={(e) => handleFreqPopoverOpen(e, row.id)}
              onMouseOut={handleFreqPopoverClose}
            >
              {row.frequency}
            </Typography>{' '}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.reportRateQF}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }} align="center">
            {row.reportRateMF}
          </TableCell>
        </TableRow>
      )
    );
    return output;
  };

  const generateTabPanels = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    try {
      const tabs = Object.keys(GearsStateTabs).filter((v) => isNaN(Number(v)));
      for (let idx = 0; idx < tabs.length; idx++) {
        output.push(
          <TabPanel value={selectTabValue} index={idx} key={idx}>
            <div style={{ height: 300, width: '100%' }}>
              <TableContainer component={Paper}>
                <Table sx={{ maxWidth: 850 }} size="small">
                  <TableHead>
                    <TableRow>{tableHeads()}</TableRow>
                  </TableHead>
                  <TableBody>
                    {initialized ? generateTableRows() : []}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </TabPanel>
        );
      }
    } catch (error) {
      console.error(error);
    }
    return output;
  };

  useEffect(() => {
    if (props.calcInitialized) {
      try {
        let results = props.frameTimingResult;
        const tabs = Object.values(GearsStateTabs).filter(
          (v) => !isNaN(Number(v))
        );
        GearTables.length = 0;
        for (let tabIdx = 0; tabIdx < tabs.length; tabIdx++) {
          let gearTable: GearTable = [];
          let tabName = GearsStateTabs[tabIdx];
          let state: string = getResultState(tabName);
          let stateIdx: number = CarmeStates[state as keyof typeof CarmeStates];
          let gearResults = results[state];
          for (let gearIdx = 0; gearIdx < GearNum; gearIdx++) {
            var gearResult =
              tabName.substring(0, 2) === 'MF'
                ? gearResults[gearIdx]['gear_multi']
                : gearResults[gearIdx]['gear_quiet'];

            let timingData: FrameTimingData = {
              id: gearIdx + 1,
              gear: gearIdx,
              tab: tabName,
              isFreqMulti: gearResult['is_freq_multi'],
              isFreqQuiet: gearResult['is_freq_quiet'],
              isMfUsed: gearResults[gearIdx]['gear_multi']['is_used'],
              isQfUsed: gearResults[gearIdx]['gear_quiet']['is_used'],
              bandwidth:
                gearResult['variables_table'][gearIdx]['filter_bandwidth'],
              burstSize1:
                gearResult['variables_table'][stateIdx]['burst_size1'],
              burstSize2:
                gearResult['variables_table'][stateIdx]['burst_size2'],
              iStretchDur:
                gearResult['variables_table'][stateIdx]['stretch_dur'],
              rStretchDur:
                gearResult['variables_table'][stateIdx]['rstretch_dur'],
              intDur: gearResult['param_data'][stateIdx]['int_dur'],
              resetDur: gearResult['param_data'][stateIdx]['reset_dur'],
              burstPerCluster:
                gearResult['param_data'][stateIdx]['burst_per_cluster'],
              frequency: gearResult['actual_freq'],
              reportRateQF:
                gearResults[gearIdx]['gear_quiet']['frame_report_rate'],
              reportRateMF:
                gearResults[gearIdx]['gear_multi']['frame_report_rate']
            };
            gearTable.push(timingData);
          }
          GearTables.push(gearTable);
        }
        setInitialized(true);
        forceUpdate();
      } catch (error) {
        console.error(error);
      }
    }
  }, [props.frameTimingResult, props.calcInitialized]);

  return (
    <>
      <div style={{ width: 800 }}>
        <Stack direction="row" spacing={0}>
          <Box sx={{ width: '100%', alignItems: 'flex-start' }}>
            <Tabs value={selectTabValue} onChange={handleTabChange}>
              {generateTabs()}
            </Tabs>
            {generateTabPanels()}
          </Box>
          <Popover
            anchorEl={anchorVars}
            open={varsPopOverOpen}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            sx={{
              pointerEvents: 'none',
              boxShadow: '2'
            }}
          >
            <div>
              <List>{initialized ? generateVarsPopOver() : []}</List>
            </div>
          </Popover>
          <Popover
            anchorEl={anchorFreq}
            open={freqPopOverOpen}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            sx={{
              pointerEvents: 'none',
              boxShadow: '2'
            }}
          >
            <div>
              <List>{initialized ? generateFreqPopOver() : []}</List>
            </div>
          </Popover>
        </Stack>
      </div>
    </>
  );
};

export default FtStep2;
