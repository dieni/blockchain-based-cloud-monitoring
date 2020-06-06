import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'

const columns = [
  { id: 'startTime', label: 'Start-Time', minWidth: 170 },
  { id: 'endTime', label: 'End-Time', minWidth: 170 },
  {
    id: 'requestId',
    label: 'Request Id',
    minWidth: 170,
    align: 'right',
    format: value => value.toLocaleString()
  },
  {
    id: 'm1',
    label: 'CPUUtilization',
    minWidth: 170,
    align: 'right',
    format: value => value.toLocaleString()
  }
]

const useStyles = makeStyles({
  root: {
    width: '80%',
    margin: 'auto'
  },
  container: {
    maxHeight: 680
  }
})

export default function DataTableAWS(props) {
  const classes = useStyles()
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  let rows = []
  props.records.reverse().map(record => {
    const data = record.Record.data
    const row = {
      startTime: record.Record.startTime,
      endTime: record.Record.endTime,
      requestId: data.ResponseMetadata.RequestId,
      m1: data.MetricDataResults[0].Values[0]
    }

    rows.push(row)
  })

  return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label='sticky table'>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(row => {
                return (
                  <TableRow
                    hover
                    role='checkbox'
                    tabIndex={-1}
                    key={row.requestId}
                  >
                    {columns.map(column => {
                      const value = row[column.id]
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component='div'
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  )
}
