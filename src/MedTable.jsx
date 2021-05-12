import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import { red, green } from '@material-ui/core/colors';
import EmojiEmotionsIcon from '@material-ui/icons/EmojiEmotions';

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: (props) => props.missed ? red[500] : green[500],
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);

class MedTable extends React.Component {
    constructor(props) {
        super(props);

        this.columns = [
            { field: 'time', headerName: 'Time', width: 100, sortable: false },
            { field: 'medName', headerName: 'Medication Name', width: 200, sortable: false },
            { field: 'dose', headerName: 'Dose', width: 100, sortable: false },
            { field: 'comment', headerName: 'Comment', width: 300, sortable: false }
        ];
    }

    render() {
        const { rows, missed } = this.props;

        if (!Array.isArray(rows) || !rows.length) {
            return (
                <p>Nothing to do <EmojiEmotionsIcon style={{ color: green[600] }}/></p>
            );
        }

        return (
            <TableContainer className='med-schedule'>
                <Table>
                    <TableHead>
                        <StyledTableRow>
                            {this.columns.map((c, index) => {
                                return (<StyledTableCell key={index} align="center" sortDirection={false} missed={missed ? 1 : 0}>{c.headerName}</StyledTableCell>)
                            })}
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <StyledTableRow key={index}>
                                <StyledTableCell align="center">{row.time}</StyledTableCell>
                                <StyledTableCell align="center">{row.medName}</StyledTableCell>
                                <StyledTableCell align="center">{row.dose}</StyledTableCell>
                                <StyledTableCell align="center">{row.comment}</StyledTableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };
}

export default MedTable;