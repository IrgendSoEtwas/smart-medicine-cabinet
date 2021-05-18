import React from 'react';
import moment from 'moment';
import axios from 'axios';
import Countdown from 'react-countdown';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import LocalHospital from '@material-ui/icons/LocalHospital';

import { logMedicineApi } from './consts';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const renderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      return <b>You missed to take your medicine! It has been logged.</b>;
    } else {
      return <span>{minutes}:{seconds}</span>;
    }
  };

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

class Alerts extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timer: [],
            open: false,
            setOpen: false,
            scheduleId: null,
            medName: null,
            dose: null,
            comment: null,
            setSuccess: false,
            successText: null,
            countdownDate: null,
            medButtonDisabled: false,
            playAudio: false
        }
        this.togglePlay = this.togglePlay.bind(this);
        this.audio = null;
    }

    componentDidMount() {
        this.generateAlerts();
    }

    componentWillUnmount() {
        this.state.timer.forEach(e => { clearTimeout(e) });
    }

    generateAlerts() {
        const { rows } = this.props;

        if (!Array.isArray(rows) || !rows.length) {
            return;
        }
        //console.log(rows);

        //this.showAlert(rows[0].scheduleId, rows[0].medName, rows[0].dose, rows[0].comment);
        //this.showAlert(35, "Vitamines", "1 Pill", "Comments here");

        // clear old timer
        this.state.timer.forEach(e => { clearTimeout(e) });
        this.setState({ timer: [] });

        rows.forEach(e => {
            var time = moment(e.time, 'hh:mm');
            var diff = time.diff(moment());

            console.log("Another time set in " + diff / 60000 + " mins");

            var timer = setTimeout(() => this.showAlert(e.scheduleId, e.medName, e.dose, e.comment), diff);
            this.setState({ timer: [...this.state.timer, timer] })
        });
    }

    showAlert(schedId, medName, dose, comment) {
        var countdownTo = Date.now() + 1000 * 60 * 10; // 10 mins until med is missed and log
        this.setState({
            setOpen: true,
            scheduleId: schedId,
            medName: medName,
            dose: dose,
            comment: comment,
            countdownDate: countdownTo
        })
        this.prepareSound();
        this.togglePlay();
    }

    handleClose = () => {
        this.togglePlay();
        this.setState({ setOpen: false });
    };

    handleSuccess(text) {
        this.setState({ setSuccess: true, successText: text });
    };

    handleSuccessClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ setSuccess: false, successText: null });
    };

    handleTakeMedicine(scheduleId) {
        // If Button was triggered to take medcine, log true
        this.logMedTaken(scheduleId, true);
    };

    prepareSound() {
        this.setState({
            playAudio: false
          });

          this.audio = new Audio("/alarm.mp3");
          this.audio.addEventListener('ended', function () {
            this.currentTime = 0;
            this.play();
          }, false);
    }

    togglePlay() {
        const wasPlaying = this.state.playAudio;
        this.setState({
            playAudio: !wasPlaying
        });

        if (wasPlaying) {
          this.audio.pause();
        } else {
          this.audio.play()
        }
      }

    getDate() {
        var d = new Date(),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear(),
            hour = '' + d.getHours(),
            min = '' + d.getMinutes(),
            sec = '' + d.getSeconds();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        if (hour.length < 2)
            hour = '0' + hour;
        if (min.length < 2)
            min = '0' + min;
        if (sec.length < 2)
            sec = '0' + sec;

        let date = [year, month, day].join('-')
        let time = [hour, min, sec].join('.')
        // format: yyyy-mm-dd-hh.mm.ss
        return date + '-' + time;
    }

    logMedTaken(scheduleId, status) {
        axios.post(logMedicineApi, {
            "scheduleId": scheduleId,
            "patientId": this.props.patientId,
            "medTaken": status,
            "logTime": this.getDate()
        })
            .then((response) => {
                console.log(response);
                if (response.status === 200) {
                    // If success, close alert and create success popup in main window
                    this.props.callbackSuccess("Successfully logged the medication intake!", true);
                    this.handleClose();
                }
                else {
                    this.handleSuccess("Error tracking meds!")
                    console.log(response);
                }
            }, (error) => {
                this.handleSuccess("Error tracking meds (network related)!")
                console.log(error);
            });
    }

    missedMed(scheduleId) {
        // this.togglePlay();
        this.setState({medButtonDisabled: true})
        this.handleSuccess("Missed medication!")
        this.logMedTaken(scheduleId, false);
    }

    render() {
        const { scheduleId, medName, dose, comment, setOpen, setSuccess, successText, countdownDate, medButtonDisabled } = this.state;

        return (
            <Dialog fullScreen open={setOpen} onClose={this.handleClose} TransitionComponent={Transition}>
                <AppBar className='appBarAlert' style={{ background: '#BA000D' }}>
                    <Toolbar>
                        <Typography variant="h6" className='titleAlert'>
                            Alert! Time to take your meds!
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Grid container className={`alertDialog ${medButtonDisabled ? "noanimation" : ""}`}>
                    <Grid item className='messageAlert'>
                        <p>
                            It's time to take the medicine: {medName}! ({scheduleId}) <br />
                            Dose: {dose} <br />
                            Comments: {comment}
                        </p>
                    </Grid>
                    <Grid item>
                        <Button className="medButton" disabled={medButtonDisabled} onClick={() => { this.handleTakeMedicine(scheduleId) }} variant="contained" style={{ backgroundColor: "#14a37f", color: "#ffffff", marginTop: "30px", marginBottom: "10px" }} startIcon={<LocalHospital />}>Take Medicine (open cabinet)</Button>
                    </Grid>
                    <Grid item>
                        <Countdown date={countdownDate} renderer={renderer} onComplete={() => { this.missedMed(scheduleId) }} zeroPadTime={2} />
                    </Grid>
                </Grid>

                <Snackbar open={setSuccess} autoHideDuration={6000} onClose={this.handleSuccessClose}>
                    <Alert onClose={this.handleSuccessClose} severity="warning">
                        {successText}
                    </Alert>
                </Snackbar>
            </Dialog>
        );
    };
}

export default Alerts;
