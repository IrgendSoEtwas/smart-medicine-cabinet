import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';


class LoadingScreen extends React.Component {
    render() {
        return (
        <div className="LoadingScreen">
            <CircularProgress />
                Loading user...
        </div>);
    }
}

export default LoadingScreen;