import React from 'react';
import axios from 'axios';
import moment from 'moment';
import clsx from 'clsx';

import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import Feedback from '@material-ui/icons/Feedback';
import Box from '@material-ui/core/Box';
import { withStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';

import './App.css';

import { getScheduleByIdApi, getPatientByIdApi, getMissedByIdApi, requestSosByIdApi } from './consts';
import MedTable from './MedTable.jsx';
import DateClock from './DateClock.jsx';
import Alerts from './Alerts.jsx';
import LoadingScreen from './LoadingScreen.jsx'

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const styles = theme => ({
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  sosButton: {
    backgroundColor: "#ff1744",
    color: "#ffffff"
  }
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patient: null, schedule: null, missed: null,
      patientId: null, setSuccess: false, successText: null,
      sosLoading: false, sosSuccess: false, snackbarSeverity: true
    }
    this.handleSuccess = this.handleSuccess.bind(this);
    this.callSos = this.callSos.bind(this);
  }

  componentDidMount() {
    // Change this line to change patientId
    let patientId = 3;
    this.setState({ patientId: patientId });

    this.retrieveSchedule(patientId);
    // every half hour check for new schedules
    this.intervalID = setInterval(() => this.retrieveSchedule(patientId), 500 * 60 * 60);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  isMedicineInTime(medTime) {
    var format = 'hh:mm'

    var currTime = moment();
    var medicalTime = moment(medTime, format);

    return medicalTime.isAfter(currTime); // true if taking medicine is not due yet
  }

  isMedicineCurrent(endDate) {
    if (endDate === null) {
      return true;
    }
    var format = 'YYYY-MM-DD HH:mm:ss.SSSSSSSSSS';
    var currDate = moment()
    var compareDate = moment(endDate, format);
    return compareDate.isAfter(currDate);
  }

  retrieveSchedule(patientId) {
    this.GetPatient(patientId);
    this.GetMedSchedule(patientId);
    this.GetMissedSchedule(patientId);
  }

  callSos() {
    if (!this.state.sosLoading) {
      this.setState({
        sosSuccess: false,
        sosLoading: true
      });

      this.RequestSosMed(this.state.patientId);
    }
  }

  async GetPatient(id) {
    try {
      const res = await axios.get(getPatientByIdApi + id);
      this.setState({
        patient: res.data
      });
    } catch (err) {
      console.log(err);
    }
  }

  async GetMissedSchedule(id) {
    try {
      const res = await axios.get(getMissedByIdApi + id);
      this.setState({
        missed: res.data
      });
    } catch (err) {
      console.log(err);
    }
  }

  async GetMedSchedule(id) {
    var dateObj = new Date()
    var weekday = dateObj.toLocaleString("en-US", { weekday: "short" }).toUpperCase()

    try {
      const res = await axios.get(getScheduleByIdApi + id);
      // filter for all entries of the current weekday + in the future
      this.setState({
        schedule: res.data.filter(x => (x.WEEKDAY === weekday) && (this.isMedicineInTime(x.TIME)) && this.isMedicineCurrent(x.END_DATE)),
      });
    } catch (err) {
      console.log(err);
    }
  }

  async RequestSosMed(id) {
    try {
      const res = await axios.get(requestSosByIdApi + id);

      // Check for result code and payload
      // if 200 -> allowed
      // 209 + payload=Blocked -> time restriction
      // 209 -> denied
      console.log(res);

      if (res.status === 200) {
        this.setState({
          sosSuccess: true,
          sosLoading: false
        })
        this.handleSuccess("Emergency medicine granted!", true);

        setTimeout(() => {this.setState({sosSuccess: false})}, 8000 )
      }
      else if (res.status === 209) {
        if (res.data === "BLOCKED") {
          this.handleSuccess("Time limit is not up to take emergency pill again...", false)
        }
        else {
          this.handleSuccess("Doctor denied your request for emergency request!", false)
        }

        this.setState({
          sosLoading: false
        });
      }
      else {
        this.setState({
          sosLoading: false
        });
        throw Error("Unknown status code from server");
      }

    } catch (err) {
      console.log(err);
    }
  }

  handleSuccess(text, success) {
    this.setState({ setSuccess: true, successText: text, snackbarSeverity: success});
    this.retrieveSchedule(this.state.patientId);
  };

  handleSuccessClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ setSuccess: false, successText: null });
  };

  render() {
    const { patient, schedule, missed, patientId, setSuccess, successText, sosSuccess, sosLoading, snackbarSeverity } = this.state;
    const { classes } = this.props;

    const buttonClassname = clsx({ [classes.buttonSuccess]: sosSuccess, [classes.sosButton]: !sosSuccess });

    // If no data has been received, display a loading screen
    if (patient === null || schedule === null) {
      // TODO ladebildschirm aufhübschen
      return (
        <LoadingScreen />
      );
    }

    if (schedule === null) {
      this.scheduleRows = null;
    }
    else {
      this.scheduleRows = schedule.map(e => {
        const { TIME, MEDICATION_NAME, DOSE, COMMENT, ID } = e;
        return { time: TIME, medName: MEDICATION_NAME, dose: DOSE, comment: COMMENT, scheduleId: ID }
      });
    }

    if (missed === null) {
      this.missedRows = null
    }
    else {
      this.missedRows = missed.map(e => {
        const { MEDICATION_NAME, TIME, DOSE, COMMENT, MED_TAKEN } = e;
        return { time: TIME, medName: MEDICATION_NAME, dose: DOSE, comment: COMMENT, med_taken: MED_TAKEN }
      });
    }

    return (
      <div className="App">
        <Grid container style={{ height: '100vh' }} spacing={3} direction="row" justify="space-evenly" alignItems="stretch">
          <Grid item xs={12}>
            <DateClock />
          </Grid>

          <Grid item xs={12}>
            <h2 className="greetings">
              Good {((moment().hours() < 12 && "Morning") || (moment().hours() < 18 && "Afternoon") || "Evening")}, <b>{patient.GIVENNAME}</b>!
            </h2>
          </Grid>

          <Grid item style={{ height: '40%' }} xs={6}>
            <h3 align="left">Next Medicines:</h3>
            <MedTable rows={this.scheduleRows} missed={false} />
          </Grid>

          <Grid item style={{ height: '40%' }} xs={6}>
            <h3 align="left">Missed Medicines:</h3>
            <MedTable rows={this.missedRows} missed={true} />
          </Grid>

          <Grid item xs={12}>
            <Box textAlign='center'>
              <div className={classes.wrapper}>
                <Button className={buttonClassname} variant="contained" disabled={sosLoading} onClick={this.callSos} startIcon={<Feedback />}>SOS</Button>
                {sosLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
              </div>
            </Box>
          </Grid>

        </Grid>

        {/* Send upcoming schedules to alerting component to create alerts */}
        <Alerts rows={this.scheduleRows} patientId={patientId} callbackSuccess={this.handleSuccess} />
        <Snackbar open={setSuccess} autoHideDuration={6000} onClose={this.handleSuccessClose}>
          <Alert onClose={this.handleSuccessClose} severity={snackbarSeverity ? "success" : "error"}>
            {successText}
          </Alert>
        </Snackbar>
      </div>
    );
  }
}

export default withStyles(styles)(App);
