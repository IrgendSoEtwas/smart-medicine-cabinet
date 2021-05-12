import React from 'react';
import moment from 'moment';

let format = 'dddd, MMMM Do, YYYY, HH:mm:ss';

class DateClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            time: moment().format(format)
        };
    }

    componentDidMount() {
        this.intervalID = setInterval(
            () => this.tick(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    tick() {
        this.setState({
          time: moment().format(format)
        });
      }

    render() {
        return (
            <p className="clock">
                Today is {this.state.time}.
            </p>
        );
    }
}

export default DateClock;